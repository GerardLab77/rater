const baseEntries = [
  { title: 'Drive My Car', type: 'film', score: 9.2, tags: ['slow burn', 'masterpiece'] },
  { title: 'Hades', type: 'games', score: 9.5, tags: ['replayable', 'fun'] },
  { title: 'Tomorrow, and Tomorrow, and Tomorrow', type: 'books', score: 8.8, tags: ['characters', 'made me cry'] },
  { title: 'Cowboy Bebop', type: 'anime', score: 9.7, tags: ['masterpiece', 'comfort watch'] },
];
const colors = { film: '#ff6b4a', games: '#d9a95f', books: '#c5b79e', anime: '#a9c2d3', tv: '#a9c2d3' };
const canvas = document.querySelector('#orbit-canvas');
const context = canvas.getContext('2d');
const tooltip = document.querySelector('#orbit-tooltip');
let activeTag = 'all';
let visibleEntries = [];
let orbiters = [];
let width = 1000;
let height = 650;
let pointer = { x: -100, y: -100 };

const escapeText = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const getEntries = () => [...baseEntries, ...JSON.parse(localStorage.getItem('common-ground-ratings') || '[]')].map((item) => ({ ...item, tags: item.tags || [] }));

function resize() {
  const ratio = window.devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = Math.max(520, bounds.height);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function makeOrbiters() {
  orbiters = visibleEntries.map((entry, index) => ({ entry, orbit: index % 3, angle: index * 1.75, speed: (0.00012 + (index % 4) * 0.000035) * (index % 2 ? -1 : 1), phase: index * 1.3 }));
}

function renderLists() {
  const all = getEntries();
  visibleEntries = all.filter((entry) => activeTag === 'all' || entry.tags.includes(activeTag));
  const tags = [...new Set(all.flatMap((item) => item.tags))];
  document.querySelector('#map-tags').innerHTML = ['all', ...tags].map((tag) => `<button class="tag-chip ${tag === activeTag ? 'active' : ''}" data-tag="${escapeText(tag)}" type="button">${escapeText(tag === 'all' ? 'all titles' : tag)}</button>`).join('');
  document.querySelectorAll('#map-tags [data-tag]').forEach((button) => button.onclick = () => { activeTag = button.dataset.tag; renderLists(); });
  document.querySelector('#map-count').textContent = `${String(visibleEntries.length).padStart(2, '0')} entries`;
  document.querySelector('#map-entries').innerHTML = visibleEntries.map((item) => `<div class="map-entry"><span class="map-entry-dot" style="background:${colors[item.type] || colors.tv}"></span><span>${escapeText(item.title)}</span><small>${escapeText(item.type)} / ${Number(item.score).toFixed(1)}</small></div>`).join('') || '<p class="search-status">No titles match this tag.</p>';
  makeOrbiters();
}

function draw(timestamp) {
  context.clearRect(0, 0, width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width / 1000, height / 650);
  const rings = [[width * .34, height * .19, -.1], [width * .25, height * .42, .35], [width * .43, height * .27, -.28]];
  context.save();
  context.translate(centerX, centerY);
  rings.forEach(([radiusX, radiusY, rotation], index) => {
    context.save(); context.rotate(rotation); context.beginPath(); context.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2); context.strokeStyle = index === 1 ? 'rgba(169,194,211,.28)' : 'rgba(242,239,232,.16)'; context.lineWidth = 1; context.stroke(); context.restore();
  });
  context.restore();
  const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 145 * scale);
  gradient.addColorStop(0, 'rgba(169,194,211,.23)'); gradient.addColorStop(.4, 'rgba(169,194,211,.07)'); gradient.addColorStop(1, 'rgba(169,194,211,0)'); context.fillStyle = gradient; context.beginPath(); context.arc(centerX, centerY, 145 * scale, 0, Math.PI * 2); context.fill();
  orbiters.forEach((orbiter, index) => {
    const [radiusX, radiusY, rotation] = rings[orbiter.orbit];
    const angle = orbiter.angle + timestamp * orbiter.speed;
    const localX = Math.cos(angle) * radiusX;
    const localY = Math.sin(angle) * radiusY;
    const x = centerX + localX * Math.cos(rotation) - localY * Math.sin(rotation);
    const y = centerY + localX * Math.sin(rotation) + localY * Math.cos(rotation);
    const size = 5 + Number(orbiter.entry.score) / 2.4;
    context.save(); context.shadowBlur = 18; context.shadowColor = colors[orbiter.entry.type] || colors.tv; context.fillStyle = colors[orbiter.entry.type] || colors.tv; context.beginPath(); context.arc(x, y, size, 0, Math.PI * 2); context.fill(); context.restore();
    orbiter.x = x; orbiter.y = y; orbiter.size = size;
    if (index % 3 === 0) { context.strokeStyle = `${colors[orbiter.entry.type] || colors.tv}44`; context.beginPath(); context.arc(x, y, size + 8 + Math.sin(timestamp * .002 + orbiter.phase) * 2, 0, Math.PI * 2); context.stroke(); }
  });
  context.save(); context.fillStyle = '#a9c2d3'; context.shadowBlur = 40; context.shadowColor = '#a9c2d3'; context.beginPath(); context.arc(centerX, centerY, 46 * scale, 0, Math.PI * 2); context.fill(); context.restore();
  window.requestAnimationFrame(draw);
}

canvas.addEventListener('mousemove', (event) => { const bounds = canvas.getBoundingClientRect(); pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; const hit = orbiters.find((orbiter) => Math.hypot(pointer.x - orbiter.x, pointer.y - orbiter.y) < orbiter.size + 9); if (!hit) { tooltip.classList.remove('visible'); return; } tooltip.textContent = `${hit.entry.title} · ${Number(hit.entry.score).toFixed(1)}`; tooltip.style.left = `${pointer.x + 18}px`; tooltip.style.top = `${pointer.y + 18}px`; tooltip.classList.add('visible'); });
canvas.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
document.querySelector('#map-clear').onclick = () => { activeTag = 'all'; renderLists(); };
window.addEventListener('resize', resize);
resize(); renderLists(); window.requestAnimationFrame(draw);
