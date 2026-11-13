import { Constellation } from './scene.mjs';

const journey = document.querySelector('.journey');
const canvas = journey.querySelector('canvas');
const crystal = new Constellation(canvas, () => {}, { cinematic: true });
const chapters = [...journey.querySelectorAll('[data-chapter]')];

function update() {
  const viewport = window.innerHeight;
  const progress = Math.max(0, Math.min(chapters.length - 1,
    -journey.getBoundingClientRect().top / viewport));
    const index = Math.round(progress);
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


