# lumen

Dark, minimal proxy start page: Instagram, Spotify, TikTok, YouTube, SoundCloud, Discord, Reddit, a games page and a full tabbed browser — all routed through Scramjet + Wisp.

## Run locally
```bash
npm install
npm start          # http://localhost:8080
```

## Deploy (needs a real server — NOT Vercel/Netlify)
The proxy needs WebSockets (`/wisp/`), so use a host that runs a persistent Node process:
- **Railway / Render / Koyeb:** new web service from the repo, start command `npm start`. They set `PORT` automatically.
- **VPS:** `npm i && PORT=8080 node server.js` behind Caddy/Nginx (enable WebSocket upgrade).

HTTPS is required in production (service workers only run on https or localhost).

## Where to edit
| What | File |
|---|---|
| Home tiles | `public/app.js` → `DEFAULT_TILES` |
| Games list / trending | `public/app.js` → `GAMES`, `TRENDING` |
| Logo text | `public/index.html` → `.logo` |
| Colors, sizes | `public/style.css` → `:root` |
| Proxy URL prefix | `public/app.js` → `prefix: "/learn/"` |

## Features
- Search bar (URL or search) → opens in proxied browser
- Tabs, back/forward/reload, fullscreen
- Add/remove custom bookmark tiles (saved in localStorage)
- Settings: tab cloak (Classroom/Docs/Drive/Canvas), search engine, panic key + redirect, about:blank launcher, custom Wisp server
- Reset local, Trending, Links

## Notes
- Instagram/TikTok: browsing and watching usually work; **logging in often fails** due to their bot checks. YouTube and Spotify playback are more reliable (Spotify full playback needs a logged-in Premium account and DRM, which may not work through any web proxy).
- Scramjet v1.1.0 is the stable line; v2 is in alpha. Upgrade later by bumping `@mercuryworkshop/scramjet`.
