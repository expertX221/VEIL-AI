"""Optional report generator: pip install reportlab; python tools/create_report.py"""
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
from pathlib import Path

HERE=Path(__file__).resolve().parents[1]
OUTPUT=HERE/'VEIL_AI_Project_Report.pdf'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
if Path(FONT).exists():
    pdfmetrics.registerFont(TTFont('DV',FONT))
    pdfmetrics.registerFont(TTFont('DVB',BOLD))
else:
    pdfmetrics.registerFont(TTFont('DV','/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'))
    pdfmetrics.registerFont(TTFont('DVB','/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf'))
W,H=A4
BG=HexColor('#080f1c');PANEL=HexColor('#101c2c');BORDER=HexColor('#2b4254');FG=HexColor('#eff8ff');MUTED=HexColor('#9cacc4');CYAN=HexColor('#77e9e5');GREEN=HexColor('#84ecc3');BLUE=HexColor('#88a0ff');ORANGE=HexColor('#ffca94')
c=canvas.Canvas(str(OUTPUT),pagesize=A4)
c.setTitle('VEIL//AI - Mathematics for Systems Security - Project Report')
c.setAuthor('VEIL//AI Hackathon Project')
page=0

def base(label):
    global page
    page+=1;c.setFillColor(BG);c.rect(0,0,W,H,fill=1,stroke=0)
    c.setStrokeColor(HexColor('#172a40'));c.setLineWidth(.3)
    for xx in range(50,int(W),48):c.line(xx,68,xx,H-65)
    for yy in range(70,int(H),48):c.line(48,yy,W-48,yy)
    c.setFillColor(HexColor('#0a1525'));c.rect(0,H-66,W,66,fill=1,stroke=0)
    c.setFont('DVB',14);c.setFillColor(FG);c.drawString(46,H-42,'VEIL//AI')
    c.setFont('DV',8);c.setFillColor(CYAN);c.drawRightString(W-46,H-39,label.upper())
    c.setStrokeColor(BORDER);c.line(46,H-66,W-46,H-66)
    c.setStrokeColor(BORDER);c.line(46,55,W-46,55)
    c.setFont('DV',8);c.setFillColor(MUTED);c.drawString(46,38,'MATHEMATICS FOR SYSTEMS SECURITY  ·  AI PIPELINE SECRET SHARING')
    c.drawRightString(W-46,38,f'{page:02d} / VEIL')

def heading(y,title,sub=None):
    c.setFillColor(CYAN);c.rect(46,y+13,30,2,fill=1,stroke=0)
    c.setFillColor(FG);c.setFont('DVB',21);c.drawString(46,y-17,title)
    if sub:c.setFillColor(MUTED);c.setFont('DV',9.5);c.drawString(46,y-37,sub)
    return y-57

def textblock(y,txt,width=490,font=10,leading=16,x=46,color=MUTED,bold=False):
    c.setFillColor(color);c.setFont('DVB' if bold else 'DV',font)
    lines=simpleSplit(txt,'DVB' if bold else 'DV',font,width)
    for line in lines:c.drawString(x,y,line);y-=leading
    return y

def panel(x,y,w,h,title,body,color=CYAN):
    c.setFillColor(PANEL);c.roundRect(x,y-h,w,h,9,fill=1,stroke=0)
    c.setStrokeColor(BORDER);c.roundRect(x,y-h,w,h,9,fill=0,stroke=1)
    c.setFillColor(color);c.setFont('DVB',11);c.drawString(x+16,y-22,title)
    textblock(y-44,body,w-32,9,14,x+16,MUTED)

def row(y,key,value,color=FG):
    c.setStrokeColor(BORDER);c.line(46,y-13,W-46,y-13)
    c.setFillColor(CYAN);c.setFont('DVB',9);c.drawString(46,y,key.upper())
    c.setFillColor(color);c.setFont('DV',10);c.drawRightString(W-46,y,value)
    return y-40

# Cover
base('Project concept / implementation report')
c.setFillColor(HexColor('#0b2136'));c.circle(438,570,162,stroke=0,fill=1)
c.setStrokeColor(HexColor('#386d8a'));c.setLineWidth(1)
for r in (80,112,145):c.circle(430,570,r,stroke=1,fill=0)
for dx,dy,r in ((-100,-35,8),(78,96,10),(40,-120,7)):
    c.setFillColor(CYAN);c.circle(430+dx,570+dy,r,fill=1,stroke=0)
c.setFillColor(CYAN);c.setFont('DVB',12);c.drawString(46,718,'SECURE AI / SPLIT-KEY CRYPTOGRAPHY / 2026')
c.setFillColor(FG);c.setFont('DVB',52);c.drawString(46,632,'VEIL//AI')
c.setFillColor(CYAN);c.setFont('DVB',17);c.drawString(46,593,'Private Intelligence Console')
textblock(550,'A split-key privacy gateway for secure LLM interactions, with live cryptographic verification and an interactive 3D workspace.',395,12,20,46,HexColor('#c1d4e3'))
for x,title,val in ((46,'KEY CUSTODY','2 OF 3'),(221,'ENCRYPTION','AES-256-GCM'),(396,'RENDERING','WEBGL 3D')):
    c.setFillColor(PANEL);c.roundRect(x,330,154,100,8,fill=1,stroke=0);c.setStrokeColor(BORDER);c.roundRect(x,330,154,100,8,fill=0,stroke=1)
    c.setFillColor(MUTED);c.setFont('DV',8);c.drawString(x+13,399,title);c.setFillColor(CYAN);c.setFont('DVB',15);c.drawString(x+13,359,val)
textblock(283,'SELECTED TRACK',220,9,14,46,CYAN,True)
textblock(262,'AI Pipeline Secret Sharing',390,17,23,46,FG,True)
textblock(219,'Status: runnable local demo, validated JavaScript cryptography, optional real API and Rust/WASM integration. Security research prototype; not production audited.',490,10,17,46,MUTED)
c.showPage()

# P2
base('Strategic track decision')
y=heading(744,'Why the AI Pipeline Track','Security rigor first. Demonstrable engineering second. Visual impact third.')
panel(46,y,240,118,'CRYPTOGRAPHER TRACK','Novel encryption construction; intensive cryptanalysis and side-channel proofs; high chance of undiscovered flaws.',ORANGE)
panel(298,y,251,118,'AI PIPELINE TRACK','Established algorithms allowed; end-to-end threat model, interactive demo, Rust bonus, repeatable tests.',GREEN)
y-=152
y=textblock(y,'RECOMMENDATION',450,10,16,46,CYAN,True)
y=textblock(y-13,'Choose the AI Pipeline Secret Sharing track. It has a more credible path to a robust and distinctive demonstration within hackathon time constraints. No numerical winning probability can be justified without rubric or competitor data.',490,10,17)
y-=27
y=textblock(y,'PROBLEM STATEMENT',450,10,16,46,CYAN,True)
y=textblock(y-13,'AI users often lack visibility over their master-key custody, the difference between encryption at rest and model-side plaintext processing, and the exact confidential fields that leave their device. TLS by itself does not solve inference privacy.',490,10,17)
y-=26
y=textblock(y,'SOLUTION',450,10,16,46,CYAN,True)
y=textblock(y-13,'VEIL//AI creates and splits a random 256-bit vault key, encrypts private prompts locally with authenticated encryption, and separately prepares a user-reviewed redacted text request for an optional external LLM. The 3D key constellation reflects actual threshold state.',490,10,17)
y-=33
y=row(y,'Innovation','Observable trust boundaries, not custom ciphers')
y=row(y,'Real interaction','Drag, zoom, select shares, encrypt, tamper test')
y=row(y,'Deployment target','Loopback / 127.0.0.1:8787')
y=row(y,'Public hosting','Not created; changes threat boundaries')
c.showPage()

# P3
base('System trust boundaries')
y=heading(744,'Architecture & Data Flow','Separate vault ciphertext from the plaintext a conventional cloud LLM receives.')
# diagram boxes
for x,ybox,w,h,tit,desc,col in [
 (46,650,155,89,'USER DEVICE','Prompt + sensitive markers',CYAN),
 (219,650,155,89,'CRYPTO VAULT','AES-GCM + 2/3 key shares',GREEN),
 (391,650,157,89,'REVIEW GATE','Marked fields -> placeholders',BLUE),
 (219,494,330,86,'CLOUD MODEL','Only approved REDACTED text; never key shares',ORANGE)]:
 c.setFillColor(PANEL);c.roundRect(x,ybox-h,w,h,8,stroke=0,fill=1)
 c.setStrokeColor(col);c.roundRect(x,ybox-h,w,h,8,stroke=1,fill=0)
 c.setFillColor(col);c.setFont('DVB',10);c.drawString(x+12,ybox-25,tit)
 textblock(ybox-47,desc,w-24,8.7,13,x+12,MUTED)
c.setStrokeColor(CYAN);c.setLineWidth(1.6);c.line(201,602,219,602);c.line(374,602,391,602)
c.setStrokeColor(ORANGE);c.line(469,561,469,494)
c.setFillColor(ORANGE);c.circle(469,494,3,fill=1,stroke=0)
y=366
y=textblock(y,'DESIGN CONTRACTS',450,10,16,46,CYAN,True)
y=textblock(y-15,'1. Master key and shares stay on the user-owned device. The model request cannot carry them.',492,10,18)
y=textblock(y-4,'2. Private vault material is encrypted locally; only the encrypted envelope is shown for storage/export.',492,10,18)
y=textblock(y-4,'3. A model API cannot use arbitrary AES ciphertext as its ordinary text prompt. Approved redacted plaintext is sent instead.',492,10,18)
y=textblock(y-4,'4. Every external request requires the user to inspect and approve its exact text.',492,10,18)
y-=21
y=textblock(y,'IMPORTANT LIMITATION',450,10,16,46,ORANGE,True)
textblock(y-13,'The provider can read and process approved redacted text. Unmarked and context-inferable secrets may still leak. A fully encrypted inference claim would require a separate FHE or attested confidential-computing solution.',492,10,17,46,MUTED)
c.showPage()

# P4
base('Number theory and authenticated encryption')
y=heading(744,'Mathematics Behind the Keys','2-of-3 Shamir over finite fields + AES-GCM authenticated encryption')
y=textblock(y,'FINITE FIELD SHARE GENERATION',490,10,16,46,CYAN,True)
for line in ['A 256-bit key is parsed as 32 independent elements s in GF(2^8).', 'Choose a uniform random coefficient a for each byte.', 'Construct a degree-one polynomial:  f(x) = s + a*x   (GF(2^8)).', 'Generate 3 shares:  S1=(1,f(1)), S2=(2,f(2)), S3=(3,f(3)).']:
 y=textblock(y-7,line,490,10.4,16)
y-=20
y=textblock(y,'TWO-SHARE RECONSTRUCTION',490,10,16,46,CYAN,True)
for line in ['For distinct share positions x1, x2 with values y1, y2:', 's = y1*[x2 / (x1 XOR x2)] XOR y2*[x1 / (x1 XOR x2)].', 'Field multiplication uses x^8 + x^4 + x^3 + x + 1.', 'A single properly isolated share is statistically independent of the key.']:
 y=textblock(y-7,line,490,10.4,16)
y-=24
panel(46,y,503,114,'AUTHENTICATED ENCRYPTION','AES-256-GCM uses a locally generated key and fresh random 96-bit IV. A ciphertext and authentication tag are created; corrupting even one byte rejects decryption in the demonstration.',GREEN)
y-=145
y=textblock(y,'VERIFICATION EVIDENCE',490,10,16,46,CYAN,True)
y=textblock(y-15,'Node tests exercise all three reconstruction pairs across 200 randomized cycles, a known GF(256) multiplication vector, duplicate shares, wrong-key decryption, ciphertext tampering, and marked-field redaction. Eight test cases passed.',495,10,17)
y-=66
y=textblock(y,'NO NOVEL ENCRYPTION CLAIM',490,10,16,46,ORANGE,True)
textblock(y-13,'The competition permits established algorithms in this track. Shamir and AES-GCM are standard primitives. The illustrative JavaScript/Rust share code is not independently audited or constant-time.',495,10,17)
c.showPage()

# P5
base('Product experience')
y=heading(744,'Immersive Security Cockpit','Designed for exploration, readable evidence, and clear cause-and-effect.')
panel(46,y,242,111,'01 / KEY CONSTELLATION','Rotating WebGL core, 3D guardian shards, glowing rings, orbit camera, zoom and clickable key controls.',CYAN)
panel(300,y,249,111,'02 / KEY CUSTODY','Three guardians, threshold selection, individual share exports and two-file recovery after session reset.',GREEN)
y-=128
panel(46,y,242,111,'03 / ENCRYPTION VIEW','Private prompt editor, real authenticated ciphertext, local verification and tamper attack.',BLUE)
panel(300,y,249,111,'04 / LLM BOUNDARY','Marked-secret preview, explicit approval, offline mock response, optional real API adapter.',ORANGE)
y-=153
y=textblock(y,'USER EXPERIENCE PRINCIPLES',490,10,16,46,CYAN,True)
y=textblock(y-13,'Deep navy background, restrained electric cyan and jade accents, clear typography, layered surfaces, compact telemetry, smooth transitions, and responsive layout. Motion is reduced automatically for users who request less animation.',490,10,17)
y-=26
y=textblock(y,'IMPLEMENTATION',490,10,16,46,CYAN,True)
for key,val in [('Frontend','HTML/CSS + ES modules (no npm runtime dependencies)'),('3D graphics','Custom WebGL mesh and fragment shaders'),('Cryptography','Native Web Crypto AES-256-GCM'),('Threshold math','Shamir GF(256); optional Rust/WASM module'),('Local service','Node built-in HTTP, loopback only'),('Optional LLM','OpenAI API via user-approved server request')]:y=row(y-1,key,val)
c.showPage()

# P6
base('Security and roadmap')
y=heading(744,'Testing, Risks & Next Steps','A defensible MVP says what it has proved—and what it has not.')
for name,desc,col in [('PASS / MATH','200 randomized trials; all 3 pairs; export/import recovery.',GREEN),('PASS / INTEGRITY','Wrong key and tampered ciphertext rejected.',GREEN),('PASS / LOCAL HTTP','Loopback /api/status returned HTTP 200.',GREEN),('NOT VERIFIED / GRAPHICS','Headless Chromium graphics backend unavailable here.',ORANGE),('NOT VERIFIED / RUST','Source is provided; Rust toolchain unavailable here.',ORANGE),('NOT VERIFIED / LIVE API','No provider credentials used in this environment.',ORANGE)]:
 c.setFillColor(col);c.circle(52,y-3,3,fill=1,stroke=0)
 c.setFillColor(FG);c.setFont('DVB',9);c.drawString(65,y,name)
 y=textblock(y-17,desc,473,9.5,14,65,MUTED)-15
y-=12
y=textblock(y,'TOP SECURITY LIMITATIONS',490,10,16,46,CYAN,True)
y=textblock(y-11,'All three shares coexist during initial generation. Separate files plus a reset and 2-file import are supported, but real custody requires independent guardians. The implementation is not side-channel hardened or audited. Unmarked sensitive text can leak. Cloud LLMs still see approved redacted plaintext.',492,9.6,16)
y-=29
y=textblock(y,'NEXT DEVELOPMENT MILESTONES',490,10,16,46,CYAN,True)
y=textblock(y-12,'M1  Compile and test Rust/WASM on the event machine; adopt audited VSS.',494,9.6,16)
y=textblock(y-8,'M2  Attest independent hardware custody and strengthen key lifecycle.',494,9.6,16)
y=textblock(y-8,'M3  Validate real LLM adapter with event-issued API credentials.',494,9.6,16)
y=textblock(y-8,'M4  Perform visual QA, cross-browser checks and security review.',494,9.6,16)
y-=21
y=textblock(y,'LOCAL LAUNCH',490,10,16,46,GREEN,True)
textblock(y-14,'Open folder in VS Code  >  npm run start  >  http://127.0.0.1:8787   |   Tests: npm test',494,9.8,16)
c.save()
print(OUTPUT, 'pages:',page)
