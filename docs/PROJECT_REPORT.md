# VEIL//AI — Hackathon Project Report

**Competition:** Mathematics for Systems Security  
**Selected track:** AI Pipeline Secret Sharing  
**Project title:** VEIL//AI — A Split-Key Privacy Gateway for Secure LLM Interactions  
**Category:** Applied cryptography + secure AI + human-centered security visualization  
**Status:** Working demonstration; not a production security system

## Executive summary

Third-party LLM APIs offer broad capabilities, but sending sensitive prompts directly to providers creates exposure: data can be present in provider inference memory, logs, integrations, and operational pipelines. Encryption in transit does not resolve model-side plaintext access. The key question is: **Can we keep cryptographic authority local, encrypt stored private content, and make provider visibility explicit and controllable?**

VEIL//AI answers that achievable subset through a local privacy gateway, 2-of-3 Shamir secret sharing, AES-GCM authenticated encryption, marked-secret redaction, an interactive WebGL cryptographic visualization, and a two-file recovery workflow after a local session reset. An optional provider adapter (Groq by default) handles only an explicitly approved, redacted prompt. A local deterministic simulator allows repeatable judging without an API key.

## Problem statement

Users lack practical, inspectable control over where their master keys reside, how private AI prompts are encrypted, which secret fields reach external inference providers, and how to verify tampering resistance. Existing demonstrations often blur 'encrypted at rest' with 'encrypted during inference.' VEIL//AI makes these different guarantees independently visible and testable.

## Intended audience and use cases

1. **Software development teams:** draft summaries without sending marked API tokens, contract identifiers, or secrets to an LLM.
2. **Enterprise operations:** store private AI prompts locally using authenticated encryption and share-based key recovery.
3. **Security education:** teach finite-field interpolation, threshold custody, ciphertext integrity, and trust-boundary inspection using manipulable 3D objects.
4. **Research demonstrators:** provide a measurable foundation for extending to verifiable secret sharing, trusted enclaves, or privacy-preserving inference.

## Research questions

- Can any 2 of 3 shares reconstruct a 256-bit key while a single share is information-theoretically insufficient?
- Can ciphertext be protected from undetected tampering via authenticated encryption?
- Can we ensure the external model receives no key material and no *explicitly marked* confidential substrings?
- Can judges observe these guarantees in a 3D interface rather than merely trust claims in a README?

## Cryptographic mathematical foundation

### 1. Finite-field threshold sharing

Represent each byte of a 256-bit master key as an element `s` of `GF(2^8)`. Choose one independent, uniformly random coefficient `a` per secret byte and form a degree-one polynomial:

\[
f(x) = s + a x \quad\text{over}\quad \mathrm{GF}(2^8).
\]

In characteristic two, addition and subtraction are XOR. Evaluate for nonzero indices `x = 1, 2, 3`:

\[
S_i=(x_i,f(x_i)), \qquad x_i\in\{1,2,3\}.
\]

Recover the constant term (secret) from any **two distinct** shares by Lagrange interpolation at zero:

\[
s = f(0) = \sum_{i=1}^{2} y_i \prod_{j\ne i}\frac{x_j}{x_j-x_i}\, .
\]

With XOR replacing subtraction, for two shares `A=(x_1,y_1)` and `B=(x_2,y_2)`:

\[
s= y_1\frac{x_2}{x_1\oplus x_2}\ \oplus\ y_2\frac{x_1}{x_1\oplus x_2}.
\]

Multiplication uses the irreducible polynomial

\[
p(x) = x^8 + x^4 + x^3 + x + 1,
\]

and inversion uses `a^(254)` for nonzero `a` in the 256-element finite field. `32` secret bytes are independently split and recovered. For a uniformly random coefficient, knowing one share leaves each secret byte uniformly distributed over all 256 possibilities; thus one properly isolated share gives no information about the original 256-bit uniformly random key.

### 2. Encryption and integrity

The native Web Crypto API provides AES with a 256-bit key in Galois/Counter Mode (GCM):

\[
(C,T)=\operatorname{AES\!\text{-}GCM}_{K}(N,P),
\]

where `P` is plaintext, `N` is a fresh random 96-bit nonce, `C` ciphertext, and `T` the authentication tag. Decryption returns plaintext only when the authentication check succeeds. The demonstration randomly samples a new nonce on every encryption and rotates the key upon vault regeneration.

**Do not reuse a key/nonce pair in GCM.** Production systems should implement robust nonce lifecycle and message limits, with proper handling across restarts and multiple devices.

### 3. Approved redaction transform

For an input prompt `P`, identify substrings with the explicit syntax `[[secret:VALUE]]` and replace them with placeholders `[PRIVATE_1]`, `[PRIVATE_2]`, etc. The redacted prompt `R(P)` is visible to the user before any optional API call. The encrypted envelope `E_K(P)` protects the original prompt in the vault; the outbound request carries only `R(P)`.

This is **not** general PII detection and does not guarantee secrecy of unmarked or context-inferable details. A human review gate protects against accidental one-click transmission, not against a compromised local application or malicious user action.

## Architecture and trust model

**Trusted boundary:** User-controlled computer, browser process, local Node adapter, and its operating system. The app listens only on `127.0.0.1`.

**Untrusted or partially trusted boundary:** Third-party hosted LLM API, other websites, browser extensions, remote infrastructure. The user must understand that the API receives and processes the approved redacted plaintext.

**Key flow:** Generate a random master key locally → split into three 33-byte shares (1 index + 32 field values) → overwrite original typed-array reference as best effort → optionally export three independent guardian files and the ciphertext → reset local session → import up to two distinct same-vault shares → reconstruct locally for encrypt/decrypt → overwrite reconstructed typed-array reference → never include key or shares in model requests.

**Content flow:** User prompt → local AES-GCM encrypted envelope → marked-secret transformation → explicit provider-visible preview → optional consent → local same-origin API gateway → TLS to hosted model.

**User interface:** WebGL sphere and octahedral shards, 3D camera orbit, shard selection, share/envelope export and two-file import, authentication controls, private prompt editor, ciphertext viewer, provider-visible viewer, event telemetry, and mock/live separation.

## Novelty and competitive differentiation

VEIL//AI's novelty is the **integration and testable representation** of security boundaries rather than a claim of inventing Shamir sharing or AES. Interactive shard selection modifies the actual reconstruction threshold. Encryption and integrity tests have real cryptographic outcomes, not animated mock status indicators. Outbound request inspection lets judges compare protected private content against the text a model would see. Rust/WASM is supplied as an optional mathematical processing path. The package works without network access or third-party dependencies in demo mode.

## Security claims, controls, and known limitations

| Scenario | Outcome | Why / limitation |
|---|---|---|
| Attacker gets one of three independently held shares | Cannot derive uniformly random master key under ideal Shamir model | Share export and two-file recovery are supported; actual independent custody depends on storage outside the app |
| Attacker modifies saved ciphertext | Tampering detected | AES-GCM authenticated decryption fails |
| Cloud LLM requests master key | No master key is transmitted by implemented gateway | Malicious browser JS or local OS compromise is outside this guarantee |
| Marked secret in prompt | Replaced with placeholder before provider call | Unmarked or inferable secrets can still leak |
| Provider sees input | Provider sees approved redacted plaintext | Standard API inference is not FHE, MPC, or automatically private |
| Side-channel-resistant algorithm | **Not claimed** | JS and illustrative Rust implementations are not constant-time or audited |
| Offline AI simulation | Works without API | Deterministic mock is not an LLM |
| Live LLM | Optional provider gateway implemented (Groq default) | Credentials needed; behavior not validated in this environment |

### Additional risks to address

- **Co-resident shares:** all 3 shares exist in the creation session; export each guardian separately, reset, and import at most 2 for recovery. Custodian independence and storage isolation must be arranged physically; they are not automatically guaranteed.
- **Browser compromise:** injected scripts, extensions, or machine malware can read DOM content and JS memory.
- **Secret erasure:** `Uint8Array.fill(0)` cannot prove no copies survive in browser, runtime, OS, or swap memory.
- **Redaction integrity:** explicit markers are a demo mechanism, not a complete data-loss prevention system.
- **Prompt disclosure:** even after masking, context can identify secrets or reveal confidential business information.
- **Supply chain:** the current demonstration uses local system font stacks, avoiding external font requests.
- **Server boundary:** optional API adapter is on the user's computer; deploying it to a remote cloud requires a revised threat model.
- **Cryptographic engineering:** use professionally reviewed libraries and independent penetration testing for production.

## Implementation stack

| Layer | Technology | Purpose |
|---|---|---|
| Experience | HTML5/CSS, JavaScript ES modules | Fast local launch; responsive layout |
| 3D scene | Custom WebGL 1.0 shaders and geometry | Interactive sphere, shards, rings, orbit/zoom |
| Encryption | Native Web Crypto AES-GCM | Authenticated symmetric encryption |
| Threshold math | Shamir over GF(2^8) | 2-of-3 key sharing |
| Optional low-level bonus | Rust + WebAssembly | Split/recover finite-field operations |
| Gateway | Node.js built-in HTTP | Loopback-only API, no extra npm dependencies |
| Hosted inference | Optional provider API (Groq default) | Approved sanitized prompt only |
| Tests | Node built-in test runner | Security correctness assertions |

## Demonstration flow (2–3 minutes)

1. Launch the local immersive workspace and orbit the 3D key constellation.
2. Generate a 256-bit key and distribute into 3 shares.
3. Deselect one guardian to trigger the locked threshold; select a second distinct guardian to recover it.
4. Encrypt an input that contains explicitly marked secret data. Show the genuine AES-GCM ciphertext.
5. Inspect the redacted provider-visible prompt and highlight that neither key nor marked secrets leave the device.
6. Verify local decryption with another pair of shares.
7. Deliberately flip a byte; show decryption fails rather than returning corrupted plaintext.
8. Run the local mock or—if credentials provided and consent granted—send the approved redacted prompt to the real provider.
9. Finish with limitations: no encrypted-inference claim, demonstration custody vs independent custodians, and next steps.

## Testing and evidence

**Automated (8 tests passing):** GF(256) multiplication reference, 200 random-key split/reconstruct cycles for all three share pairs, duplicate-share rejection, ciphertext tampering failure, wrong-key rejection, explicit-marker redaction behavior.

**System smoke tests:** Node server returned successful HTTP 200 `/api/status` response; module syntax validation completed. Rust/WASM compilation is unverified because the Rust toolchain is unavailable in the build environment. Browser screenshot verification was attempted but the build environment's Chromium graphics backend failed, so there is not yet an evidenced visual QA result.

**Pre-submission work:** test actual GUI on Windows/VS Code; test narrow desktop/mobile layouts; compile/test Rust; test with real event-issued LLM credentials; capture screen recording; conduct key-handling/privacy review.

## Milestones

- **Phase 1 — MVP (present package):** cinematic WebGL console, working SSS, encryption, mock inference, explicit redaction, six tests, local adapter.
- **Phase 2 — Cryptographic quality:** compile/test Rust WASM, switch to audited VSS implementation, authenticate share metadata, introduce hardware-backed guardian isolation, stress-test nonce and memory handling. File import exists in Phase 1; physical isolation does not.
- **Phase 3 — AI and privacy:** connect provider event-issued API, robust policy-based prompt classification with human review, process in trusted local agent, implement safe placeholder rehydration where applicable.
- **Phase 4 — Competition polish:** accessibility/visual QA, measured benchmarks, diagram slides, adversarial live demo and recorded YouTube walkthrough.
- **Research extension:** investigate attested confidential inference or supported FHE-compatible computation rather than claiming off-the-shelf LLMs perform ciphertext-only inference.

## Success criteria and evidence to collect

- 3/3 share pairs reconstruct a 32-byte key reliably across hundreds of randomized trials; recovery works from two exported files after a simulated reset.
- A single share never unlocks UI encryption/decryption workflow.
- GCM detects any test flip of authenticated ciphertext.
- Master key and shares are absent from the outbound request JSON.
- Marked secrets do not appear in the outgoing prompt; unmarked risk is disclosed.
- 3D scene maintains usable interactions on the hackathon device, with measured frame rate reported only after profiling.
- Actual live provider call succeeds with judge-approved content and no secrets included, if host API credentials are provided.

## Suggested submission abstract (ready to adapt)

> VEIL//AI is a local-first private AI interface that combines Shamir 2-of-3 secret sharing, AES-256-GCM encryption, and transparent review of data crossing the LLM trust boundary. Its interactive 3D key constellation is connected to functional cryptographic operations: selecting two shards unlocks encrypted workflows, a single share leaves the vault locked, and ciphertext manipulation fails authenticated decryption. An optional LLM gateway transmits only explicitly approved, marked-secret-redacted text. Rather than misrepresenting standard LLM inference as fully encrypted, VEIL//AI makes the achievable privacy guarantees and remaining risks clear, measurable, and demonstrable.

## Sources for standards and implementation

- Shamir's seminal paper: A. Shamir, *How to Share a Secret*, Communications of the ACM (1979).
- NIST SP 800-38D (GCM): https://csrc.nist.gov/pubs/sp/800/38/d/final
- MDN authenticated Web Crypto: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
- Rust threshold/VSS reference: https://docs.rs/vsss-rs/latest/vsss_rs/
- OpenAI API data controls: https://developers.openai.com/api/docs/guides/your-data
- AWS Bedrock data use: https://repost.aws/knowledge-center/amazon-bedrock-model-data-use
