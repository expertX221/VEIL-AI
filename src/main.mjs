import {generateKey,splitKey,recoverKey,encryptText,decryptText,redactMarkedSecrets,toBase64,fromBase64,parseShareRecord} from './crypto.mjs';
import {Constellation} from './scene.mjs';

const $ = (id) => document.getElementById(id);
const TEMPLATES = {
  briefing: 'Create an executive briefing for [[secret:Project Nimbus]] covering the [[secret:Q4 strategy review]] and the [[secret:client renewal risk]]. Keep the output concise and do not expose internal details.',
  incident: 'Summarize the incident response timeline for [[secret:Datacenter-7]] involving [[secret:token compromise 9FX2-881]]. Provide remediation steps but never reveal the secret values.',
  compliance: 'Prepare a compliance summary for [[secret:Account 77841]] and [[secret:Regulation Review Window]]. Include action items but exclude all confidential identifiers.'
};

const state = {
  shares: [],
  selected: [],
  vaultId: null,
  createdInSession: false,
  exportCursor: 0,
  envelope: null,
  reviewedPrompt: '',
  providerReady: false,
  events: [],
  rust: null
};

let toastTimer;
function toast(message){
  const t = $('toast');
  t.textContent = message;
  t.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('visible'), 4200);
}

function eventLog(title, detail, type='normal'){
  state.events.unshift({title, detail, type, time:new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})});
  state.events = state.events.slice(0, 10);
  $('events').replaceChildren(...state.events.map(entry => {
    const e = document.createElement('div');
    e.className = 'event';
    const mark = document.createElement('span');
    mark.className = 'event-mark' + (entry.type === 'warn' ? ' warn' : '');
    const content = document.createElement('div');
    const name = document.createElement('strong');
    const desc = document.createElement('small');
    const time = document.createElement('time');
    name.textContent = entry.title;
    desc.textContent = entry.detail;
    time.textContent = entry.time;
    content.append(name, desc);
    e.append(mark, content, time);
    return e;
  }));
}

function availableIds(){
  return [1,2,3].filter(id => state.shares[id - 1] instanceof Uint8Array);
}

function countSecrets(text){
  return (text.match(/\[\[secret:/g) || []).length;
}

function wordCount(text){
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function updatePromptIntel(){
  const prompt = $('prompt').value;
  $('secret-count').textContent = String(countSecrets(prompt));
  const providerText = state.reviewedPrompt || redactMarkedSecrets(prompt).text;
  $('provider-words').textContent = String(wordCount(providerText));
  $('review-state').textContent = state.envelope ? 'REVIEW READY' : 'IDLE';
}

function viewState(){
  const ids = availableIds();
  const hasVault = ids.length > 0;
  const selected = state.selected.filter(id => ids.includes(id)).length;

  document.querySelectorAll('[data-share]').forEach(el => {
    const id = Number(el.dataset.share);
    const available = ids.includes(id);
    const active = available && state.selected.includes(id);
    el.classList.toggle('selected', active);
    el.classList.toggle('unavailable', !available);
    el.querySelector('.share-check').textContent = active ? '✓' : available ? '○' : '−';
    el.querySelector('.share-info small').textContent = available
      ? (active ? 'SELECTED FOR RECONSTRUCTION' : 'AVAILABLE / UNSELECTED')
      : (hasVault ? 'FILE NOT LOADED' : 'NOT YET GENERATED');
  });

  for(let i=1;i<=3;i++){
    $(`node-${i}`).classList.toggle('selected', ids.includes(i) && state.selected.includes(i));
    $(`node-${i}`).classList.toggle('dimmed', !ids.includes(i) || !state.selected.includes(i));
  }

  $('metric-threshold').textContent = selected;
  $('metric-state').textContent = hasVault ? (selected >= 2 ? 'READY' : 'LOCKED') : 'NOT INITIALIZED';
  $('threshold-status').textContent = hasVault ? (selected >= 2 ? 'THRESHOLD MET' : 'ONE MORE REQUIRED') : 'NOT GENERATED';
  $('threshold-hint').textContent = hasVault
    ? (selected >= 2 ? 'Two independent guardian values can reconstruct locally.' : 'Import/select two different guardians to unlock.')
    : 'Generate a vault or import two separately stored guardian files.';
  $('threshold-fill').style.width = hasVault ? `${Math.min(selected / 2, 1) * 100}%` : '0%';
  $('create-vault').textContent = hasVault ? '↻ ROTATE / REGENERATE KEYS ↗' : '✦ INITIALIZE SECURE VAULT ↗';
  $('export-share').disabled = !hasVault;
  $('export-share').textContent = hasVault ? `EXPORT NEXT GUARDIAN FILE (${ids.length} AVAILABLE) ↓` : 'EXPORT NEXT GUARDIAN FILE ↓';
  $('export-envelope').disabled = !state.envelope;
  $('encrypt').disabled = selected < 2;
  $('verify-decrypt').disabled = selected < 2 || !state.envelope;
  $('tamper-test').disabled = selected < 2 || !state.envelope;
  $('run-demo').disabled = selected < 2;
  $('center-state').textContent = hasVault ? (selected >= 2 ? 'THRESHOLD UNLOCKED' : 'CUSTODY LOCKED') : 'VAULT OFFLINE';
  $('center-caption').textContent = hasVault
    ? (selected >= 2 ? 'Reconstruction available only on this device' : 'Select or import one more guardian shard')
    : 'Generate or recover your key custody';
  $('geometry-caption').textContent = hasVault ? `${selected} SELECTED · ${ids.length} / 3 AVAILABLE` : 'UNINITIALIZED';
  $('trust-score').textContent = String((selected >= 2 ? 1 : 0) + (state.envelope ? 1 : 0) + (state.reviewedPrompt ? 1 : 0));
  $('send-provider').disabled = !(state.providerReady && state.envelope && state.reviewedPrompt && selected >= 2);
  if(window.scene) window.scene.setSelected(state.selected);
  updatePromptIntel();
}

async function loadRust(){
  try{
    const rust = await import('../rust/veil-ss/pkg/veil_ss.js');
    await rust.default();
    state.rust = rust;
    eventLog('Rust/WASM cryptography active', 'Low-level GF(256) splitting and reconstruction loaded.');
    $('service-status').textContent = 'RUST + LOCAL';
  }catch{
    eventLog('Browser crypto engine ready', 'Web Crypto AES-GCM + educational JavaScript Shamir; compile Rust/WASM for bonus.');
  }
}

function sharesForSelected(){
  const pair = state.selected.slice(0, 2).map(x => state.shares[x - 1]);
  if(pair.length < 2 || pair.some(x => !(x instanceof Uint8Array))) throw new Error('Import and select at least two distinct guardian shares');
  return pair;
}

function reconstructedKey(){
  const [a,b] = sharesForSelected();
  return state.rust ? state.rust.recover_2_of_3(a,b) : recoverKey(a,b);
}

function invalidate(){
  state.envelope = null;
  state.reviewedPrompt = '';
  $('ciphertext').textContent = 'Prompt modified. Re-encrypt to update ciphertext.';
  $('provider-view').textContent = 'Prompt modified. Re-encrypt to preview the new provider-visible request.';
  document.querySelector('.private-preview').textContent = 'Unencrypted local draft. Press ENCRYPT & PREVIEW.';
  $('response-origin').textContent = 'NO RUN YET';
  $('response').textContent = 'The simulated response or real provider output will appear here.';
  updatePromptIntel();
  viewState();
}

function changeShard(index){
  if(!(state.shares[index - 1] instanceof Uint8Array)){
    toast('This guardian is not loaded. Import its share file or generate a new vault.');
    return;
  }
  const idx = state.selected.indexOf(index);
  if(idx < 0) state.selected.push(index); else state.selected.splice(idx,1);
  if(state.selected.length > 2) state.selected = state.selected.slice(-2);
  eventLog('Guardian selection changed', `${state.selected.length} of 3 shards selected; threshold ${state.selected.length >= 2 ? 'satisfied' : 'not satisfied'}.`);
  viewState();
}

function newVault(){
  state.shares.forEach(bytes => bytes?.fill(0));
  const master = generateKey();
  const coeff = crypto.getRandomValues(new Uint8Array(32));
  state.vaultId = Array.from(crypto.getRandomValues(new Uint8Array(8)), x => x.toString(16).padStart(2,'0')).join('');
  state.createdInSession = true;
  state.exportCursor = 0;
  try{
    if(state.rust){
      const packed = state.rust.split_2_of_3(master, coeff);
      state.shares = [0,1,2].map(i => new Uint8Array(packed.slice(i * 33, (i + 1) * 33)));
    }else{
      state.shares = splitKey(master, coeff);
    }
  }finally{
    master.fill(0);
    coeff.fill(0);
  }

  state.selected = [1,2];
  state.envelope = null;
  state.reviewedPrompt = '';
  $('ciphertext').textContent = 'Vault initialized. Press ENCRYPT & PREVIEW to create an authenticated ciphertext.';
  $('provider-view').textContent = 'Nothing has been approved for external transmission.';
  document.querySelector('.private-preview').textContent = 'Vault initialized. Compose and encrypt a prompt.';
  $('response').textContent = 'The simulated response or real provider output will appear here.';
  $('response-origin').textContent = 'NO RUN YET';
  eventLog('Three cryptographic shares generated', '2-of-3 Shamir key split completed locally. No cloud API contacted.');
  toast('Vault initialized. Select any two shards to unlock encryption.');
  if(window.scene) window.scene.flashCore();
  viewState();
}

async function performEncryption(){
  sharesForSelected();
  const raw = $('prompt').value;
  if(!raw.trim()) throw new Error('Enter a prompt before encrypting.');
  const key = reconstructedKey();
  const started = performance.now();
  try{
    state.envelope = {...(await encryptText(raw, key)), vaultId: state.vaultId};
  }finally{ key.fill(0); }

  const encryptionMs = (performance.now() - started).toFixed(1);
  const redacted = redactMarkedSecrets(raw);
  state.reviewedPrompt = redacted.text;
  $('ciphertext').textContent = JSON.stringify(state.envelope, null, 2);
  $('provider-view').textContent = redacted.text;
  document.querySelector('.private-preview').textContent = raw;
  $('response-origin').textContent = 'AWAITING REQUEST';
  eventLog('Prompt encrypted locally', `AES-GCM encryption in ${encryptionMs} ms; ${redacted.count} marked segment${redacted.count===1 ? '' : 's'} redacted.`);
  if(redacted.count === 0) eventLog('No secret markers detected', 'All prompt text is provider-visible if you send it.', 'warn');
  if(window.scene) window.scene.flashCore();
  viewState();
  return redacted;
}

async function verifyDecryption(){
  if(!state.envelope) throw new Error('Encrypt or import a ciphertext envelope first.');
  if(state.envelope.vaultId !== state.vaultId) throw new Error('Envelope belongs to a different vault');
  const key = reconstructedKey();
  let original;
  try{ original = await decryptText(state.envelope, key); }
  finally{ key.fill(0); }
  $('response').textContent = 'Local decrypt/verify succeeded. Recovered plaintext on this device only:\n\n' + original;
  $('response-origin').textContent = 'LOCAL VAULT / VERIFIED';
  eventLog('Authenticated decryption verified', 'Selected 2-of-3 shares recovered the original vault ciphertext.');
  toast('AES-GCM authentication passed. The plaintext was recovered locally.');
}

async function tamperTest(){
  if(!state.envelope) throw new Error('Encrypt a prompt first.');
  const mutated = fromBase64(state.envelope.ciphertext);
  mutated[0] ^= 1;
  const corrupt = {...state.envelope, ciphertext: toBase64(mutated)};
  const key = reconstructedKey();
  let rejected = false;
  try{ await decryptText(corrupt, key); }
  catch{ rejected = true; }
  finally{ key.fill(0); }
  if(!rejected) throw new Error('Unexpected: corruption was not rejected.');
  eventLog('TAMPER ATTACK REJECTED', 'Single-byte ciphertext modification triggered AES-GCM authentication failure.', 'warn');
  $('response').textContent = 'Attack simulation: modified one ciphertext byte. AES-GCM refused to decrypt the corrupted message. No plaintext released.';
  $('response-origin').textContent = 'RED-TEAM TEST / BLOCKED';
  toast('Attack blocked: authenticated encryption detected the tampering.');
}

function makeResponse(redacted){
  const count = redacted.count;
  const words = wordCount(redacted.text);
  return `Local simulation complete. I received an approved text view of ${words} words, including ${count} masked private segment${count === 1 ? '' : 's'}.\n\nSuggested outline:\n• Define project objectives and the intended audience.\n• Organize milestones into a roadmap with owners and checkpoints.\n• Keep ${count ? Array.from({length:count}, (_,i)=>`[PRIVATE_${i+1}]`).join(', ') : 'sensitive details'} out of the external response.\n\nThis is a deterministic mock response—not output from a cloud model. Enable the optional server API to test real inference.`;
}

async function runDemo(){
  const redacted = await performEncryption();
  $('response').textContent = makeResponse(redacted);
  $('response-origin').textContent = 'LOCAL MOCK · NO API CALL';
  eventLog('Local inference simulation', 'Only masked prompt was used by the demo response generator.');
  toast('Safe demo complete. Review the provider-visible text to see masked values.');
}

function download(data, name){
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1200);
}

function exportShares(){
  const ids = availableIds(); if(!ids.length) return;
  const i = ids[state.exportCursor % ids.length];
  state.exportCursor++;
  download({format:'veil-share-v1', vaultId: state.vaultId, share:i, threshold:2, total:3, value:toBase64(state.shares[i-1])}, `VEIL-${state.vaultId}-guardian-${i}.json`);
  eventLog(`Guardian ${i} exported`, 'One share file downloaded. Move it to an independent offline custodian before exporting another.', 'warn');
  toast(`Guardian ${i} file exported. Click again for the next guardian; keep files separately.`);
}

function exportEnvelope(){
  if(!state.envelope) throw new Error('Encrypt your prompt first.');
  download({format:'veil-envelope-v1', ...state.envelope}, `VEIL-${state.vaultId}-encrypted-envelope.json`);
  eventLog('Encrypted envelope exported', 'Save the AES-GCM encrypted data separately from guardian share files.');
  toast('Ciphertext exported. You can restore it after resetting the local session.');
}

async function importShares(files){
  if(!files?.length) return;
  if(state.createdInSession) throw new Error('Reset the generated-key session before importing separately held files.');
  if(files.length > 2) throw new Error('Import at most two guardian files at once.');
  const staged = [];
  for(const file of files){
    if(file.size > 3000) throw new Error('Guardian file too large');
    staged.push(parseShareRecord(JSON.parse(await file.text())));
  }
  const ids = new Set(staged.map(r => r.index));
  if(ids.size !== staged.length) throw new Error('Guardian files must have distinct indices');
  const expectedId = state.vaultId || staged[0].vaultId;
  if(staged.some(r => r.vaultId !== expectedId)) throw new Error('Guardian files from different vaults cannot be combined');
  const already = availableIds();
  if(new Set([...already, ...ids]).size > 2) throw new Error('For recovery, load at most two shares into one session');
  for(const r of staged){
    state.shares[r.index - 1]?.fill(0);
    state.shares[r.index - 1] = r.bytes;
  }
  state.vaultId = expectedId;
  state.selected = availableIds();
  eventLog('Independent guardian files imported', `${state.selected.length} unique share(s) loaded from local files; no cloud contacted.`);
  toast(`${state.selected.length} share(s) loaded. With two, imported ciphertext can be decrypted locally.`);
  viewState();
}

async function importEnvelope(files){
  if(!files?.length) return;
  const file = files[0];
  if(file.size > 20000) throw new Error('Envelope file exceeds 20 KB limit');
  const data = JSON.parse(await file.text());
  if(!data || data.format !== 'veil-envelope-v1' || data.version !== 1 || data.algorithm !== 'AES-256-GCM' || typeof data.vaultId !== 'string' || !/^[0-9a-f]{16}$/.test(data.vaultId) || typeof data.iv !== 'string' || typeof data.ciphertext !== 'string' || fromBase64(data.iv).length !== 12 || fromBase64(data.ciphertext).length < 17){
    throw new Error('Invalid encrypted envelope file');
  }
  if(state.vaultId && state.vaultId !== data.vaultId) throw new Error('Envelope and guardian files belong to different vaults');
  state.vaultId = data.vaultId;
  state.envelope = data;
  state.reviewedPrompt = '';
  $('ciphertext').textContent = JSON.stringify(data, null, 2);
  $('provider-view').textContent = 'Imported ciphertext cannot be sent to a hosted LLM. Decrypt locally with two shares; create a new approved prompt separately.';
  eventLog('Encrypted envelope imported', 'Authenticated ciphertext loaded; no secrets decrypted yet.');
  toast('Envelope loaded. Import two guardian files and click VERIFY DECRYPTION.');
  viewState();
}

async function copyCipher(){
  if(!state.envelope) return toast('Encrypt a prompt first.');
  await navigator.clipboard.writeText(JSON.stringify(state.envelope, null, 2));
  toast('Encrypted envelope copied to clipboard.');
}

async function liveInference(){
  if(!state.providerReady || !state.envelope || !state.reviewedPrompt) throw new Error('No configured provider or reviewed encrypted prompt.');
  const approved = confirm(`ONLY THE FOLLOWING TEXT WILL BE SENT TO THE EXTERNAL LLM.\n\n${state.reviewedPrompt}\n\nUnmarked sensitive data may still be present. Send exactly this text?`);
  if(!approved){
    eventLog('External request cancelled', 'No prompt was transmitted.');
    return;
  }
  $('send-provider').disabled = true;
  $('response').textContent = 'Submitting approved redacted text to model…';
  try{
    const res = await fetch('/api/infer', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({prompt: state.reviewedPrompt})});
    const payload = await res.json();
    if(!res.ok) throw new Error(payload.error || `HTTP ${res.status}`);
    $('response').textContent = payload.reply || '(Empty response)';
    $('response-origin').textContent = 'EXTERNAL PROVIDER · REDACTED INPUT';
    eventLog('Approved prompt transmitted', 'Provider received reviewed redacted text, no key shares or vault plaintext.', 'warn');
    toast('Provider returned a response to the approved masked prompt.');
  }catch(error){
    $('response').textContent = `Provider request failed: ${error.message}`;
    eventLog('External inference failed', error.message, 'warn');
  }finally{
    viewState();
  }
}

function resetSession(){
  state.shares.forEach(bytes => bytes?.fill(0));
  state.shares = []; state.selected = []; state.vaultId = null; state.createdInSession = false; state.exportCursor = 0; state.envelope = null; state.reviewedPrompt = ''; state.events = [];
  $('ciphertext').textContent = 'Session reset. No ciphertext is loaded.';
  $('provider-view').textContent = 'No provider-visible text is loaded.';
  document.querySelector('.private-preview').textContent = 'Session reset.';
  $('response').textContent = 'The simulated response or real provider output will appear here.';
  $('response-origin').textContent = 'NO RUN YET';
  eventLog('Session reset', 'In-memory share buffers overwritten and references discarded; JavaScript cannot guarantee whole-heap erasure.', 'warn');
  viewState();
  toast('Session reset; key share references cleared.');
}

function safe(fn){
  return async () => {
    try{ await fn(); }
    catch(error){ eventLog('Operation blocked', error.message, 'warn'); toast(error.message); }
  };
}

function initTilt(){
  const interactive = Array.from(document.querySelectorAll('.tilt-3d'));
  for(const el of interactive){
    el.addEventListener('pointermove', (e) => {
      if(window.matchMedia('(pointer: coarse)').matches) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--ry', `${px * 7}deg`);
      el.style.setProperty('--rx', `${py * -7}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
    });
  }
}

function initNavigation(){
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function initSceneControls(){
  $('scene-auto').addEventListener('change', () => window.scene?.setAutoRotate($('scene-auto').checked));
  $('scene-rings').addEventListener('change', () => window.scene?.setShowRings($('scene-rings').checked));
  $('scene-particles').addEventListener('change', () => window.scene?.setShowParticles($('scene-particles').checked));
  $('scene-intensity').addEventListener('input', () => window.scene?.setGlowBoost(Number($('scene-intensity').value) / 100));
  $('scene-mode').addEventListener('change', () => window.scene?.setMode($('scene-mode').value));
}

function initTemplates(){
  document.querySelectorAll('.template-button').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.template;
      if(TEMPLATES[key]){
        $('prompt').value = TEMPLATES[key];
        invalidate();
        eventLog('Prompt preset loaded', `${button.textContent} scenario inserted into the secure prompt editor.`);
        toast(`${button.textContent} template loaded.`);
      }
    });
  });
}

async function start(){
  window.scene = new Constellation($('orb-canvas'), changeShard);
  document.querySelectorAll('[data-share]').forEach(el => el.addEventListener('click', ()=>changeShard(Number(el.dataset.share))));
  for(let i=1;i<=3;i++) $(`node-${i}`).addEventListener('click', ()=>changeShard(i));

  $('create-vault').addEventListener('click', safe(newVault));
  $('encrypt').addEventListener('click', safe(performEncryption));
  $('run-demo').addEventListener('click', safe(runDemo));
  $('verify-decrypt').addEventListener('click', safe(verifyDecryption));
  $('tamper-test').addEventListener('click', safe(tamperTest));
  $('export-share').addEventListener('click', safe(exportShares));
  $('export-envelope').addEventListener('click', safe(exportEnvelope));
  $('import-shares').addEventListener('click', ()=>$('share-file-picker').click());
  $('import-envelope').addEventListener('click', ()=>$('envelope-file-picker').click());
  $('share-file-picker').addEventListener('change', safe(async()=>{ await importShares(Array.from($('share-file-picker').files)); $('share-file-picker').value = ''; }));
  $('envelope-file-picker').addEventListener('change', safe(async()=>{ await importEnvelope(Array.from($('envelope-file-picker').files)); $('envelope-file-picker').value = ''; }));
  $('copy-cipher').addEventListener('click', safe(copyCipher));
  $('send-provider').addEventListener('click', safe(liveInference));
  $('reset').addEventListener('click', ()=>{ if(!state.shares.length || confirm('Destroy this session’s in-memory shares and encrypted envelope?')) resetSession(); });
  $('reset-camera').addEventListener('click', ()=>window.scene?.resetCamera());
  $('prompt').addEventListener('input', ()=>{ if(state.envelope) invalidate(); else updatePromptIntel(); });

  initTilt();
  initNavigation();
  initSceneControls();
  initTemplates();
  viewState();

  try{
    const res = await fetch('/api/status');
    if(res.ok){
      const status = await res.json();
      state.providerReady = !!status.providerConfigured;
      $('inference-mode').textContent = state.providerReady ? `LIVE API READY · ${status.model}` : 'LOCAL SIMULATION';
      eventLog('Inference gateway checked', state.providerReady ? 'External API available; user consent required.' : 'No API key configured. Local demo available.');
      if(status.rustReady) await loadRust();
      else eventLog('Browser crypto engine ready', 'Web Crypto AES-GCM + educational JavaScript Shamir. Compile Rust/WASM for bonus.');
    }
  }catch{
    eventLog('Standalone preview mode', 'Run node server.mjs for the optional server-side API adapter.');
  }
  updatePromptIntel();
  viewState();
}

start().catch(error => {
  console.error(error);
  toast('Initialization issue: ' + error.message);
});
