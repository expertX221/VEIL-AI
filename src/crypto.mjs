/**
 * VEIL//AI educational client-side cryptography.
 * The symmetric primitive is the platform's Web Crypto implementation of AES-GCM.
 * Shamir GF(256) is mathematically valid but this JS implementation is not audited,
 * constant-time, or suitable for production custody of sensitive keys.
 * Production: substitute independently reviewed VSS implementation / secure hardware.
 */
export function gfMul(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const carry = a & 0x80;
    a = (a << 1) & 255;
    if (carry) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}
export function gfPow(a, n) {
  let result = 1;
  while (n > 0) {
    if (n & 1) result = gfMul(result, a);
    a = gfMul(a, a);
    n = Math.floor(n / 2);
  }
  return result;
}
export function gfDiv(a, b) {
  if (b === 0) throw new Error('GF(256) division by zero');
  return gfMul(a, gfPow(b, 254));
}
export function generateKey() { return crypto.getRandomValues(new Uint8Array(32)); }
export function splitKey(key, coefficients = crypto.getRandomValues(new Uint8Array(key.length))) {
  if (!(key instanceof Uint8Array) || key.length !== 32 || coefficients.length !== key.length) throw new Error('32-byte key required');
  return [1,2,3].map((index) => {
    const bytes = new Uint8Array(33);
    bytes[0] = index;
    for (let i = 0; i < key.length; i++) bytes[i+1] = key[i] ^ gfMul(coefficients[i], index);
    return bytes;
  });
}
export function recoverKey(a,b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length !== 33 || b.length !== 33 || a[0] === 0 || b[0] === 0 || a[0] === b[0]) throw new Error('Two distinct 33-byte shares required');
  const secret = new Uint8Array(32);
  const x1=a[0],x2=b[0], denominator=x1^x2;
  for (let i = 0; i < 32; i++) secret[i] = gfMul(a[i+1],gfDiv(x2,denominator)) ^ gfMul(b[i+1],gfDiv(x1,denominator));
  return secret;
}
export function toBase64(bytes) {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str);
}
export function fromBase64(encoded) { return Uint8Array.from(atob(encoded), c => c.charCodeAt(0)); }
export async function encryptText(text, secret) {
  const imported = await crypto.subtle.importKey('raw', secret, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = new TextEncoder().encode(text);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},imported,payload));
  return {version:1, algorithm:'AES-256-GCM', iv:toBase64(iv), ciphertext:toBase64(ciphertext)};
}
export async function decryptText(envelope, secret) {
  if (envelope.version !== 1 || envelope.algorithm !== 'AES-256-GCM') throw new Error('Unsupported ciphertext format');
  const imported = await crypto.subtle.importKey('raw', secret, 'AES-GCM', false, ['decrypt']);
  const decoded = await crypto.subtle.decrypt({name:'AES-GCM',iv:fromBase64(envelope.iv)},imported,fromBase64(envelope.ciphertext));
  return new TextDecoder().decode(decoded);
}
export function redactMarkedSecrets(text) {
  let count = 0;
  const output = text.replace(/\[\[secret:([\s\S]*?)\]\]/g, () => `[PRIVATE_${++count}]`);
  return {text:output, count};
}

/** Strict browser-side parsing of a guardian share file. Metadata binds a vault
 * session, but only AES-GCM authentication verifies successful reconstruction. */
export function parseShareRecord(record) {
  if (!record || record.format !== 'veil-share-v1' || !Number.isInteger(record.share) || record.share < 1 || record.share > 3 || record.threshold !== 2 || record.total !== 3 || typeof record.vaultId !== 'string' || !/^[0-9a-f]{16}$/.test(record.vaultId) || typeof record.value !== 'string') throw new Error('Invalid or incompatible guardian file');
  let bytes;
  try { bytes = fromBase64(record.value); } catch { throw new Error('Invalid guardian base64 data'); }
  if (bytes.length !== 33 || bytes[0] !== record.share) throw new Error('Guardian share payload/index mismatch');
  return {index:record.share,vaultId:record.vaultId,bytes};
}
