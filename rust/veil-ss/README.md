# Optional Rust / WebAssembly key-sharing backend

The main app runs immediately using the browser crypto demo. Build this module to switch GF(256) split/recover operations to Rust/WASM in the running browser. `src/main.mjs` loads the generated module automatically if present.

```bash
# Install Rust first: https://rustup.rs/
cargo install wasm-pack
cd rust/veil-ss
cargo test
wasm-pack build --target web --out-dir pkg
cd ../..
node server.mjs
```

**Not yet production-hardened.** The GF(256) math is a pedagogical implementation. It uses value-dependent control flow and is not guaranteed constant-time or independently audited. On the AI Pipeline track, using an established reviewed secret-sharing implementation is preferable for a production submission. The web app uses browser Web Crypto AES-GCM for encryption, not a custom cipher.
