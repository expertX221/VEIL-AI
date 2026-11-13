# Submission package: judge-facing content

## Title
VEIL//AI — A Split-Key Privacy Gateway for Secure LLM Interactions

## One-liner
An interactive 3D security console combining 2-of-3 secret sharing, authenticated local encryption, and user-reviewed private LLM prompts.

## Track
AI Pipeline Secret Sharing

## Problem
AI users need to protect master keys, prevent unwanted disclosure of sensitive prompt fields, and inspect what a hosted AI actually receives. TLS alone doesn't ensure inference-time privacy.

## Solution
A user-controlled local agent vault with Shamir key shares, Web Crypto AES-GCM, explicit secret masking, external-prompt approval, and visible adversarial testing, presented in a fluid WebGL 3D interface.

## Technologies
WebGL · JavaScript ES Modules · Node.js · Web Crypto · AES-256-GCM · Shamir Secret Sharing (GF256) · Rust · WebAssembly (optional build) · Provider API / GroqCloud (optional integration)

## Measured achievements—do not invent numbers
- 8 automated JavaScript tests passing.
- All 3 possible key share pairs successfully reconstruct keys in 200 randomized trials.
- Single-byte ciphertext tampering rejected; exported guardian records reconstruct after simulated session reset.
- HTTP 200 received from the local service health endpoint.

**Do not claim:** zero-knowledge LLM inference; encrypted ciphertext processing by the hosted model; third-party audit; production-safe custody; completed Rust build; deployed public website; tested real API without credentials; guaranteed zero retention by any provider.

## Defensible novelty
A functional and interactive visualization of the actual trust and key-sharing state, plus a preview separating encrypted-at-rest private prompts from the redacted plaintext necessary for conventional model inference. Every major security claim has either an automated test or an explicit limitations note.

## Proposed judging sequence
1. Rotate 3D constellation and click shards to demonstrate threshold behavior.
2. Show math and split/recover tests in the integrated VS Code terminal.
3. Encrypt a prompt, show cipher and the exact masked outbound content; export three share files and the encrypted envelope.
4. Reset, import two independently stored share files and the envelope, verify decryption; simulate tampering.
5. Run offline mock; optionally perform one user-approved real API call.
6. Close with candid threat model and robust next-step design.

## Submission links
- Local interface: http://127.0.0.1:8787 (when running)
- Public deployment: NOT YET CREATED
- GitHub: NOT YET CREATED
- YouTube: NOT YET RECORDED

## Team placeholders
- Project captain: [Your name]
- Team member(s): [Names]
- Institution: [Institution name]
- Event: [Exact organizer/event name]
- Date: [Submission date]
