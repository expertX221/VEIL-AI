# VEIL AI

VEIL AI is a split-key privacy gateway prototype for the Mathematics for Systems Security hackathon. Its scroll-driven WebGL walkthrough uses a rotating crystal to explain browser-side encryption, 2-of-3 key recovery, and prompt review before an AI request.

## Live deployments

- [Vercel demo](https://veil-ai-crystal-cockpit.vercel.app)
- [Render demo](https://veil-ai-6z1f.onrender.com)
- [Render Static Site dashboard](https://dashboard.render.com/static/srv-dbrjdblg1s2s738lur60) · Service ID `srv-dbrjdblg1s2s738lur60`

Both public deployments run in demo mode. The Render resource is a Static Site.

## 3D walkthrough

Scroll through three scenes covering encryption, key shares, and AI prompt review. Drag the rotating crystal to orbit it. In the key-sharing scene, two of the three guardian crystals light up to illustrate the recovery threshold. Open the cockpit to try the vault and inspect the redacted prompt.

## Try the cockpit

Run `npm start` with Node.js 20 or later and open http://127.0.0.1:8787. Initialize the vault, encrypt and preview the sample prompt, then run the safe demo. The safe demo requires no credentials.

The browser encrypts the original input with AES-GCM and splits the vault key into three Shamir shares. Any two distinct shares can reconstruct it. You can export guardian shares separately and import them to demonstrate recovery.

## Live provider setup

Copy `.env.example` to `.env`, select Groq, Gemini, or OpenAI, and set the corresponding API key locally. Restart the local server. Review the exact outgoing prompt before choosing Send to AI. Keep `.env` outside version control.

The provider receives the approved redacted prompt as readable text. The vault key, key shares, and encrypted original stay client-side during inference. The project demonstrates local encryption and prompt redaction. It does not perform LLM inference on ciphertext.

## Development

Run `npm test` to check key recovery, AES-GCM tamper detection, redaction, and static path handling. See [docs](docs) for the project report and demo script.
