import { Universe } from './universe.mjs';

const root = document.querySelector('.universe');
const scene = new Universe(root.querySelector('canvas'), () => {}, {cinematic:true});
const chapters = [...root.querySelectorAll('[data-chapter]')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const motion = document.getElementById('motion-toggle');
const voice = document.getElementById('voice-toggle');
let paused = reduced.matches;
let narration = false;
let spoken = -1;
let active = 0;
scene.setAutoRotate(!paused);
motion.textContent = paused ? 'Resume motion' : 'Pause motion';
motion.setAttribute('aria-pressed',String(paused));

function speak() {
  if(!narration || spoken === active)return;
  speechSynthesis.cancel();
  spoken=active;
  const text=chapters[active].querySelector('.chapter-description').textContent;
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.rate=.91;
  speechSynthesis.speak(utterance);
}
motion.addEventListener('click',()=>{
  paused=!paused;
  scene.setAutoRotate(!paused);
  motion.textContent=paused?'Resume motion':'Pause motion';
  motion.setAttribute('aria-pressed',String(paused));
});
if('speechSynthesis' in window){
  voice.hidden=false;
  voice.addEventListener('click',()=>{
    narration=!narration;
    voice.textContent=narration?'Mute narration':'Enable narration';
    voice.setAttribute('aria-pressed',String(narration));
    if(narration)speak();
    else {speechSynthesis.cancel();spoken=-1;}
  });
}
function update(){
  const rect=root.getBoundingClientRect();
  const progress=Math.max(0,Math.min(6,-rect.top/innerHeight));
  active=Math.round(progress);
  scene.setChapter(reduced.matches?active:progress);
  document.getElementById('chapter-status').textContent=chapters[active].querySelector('.chapter-label').textContent;
  if(rect.bottom<=0 || rect.top>innerHeight){if(narration)speechSynthesis.cancel();}
  else speak();
}
let pending=false;
addEventListener('scroll',()=>{
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{pending=false;update();});
},{passive:true});
addEventListener('resize',update);
addEventListener('pagehide',()=>{if('speechSynthesis' in window)speechSynthesis.cancel();});
update();
