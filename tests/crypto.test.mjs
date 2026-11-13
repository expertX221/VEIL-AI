import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKey,splitKey,recoverKey,encryptText,decryptText,redactMarkedSecrets,gfMul,toBase64,parseShareRecord} from '../src/crypto.mjs';

test('AES-field multiplication known sample',()=>assert.equal(gfMul(0x57,0x83),0xc1));
test('2-of-3 Shamir recovers all pairs',()=>{
 for(let trial=0;trial<200;trial++){
  const key=generateKey(),shares=splitKey(key);
  for(const [a,b] of [[0,1],[0,2],[1,2]]) assert.deepEqual(recoverKey(shares[a],shares[b]),key);
 }
});
test('duplicate share rejects',()=>{
 const shares=splitKey(generateKey());
 assert.throws(()=>recoverKey(shares[0],shares[0]));
});
test('tampering with AES-GCM ciphertext fails',async()=>{
 const key=generateKey(),c=await encryptText('Classified',key);
 assert.equal(await decryptText(c,key),'Classified');
 const t={...c,ciphertext:c.ciphertext.slice(0,-4)+'AAAA'};
 await assert.rejects(decryptText(t,key));
});
test('wrong key cannot decrypt',async()=>{
 const c=await encryptText('Confidential',generateKey());
 await assert.rejects(decryptText(c,generateKey()));
});
test('redacts only marked segments; unmarked data remains visible',()=>{
 const r=redactMarkedSecrets('Client [[secret:Acme]]: unmarked 123');
 assert.equal(r.text,'Client [PRIVATE_1]: unmarked 123');
 assert.equal(r.count,1);
});

test('guardian file exports parse and reconstruct after simulated session reset',async()=>{
 const master=generateKey(),shares=splitKey(master),vaultId='abcdef0123456789';
 const envelope=await encryptText('private restored text',master);
 const exported=[shares[2],shares[0]].map(share=>JSON.stringify({format:'veil-share-v1',vaultId,share:share[0],threshold:2,total:3,value:toBase64(share)}));
 const parsed=exported.map(text=>parseShareRecord(JSON.parse(text)));
 assert.deepEqual(parsed.map(x=>x.index),[3,1]);
 const recovered=recoverKey(parsed[0].bytes,parsed[1].bytes);
 assert.equal(await decryptText(envelope,recovered),'private restored text');
 recovered.fill(0);
});
test('guardian file parser rejects a wrong index or corrupted format',()=>{
 const share=splitKey(generateKey())[0],base={format:'veil-share-v1',vaultId:'abcdef0123456789',share:1,threshold:2,total:3,value:toBase64(share)};
 assert.equal(parseShareRecord(base).index,1);
 assert.throws(()=>parseShareRecord({...base,share:2}));
 assert.throws(()=>parseShareRecord({...base,format:'unknown'}));
});
