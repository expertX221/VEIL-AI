import {createServer} from 'node:http';
import {readFile,access} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {isInsideRoot} from './lib/path-guard.mjs';
import {fileURLToPath} from 'node:url';

const ROOT=resolve(fileURLToPath(new URL('.',import.meta.url)));
const PORT=Number(process.env.PORT||8787);
const HOST='127.0.0.1'; // Deliberately NOT bound to 0.0.0.0
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.wasm':'application/wasm','.json':'application/json; charset=utf-8'};
try{
  const file=await readFile(join(ROOT,'.env'),'utf8');
  for(const line of file.split(/\r?\n/)){
    const m=line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if(m&&!Object.prototype.hasOwnProperty.call(process.env,m[1]))process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'').trim();
  }
}catch{}
function json(res,code,obj){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj))}
async function readBody(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>18_000)throw new Error('Request exceeds 18 KB safety limit');chunks.push(chunk)}return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
async function serveStatic(req,res){
 const url=new URL(req.url,`http://${HOST}:${PORT}`);
 let pathname;try{pathname=decodeURIComponent(url.pathname)}catch{return json(res,400,{error:'Bad URL'})}
 if(pathname==='/')pathname='/index.html';
 if(pathname.includes('..')||pathname.includes('\\')||pathname.startsWith('/.')||pathname.includes('/.')||!['.html','.css','.js','.mjs','.wasm'].includes(extname(pathname)))return json(res,403,{error:'Forbidden path'});
 const target=resolve(ROOT,'.'+pathname);
 if(!isInsideRoot(ROOT,target))return json(res,403,{error:'Forbidden path'});
 try{const content=await readFile(target);res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; img-src 'self' blob: data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(content)}catch{return json(res,404,{error:'Not found'})}
}
async function infer(req,res){
 const origin=req.headers.origin;
 if(origin&&origin!==`http://${HOST}:${PORT}`&&origin!==`http://localhost:${PORT}`)return json(res,403,{error:'Invalid origin'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return json(res,415,{error:'JSON required'});
 const provider=(process.env.AI_PROVIDER||'groq').toLowerCase();
 const keys={groq:process.env.GROQ_API_KEY,gemini:process.env.GEMINI_API_KEY,openai:process.env.OPENAI_API_KEY};
 if(!['groq','gemini','openai'].includes(provider))return json(res,503,{error:'Unknown AI_PROVIDER. Use groq, gemini or openai.'});
 if(!keys[provider])return json(res,503,{error:`${provider} is not configured. Add the matching API key to .env.`});
 let input;try{input=await readBody(req)}catch{return json(res,400,{error:'Malformed or oversized request'})}
 const prompt=input?.prompt;
 if(typeof prompt!=='string'||prompt.length<1||prompt.length>10000)return json(res,400,{error:'Invalid prompt length'});
 if(/\[\[secret:/i.test(prompt))return json(res,422,{error:'Unprocessed secret marker detected; request blocked'});
 // This gateway cannot prove arbitrary free-text prompts contain no secrets.
 // User must inspect/approve the exact payload in the browser before calling this.
 try{
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),30000);
   let upstream;
   try{
     if(provider==='gemini'){
       const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
       upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',signal:controller.signal,headers:{'x-goog-api-key':keys.gemini,'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:400}})});
     }else{
       const model=provider==='groq'?(process.env.GROQ_MODEL||'llama-3.3-70b-versatile'):(process.env.OPENAI_MODEL||'gpt-4.1-mini');
       const endpoint=provider==='groq'?'https://api.groq.com/openai/v1/chat/completions':'https://api.openai.com/v1/chat/completions';
       const data={model,max_tokens:350,messages:[{role:'system',content:'You are concise. [PRIVATE_N] placeholders are undisclosed. Do not infer or guess protected values.'},{role:'user',content:prompt}]};
       if(provider==='openai'){delete data.max_tokens;data.max_completion_tokens=350;data.store=false;}
       upstream=await fetch(endpoint,{method:'POST',signal:controller.signal,headers:{'Authorization':`Bearer ${keys[provider]}`,'Content-Type':'application/json'},body:JSON.stringify(data)});
     }
   }
   finally{clearTimeout(timeout)}
   if(!upstream.ok)return json(res,502,{error:`External inference API rejected the request (HTTP ${upstream.status}). Check model, quota, or credentials.`});
   const response=await upstream.json();const reply=provider==='gemini'?response?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join(''):response?.choices?.[0]?.message?.content;
   if(typeof reply!=='string')return json(res,502,{error:'Unexpected provider response'});
   return json(res,200,{reply,provider});
 }catch(error){return json(res,502,{error:error.name==='AbortError'?'Provider request timed out':'Provider connection failed'})}
}
export async function handler(req,res){
 const route=new URL(req.url,`http://${HOST}:${PORT}`).pathname.replace(/\/+$/,'')||'/';
 if(route==='/favicon.ico' && (req.method==='GET'||req.method==='HEAD')){res.writeHead(204,{'Cache-Control':'no-store'});return res.end();}
 if(route==='/api/status'&&req.method==='GET'){let rustReady=false;try{await access(join(ROOT,'rust','veil-ss','pkg','veil_ss.js'));rustReady=true}catch{}const provider=(process.env.AI_PROVIDER||'groq').toLowerCase();const creds={groq:process.env.GROQ_API_KEY,gemini:process.env.GEMINI_API_KEY,openai:process.env.OPENAI_API_KEY};const models={groq:process.env.GROQ_MODEL||'llama-3.3-70b-versatile',gemini:process.env.GEMINI_MODEL||'gemini-2.5-flash',openai:process.env.OPENAI_MODEL||'gpt-4.1-mini'};return json(res,200,{providerConfigured:!process.env.VERCEL&&!!creds[provider],provider,model:models[provider],rustReady});}
 if(route==='/api/infer'&&req.method==='POST'){if(process.env.VERCEL)return json(res,503,{error:'Live inference is available in the local cockpit.'});return infer(req,res);}
 if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed'});
 return serveStatic(req,res);
}
if (!process.env.VERCEL) createServer(handler).listen(PORT,HOST,()=>{
 console.log(`\nVEIL//AI private console running at http://${HOST}:${PORT}`);
 console.log(`Provider: ${process.env.AI_PROVIDER||'groq'} — ${process.env.GROQ_API_KEY||process.env.GEMINI_API_KEY||process.env.OPENAI_API_KEY?'key present':'no key; local demo available'}`);
 console.log('Sensitive prompt contents and key shares are not written to server logs.\n');
});

