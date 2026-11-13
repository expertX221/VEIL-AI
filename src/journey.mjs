import { Constellation } from './scene.mjs';

const journey = document.querySelector('.journey');
const canvas = journey.querySelector('canvas');
const crystal = new Constellation(canvas, () => {}, { cinematic: true });
const chapters = [...journey.querySelectorAll('[data-chapter]')];

const audio = journey.querySelector('.journey-audio');
let narrated = -1;
let active = 0;
let narration = false;
function speak(index) {
  if (!narration || narrated === index) return;
  narrated = index;
  speechSynthesis.cancel();
  const message = new SpeechSynthesisUtterance(chapters[index].querySelector('p:not(.journey-label)').textContent);
  message.rate = 0.9;
  speechSynthesis.speak(message);
}
if ('speechSynthesis' in window) {
  audio.hidden = false;
  audio.addEventListener('click', () => {
    narration = !narration;
    audio.setAttribute('aria-pressed', String(narration));
    audio.textContent = narration ? 'Narration on' : 'Narration off';
    if (narration) speak(active);
    else { speechSynthesis.cancel(); narrated = -1; }
  });
}
function update() {
  const viewport = window.innerHeight;
  const progress = Math.max(0, Math.min(chapters.length - 1,
    -journey.getBoundingClientRect().top / viewport));
    const index = Math.round(progress);
  active = index;
  if (journey.getBoundingClientRect().bottom > 0) speak(index);
  journey.style.setProperty('--vortex-angle', progress * 120 + 'deg');
  journey.dataset.scene = String(index);
  journey.querySelectorAll('.film-set').forEach((set, i) => {
    set.style.opacity = Math.max(0, 1 - Math.abs(progress - i));
  });
  journey.querySelectorAll('.film-links a').forEach((link, i) => {
    if (i === index) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  crystal.setMode(['balanced', 'defense', 'alert'][index]);
  crystal.setChapter(progress);
  journey.style.setProperty('--journey-progress', progress / (chapters.length - 1));
  chapters.forEach((chapter, i) => chapter.toggleAttribute('data-current', i === index));
}
let pending = false;
addEventListener('scroll', () => {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; update(); });
}, { passive: true });
addEventListener('resize', update);
update();



