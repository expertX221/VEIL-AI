# VEIL//AI — Three-minute demo script + video storyboard

**0:00–0:20 — The problem**  
*Visual:* Fly over the real WebGL constellation; drag, zoom; show private prompt editor.  
*Narration:* "AI is powerful, but a private conversation becomes risky when we hand over more information than a model needs. Encryption in transit does not stop the model provider from seeing the text it processes."

**0:20–0:45 — Why split a key?**  
*Action:* Click **Initialize Secure Vault**. Point to the three 3D shards.  
*Narration:* "VEIL//AI generates a random 256-bit key and uses Shamir secret sharing to divide it into three parts. Any two reconstruct the key; one alone is mathematically insufficient. The master key is not transmitted to our LLM provider."

**0:45–1:08 — Cryptography as interaction**  
*Action:* Click shards until just one is selected; encryption locks. Click a different shard and unlock it; drag the camera.  
*Narration:* "The 3D elements are actual controls, not decoration. Every key shard changes the cryptographic threshold. Behind the scene is finite-field interpolation and an optional Rust WebAssembly engine."

**1:08–1:35 — Encrypt and compare**  
*Action:* Enter a prompt containing `[[secret:client amount]]` and `[[secret:private token]]`; press **Encrypt & Preview**. Show both data windows.  
*Narration:* "Our private prompt is encrypted locally using AES-GCM. The remote model never receives the master key. Separately, we replace explicitly marked sensitive fields, and you see exactly what the model would receive before approving anything."

**1:35–1:58 — Prove integrity**  
*Action:* Press **Verify Decryption**, then **Simulate Attack**.  
*Narration:* "Reconstructing the key from two shares recovers the encrypted content. Now we change a single byte of ciphertext: authenticated decryption rejects it. The security result isn't a fake animation—it is a cryptographic check."

**1:58–2:27 — Agent response**  
*Action:* **Run Safe Demo**; if API credentials are configured, optionally show approved redacted prompt sent to the external LLM instead.  
*Narration:* "A deterministic offline simulation keeps the demonstration reproducible. With an API key, the user can separately consent to send only the reviewed redacted prompt to a real model. We never claim that ordinary LLM inference can operate directly over arbitrary AES ciphertext."

**2:27–3:00 — Security boundary and conclusion**  
*Action:* Show security telemetry, return to constellation.  
*Narration:* "VEIL//AI makes four concepts tangible: distributed-key mathematics, authenticated encryption, controlled provider visibility, and adversarial verification. Our next steps are independent share custody and audited native cryptography. Security works best when its limits are visible. VEIL//AI: your secrets, your keys, your control."

## Recording checklist

- Screen capture at 1080p or 1440p; smooth mouse movements, no rapid zooms.
- Use dummy tokens and invented examples; never enter real secrets during recording.
- Show console without errors, test Reactivity on the actual machine, and reveal local/mock label.
- If using a live API, verify billing and credential limits and consent to the exact payload.
- Include a lower-third showing math: `f(x)=s+ax` over `GF(2^8)`; `k=2, n=3`.
- Use original/royalty-free soundtrack and licensed narration voice.

## Optional extended demo: real offline custody recovery (30-45 seconds)

Export guardian 1, guardian 2 and guardian 3 as **separate downloads**, then export the ciphertext envelope. Transfer guardian files to independent trusted storage (never claim that the Downloads folder alone provides independent custody). Click **Reset Session** to clear in-memory state, then import guardian 1 and guardian 3 plus the encrypted envelope. Click **Verify Decryption** and show recovery succeeded without any LLM API. The same workflow fails to enable the operation with only a single guardian.
