# Rater

> One place for everything you rate.

Rater is a cross-medium rating journal for people who are tired of splitting their taste across different apps. Track books, games, films, TV, and anime in one personal library, then see how your ratings connect through tags, lists, and a visual taste map.

## Why Rater?

Most rating platforms are built around one medium. Rater is built around the person doing the rating.

It gives you one place to:

- Search for titles across multiple catalogues
- Rate titles from 0–10 with half-point precision
- Add short thoughts, longer reviews, custom tags, and rewatchable status
- Organise titles by status: want to experience, in progress, finished, or dropped
- Browse a dedicated visual Index of your taste
- Keep ratings tied to your account across devices

## Current experience

- Editorial dark-mode interface with responsive layouts
- Homepage feed for recent ratings
- Dedicated profile page with favourites, stats, tags, and activity
- Animated Index page for exploring the shape of your library
- Supabase authentication and user-specific rating storage
- Open Library search for books
- AniList search for anime
- Optional TMDB search for films and TV

## Tech stack

- HTML, CSS, and vanilla JavaScript
- Node.js built-in HTTP server
- Supabase Auth and Postgres
- Open Library API
- AniList GraphQL API
- TMDB API (optional)

## Run locally

You’ll need Node.js 18 or newer.

```bash
node server.js
```

Then open [http://localhost:4173](http://localhost:4173).

## Supabase setup

The frontend is already configured with the project’s publishable Supabase key.

1. Open the project in Supabase.
2. Go to **SQL Editor**.
3. Paste the contents of [`supabase-schema.sql`](./supabase-schema.sql).
4. Run the SQL to create the ratings table and Row Level Security policies.
5. Open [`http://localhost:4173/auth.html`](http://localhost:4173/auth.html) and create an account.

Never add a Supabase service-role key to the frontend. The database policies are what ensure users can only access their own ratings.

## Optional movie and TV search

Create a local environment variable for TMDB before starting the server:

```bash
TMDB_API_KEY=your_key_here node server.js
```

On Windows PowerShell:

```powershell
$env:TMDB_API_KEY="your_key_here"
node server.js
```

Books and anime search work without this key. Game catalogue integration is planned because IGDB requires Twitch application credentials.

## Project structure

```text
index.html             Homepage and rating feed
profile.html           Personal profile view
map.html               Dedicated animated taste Index
auth.html              Sign up and log in
app.js                 Homepage interactions and rating persistence
profile.js             Profile rendering and cloud sync
map.js                 Animated Index experience
server.js              Static server and catalogue proxy
styles.css             Shared visual system and responsive styles
supabase-schema.sql    Database table and security policies
```

## Roadmap

- [ ] Game search through IGDB
- [ ] Public profiles and shareable lists
- [ ] Taste matching between users
- [ ] Follow system and activity feed
- [ ] Import ratings from existing platforms
- [ ] Advanced comparisons across mediums

## Status

Rater is an actively developed personal project and product experiment. The core rating flow, profile experience, visual Index, catalogue search, and account-backed storage are in place; the roadmap tracks the next layer of community features.

## License

This project is currently private/unlicensed. Add a license before accepting external contributions.
