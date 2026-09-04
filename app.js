const toast = document.querySelector('.toast');
const modal = document.querySelector('#rating-modal');
const ratingForm = document.querySelector('#rating-form');
const grid = document.querySelector('#media-grid');
let toastTimer;
let activeDetailTitle = '';
let activeTag = 'all';
const baseEntries = [
  { title: 'Drive My Car', type: 'film', score: 9.2, tags: ['slow burn', 'masterpiece'] },
  { title: 'Hades', type: 'games', score: 9.5, tags: ['replayable', 'fun'] },
  { title: 'Tomorrow, and Tomorrow, and Tomorrow', type: 'books', score: 8.8, tags: ['characters', 'made me cry'] },
  { title: 'Cowboy Bebop', type: 'anime', score: 9.7, tags: ['masterpiece', 'comfort watch'] },
];

async function getSession() {
  if (!window.supabaseClient) return null;
  const { data } = await window.supabaseClient.auth.getSession();
  return data.session;
}

function updateAuthLink(session) {
  const link = document.querySelector('.auth-link');
  if (!link) return;
  link.textContent = session ? 'Log out' : 'Log in';
  if (session) link.onclick = async (event) => {
    event.preventDefault();
    await window.supabaseClient.auth.signOut();
    window.location.reload();
  };
}

async function syncCloudRatings() {
  const session = await getSession();
  updateAuthLink(session);
  if (!session) return;
  const { data, error } = await window.supabaseClient.from('ratings').select('id,title,type,score,status,thought,review,tags,rewatchable,created_at').order('created_at', { ascending: false });
  if (error) {
    console.warn('Cloud ratings are unavailable until the Supabase schema is installed.', error.message);
    return;
  }
  localStorage.setItem('common-ground-ratings', JSON.stringify(data || []));
  document.querySelectorAll('.user-card').forEach((card) => card.remove());
  [...(data || [])].reverse().forEach(addCard);
  updateProfile();
  updateStatusLists();
  renderIndex();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function openModal(title = '') {
  modal.hidden = false;
  document.querySelector('#rating-title').value = title;
  document.querySelector('#rating-title').focus();
}

function closeModal() { modal.hidden = true; }

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((item) => { item.classList.remove('active'); item.setAttribute('aria-selected', 'false'); });
    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');
    const filter = button.dataset.filter;
    document.querySelectorAll('.media-card').forEach((card) => card.classList.toggle('hidden', filter !== 'all' && card.dataset.type !== filter));
  });
});

document.querySelector('[data-action="rate"]').addEventListener('click', () => openModal());
document.querySelector('[data-action="tour"]').addEventListener('click', () => showToast('One list. Every medium. No more split ratings.'));
document.querySelector('[data-action="shuffle"]').addEventListener('click', () => { [...grid.children].sort(() => Math.random() - 0.5).forEach((card) => grid.appendChild(card)); showToast('Here’s something from your list.'); });
document.querySelector('.modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
document.querySelector('.detail-close').addEventListener('click', () => { document.querySelector('#detail-modal').hidden = true; });
document.querySelector('#detail-modal').addEventListener('click', (event) => { if (event.target.id === 'detail-modal') event.target.hidden = true; });
document.querySelector('#detail-status').addEventListener('change', async (event) => {
  const saved = JSON.parse(localStorage.getItem('common-ground-ratings') || '[]');
  const existing = saved.find((entry) => entry.title === activeDetailTitle);
  if (existing) existing.status = event.target.value;
  else saved.unshift({ title: activeDetailTitle, status: event.target.value, type: 'film', score: 0, thought: '' });
  localStorage.setItem('common-ground-ratings', JSON.stringify(saved));
  const session = await getSession();
  if (session) {
    const cloudItem = existing || saved[0];
    const { error } = await window.supabaseClient.from('ratings').upsert({
      ...(cloudItem.id ? { id: cloudItem.id } : {}),
      user_id: session.user.id,
      title: activeDetailTitle,
      type: cloudItem.type || 'film',
      score: Number(cloudItem.score || 0),
      status: event.target.value,
      thought: cloudItem.thought || null,
      review: cloudItem.review || null,
      tags: cloudItem.tags || [],
      rewatchable: Boolean(cloudItem.rewatchable),
    });
    if (error) showToast('Status saved locally. Run the Supabase schema for cloud sync.');
  }
  updateStatusLists();
  showToast(`${activeDetailTitle}: ${event.target.value.toLowerCase()}.`);
});
document.addEventListener('keydown', (event) => { if (event.key !== 'Escape') return; if (!modal.hidden) closeModal(); if (!document.querySelector('#detail-modal').hidden) document.querySelector('#detail-modal').hidden = true; });
document.querySelector('#rating-score').addEventListener('input', (event) => { document.querySelector('#score-output').value = Number(event.target.value).toFixed(1); });

function addCard({ title, type, score, thought }) {
  const labels = { film: 'FILM', games: 'GAME', books: 'BOOK', tv: 'TV', anime: 'ANIME' };
  const card = document.createElement('article');
  card.className = 'media-card user-card';
  card.dataset.type = type;
  const stars = '★'.repeat(Math.ceil(Number(score) / 2)) + '☆'.repeat(5 - Math.ceil(Number(score) / 2));
  card.innerHTML = `<div class="poster poster-user"><span class="poster-small">your entry / ${labels[type]}</span><strong></strong><span class="poster-meta">rated just now</span></div><div class="card-meta"><span class="type-tag ${type}-tag">${labels[type]}</span><span class="rating"><b>${stars}</b> ${Number(score).toFixed(1)}</span></div><h3></h3><p></p>`;
  card.querySelector('.poster strong').textContent = title;
  card.querySelector('h3').textContent = title;
  card.querySelector('p').textContent = thought || 'newly added to your ratings';
  grid.prepend(card);
}

function updateProfile() {
  const saved = JSON.parse(localStorage.getItem('common-ground-ratings') || '[]');
  const baseline = 24;
  document.querySelector('#stat-total').textContent = baseline + saved.length;
  if (!saved.length) return;
  const scores = saved.map((item) => Number(item.score)).filter(Boolean);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  document.querySelector('#stat-average').textContent = average.toFixed(1);
  const counts = saved.reduce((all, item) => { all[item.type] = (all[item.type] || 0) + 1; return all; }, {});
  const favourite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (favourite) document.querySelector('#stat-favourite').textContent = { film: 'FILM', games: 'GAMES', books: 'BOOKS', tv: 'TV', anime: 'ANIME' }[favourite];
}

function updateStatusLists() {
  const groups = { 'Want to experience': 'want', 'In progress': 'progress', Finished: 'finished', Dropped: 'dropped' };
  const saved = JSON.parse(localStorage.getItem('common-ground-ratings') || '[]');
  Object.entries(groups).forEach(([status, key]) => {
    const items = saved.filter((item) => (item.status || 'Want to experience') === status);
    document.querySelector(`#count-${key}`).textContent = items.length;
    const list = document.querySelector(`#list-${key}`);
    list.innerHTML = items.length ? items.slice(0, 4).map((item) => `<li title="${escapeText(item.title)}">${escapeText(item.title)}</li>`).join('') : '<li>Nothing here yet</li>';
  });
}

function getIndexEntries() {
  const saved = JSON.parse(localStorage.getItem('common-ground-ratings') || '[]');
  return [...baseEntries, ...saved].map((entry) => ({ ...entry, tags: entry.tags || [] }));
}

function renderIndex() {
  if (!document.querySelector('#tag-list')) return;
  const entries = getIndexEntries().filter((entry) => activeTag === 'all' || entry.tags.includes(activeTag));
  const tagNames = [...new Set(getIndexEntries().flatMap((entry) => entry.tags))];
  const tagList = document.querySelector('#tag-list');
  tagList.innerHTML = ['all', ...tagNames].map((tag) => `<button class="tag-chip ${activeTag === tag ? 'active' : ''}" type="button" data-tag="${escapeText(tag)}">${escapeText(tag === 'all' ? 'All titles' : tag)}</button>`).join('');
  tagList.querySelectorAll('[data-tag]').forEach((button) => button.addEventListener('click', () => { activeTag = button.dataset.tag; renderIndex(); }));
  const list = document.querySelector('#index-list');
  list.innerHTML = entries.map((entry) => `<article class="index-item"><div><h3>${escapeText(entry.title)}</h3><p>${escapeText(entry.type.toUpperCase())} / ${entry.status || 'RATED'}</p><div class="item-tags">${entry.tags.map((tag) => `#${escapeText(tag)}`).join(' ')}</div></div><strong>${Number(entry.score).toFixed(1)}</strong></article>`).join('') || '<p class="search-status">No titles match this tag.</p>';
  const nodes = document.querySelector('#graph-nodes');
  nodes.innerHTML = '';
  const colors = { film: '#ff6b4a', games: '#d9a95f', books: '#c5b79e', anime: '#a9c2d3', tv: '#a9c2d3' };
  entries.forEach((entry, index) => {
    const angle = index * 1.9;
    const radiusX = 52 + (10 - Number(entry.score)) * 17;
    const radiusY = 52 + (index % 3) * 35;
    const x = 300 + Math.cos(angle) * radiusX;
    const y = 210 + Math.sin(angle) * radiusY;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'graph-node'); circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', 5 + Number(entry.score) / 3); circle.setAttribute('fill', colors[entry.type] || '#a9c2d3');
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title'); title.textContent = `${entry.title} — ${Number(entry.score).toFixed(1)}`; circle.appendChild(title); nodes.appendChild(circle);
    circle.addEventListener('click', () => openModal(entry.title));
  });
}

ratingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(ratingForm);
  const data = Object.fromEntries(formData);
  data.tags = formData.getAll('tag');
  if (data.customTag?.trim()) data.tags.push(data.customTag.trim().toLowerCase());
  delete data.customTag;
  data.score = Number(data.score);
  data.rewatchable = formData.has('rewatchable');
  const saved = JSON.parse(localStorage.getItem('common-ground-ratings') || '[]');
  saved.unshift(data);
  localStorage.setItem('common-ground-ratings', JSON.stringify(saved));
  addCard(data);
  updateProfile();
  updateStatusLists();
  renderIndex();
  closeModal();
  ratingForm.reset();
  saveRatingToCloud(data);
  showToast(`“${data.title}” added to your ratings.`);
});

async function saveRatingToCloud(data) {
  const session = await getSession();
  if (!session) return;
  const { error } = await window.supabaseClient.from('ratings').insert({
    user_id: session.user.id,
    title: data.title,
    type: data.type,
    score: data.score,
    status: data.status,
    thought: data.thought || null,
    review: data.review || null,
    tags: data.tags || [],
    rewatchable: Boolean(data.rewatchable),
  });
  if (error) showToast('Saved locally. Run supabase-schema.sql to enable cloud sync.');
}

document.querySelector('#quick-add').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#title-input');
  const title = input.value.trim();
  if (!title) return showToast('Type a title first.');
  input.value = '';
  openModal(title);
});

JSON.parse(localStorage.getItem('common-ground-ratings') || '[]').reverse().forEach(addCard);
updateProfile();
updateStatusLists();
renderIndex();

const searchForm = document.querySelector('#catalog-search');
const results = document.querySelector('#search-results');
const searchStatus = document.querySelector('#search-status');

function escapeText(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

document.querySelector('[data-action="clear-tag"]')?.addEventListener('click', () => { activeTag = 'all'; renderIndex(); });
document.querySelector('[data-action="new-tag"]')?.addEventListener('click', () => {
  const tag = window.prompt('Name your new tag');
  if (tag?.trim()) showToast(`Add “${tag.trim()}” while rating a title.`);
});

function openDetail(item) {
  const detail = document.querySelector('#detail-modal');
  document.querySelector('#detail-title').textContent = item.title;
  document.querySelector('#detail-meta').textContent = item.meta;
  const image = document.querySelector('#detail-image');
  image.src = item.image || '';
  image.alt = `${item.title} cover`;
  activeDetailTitle = item.title;
  const savedItem = JSON.parse(localStorage.getItem('common-ground-ratings') || '[]').find((entry) => entry.title === item.title);
  document.querySelector('#detail-status').value = savedItem?.status || 'Want to experience';
  detail.hidden = false;
  document.querySelector('.detail-rate').onclick = () => { detail.hidden = true; openModal(item.title); };
}

function resultCard(item) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'result';
  card.innerHTML = `<img alt="" src="${item.image || ''}" /><div class="result-copy"><div class="result-title">${escapeText(item.title)}</div><div class="result-meta">${escapeText(item.meta)}<br />click to rate</div></div>`;
  card.addEventListener('click', () => openDetail(item));
  return card;
}

async function searchBooks(query) {
  const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=4&fields=title,author_name,first_publish_year,cover_i`);
  const data = await response.json();
  return data.docs.map((book) => ({ title: book.title, meta: `BOOK / ${book.first_publish_year || 'unknown'} / ${(book.author_name || ['unknown'])[0]}`, image: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : '' }));
}

async function searchAnime(query) {
  const response = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'query ($search: String) { Page(perPage: 4) { media(search: $search, type: ANIME) { title { english romaji } startDate { year } coverImage { medium } } } }', variables: { search: query } }) });
  const data = await response.json();
  return (data.data?.Page?.media || []).map((anime) => ({ title: anime.title.english || anime.title.romaji, meta: `ANIME / ${anime.startDate.year || 'unknown'} / ANILIST`, image: anime.coverImage.medium }));
}

async function searchCatalog(query, medium) {
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&medium=${encodeURIComponent(medium)}`);
    if (!response.ok) throw new Error('catalog unavailable');
    return (await response.json()).map((item) => ({ title: item.title, meta: `${item.type.toUpperCase()} / ${item.year || 'unknown'} / ${item.source}`, image: item.image }));
  }
  const searches = [];
  if (medium === 'all' || medium === 'books') searches.push(searchBooks(query));
  if (medium === 'all' || medium === 'anime') searches.push(searchAnime(query));
  return (await Promise.all(searches)).flat();
}

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = document.querySelector('#catalog-query').value.trim();
  const medium = document.querySelector('#catalog-medium').value;
  if (!query) return showToast('Search for a title first.');
  results.innerHTML = '';
  searchStatus.textContent = 'searching every category...';
  try {
    const found = await searchCatalog(query, medium);
    found.forEach((item) => results.appendChild(resultCard(item)));
    searchStatus.textContent = found.length ? `${found.length} results / select one to rate it` : 'nothing found — try a different title';
  } catch (error) {
    searchStatus.textContent = 'catalog search is unavailable right now';
    showToast('Could not reach the catalog. Try again in a moment.');
  }
});

syncCloudRatings();
