const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

async function searchOpenLibrary(query) {
  const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=title,author_name,first_publish_year,cover_i`);
  const data = await response.json();
  return data.docs.map((book) => ({ source: 'Open Library', type: 'books', title: book.title, year: book.first_publish_year, creator: book.author_name?.[0], image: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : '' }));
}

async function searchAniList(query) {
  const response = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'query ($search: String) { Page(perPage: 8) { media(search: $search, type: ANIME) { title { english romaji } startDate { year } coverImage { medium } } } }', variables: { search: query } }) });
  const data = await response.json();
  return (data.data?.Page?.media || []).map((anime) => ({ source: 'AniList', type: 'anime', title: anime.title.english || anime.title.romaji, year: anime.startDate.year, creator: 'AniList', image: anime.coverImage.medium }));
}

async function searchTmdb(query) {
  if (!process.env.TMDB_API_KEY) return [];
  const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);
  const data = await response.json();
  return (data.results || []).filter((item) => ['movie', 'tv'].includes(item.media_type)).slice(0, 8).map((item) => ({ source: 'TMDB', type: item.media_type === 'movie' ? 'film' : 'tv', title: item.title || item.name, year: (item.release_date || item.first_air_date || '').slice(0, 4), creator: item.media_type === 'movie' ? 'Movie' : 'TV', image: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '' }));
}

async function search(query, medium) {
  const requests = [];
  if (medium === 'all' || medium === 'books') requests.push(searchOpenLibrary(query));
  if (medium === 'all' || medium === 'anime') requests.push(searchAniList(query));
  if (medium === 'all' || medium === 'film' || medium === 'tv') requests.push(searchTmdb(query));
  return (await Promise.all(requests)).flat();
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  if (requestUrl.pathname === '/api/search') {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    try { response.end(JSON.stringify(await search(requestUrl.searchParams.get('q') || '', requestUrl.searchParams.get('medium') || 'all'))); }
    catch { response.statusCode = 502; response.end(JSON.stringify({ error: 'catalog unavailable' })); }
    return;
  }
  const requested = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const filePath = path.normalize(path.join(root, requested));
  if (!filePath.startsWith(root)) { response.statusCode = 403; return response.end('Forbidden'); }
  fs.readFile(filePath, (error, content) => { if (error) { response.statusCode = 404; return response.end('Not found'); } response.setHeader('Content-Type', mime[path.extname(filePath)] || 'text/plain; charset=utf-8'); response.end(content); });
});

server.listen(port, () => console.log(`Common Ground running at http://localhost:${port}`));
