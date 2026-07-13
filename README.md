# Co-op Library — Price History Setup

This site no longer asks visitors for an API key. Instead, price data is
fetched **once ahead of time** and served as a static JSON file. Here's how
it fits together:

```
games.json          <- you edit this to add/remove games (must match appids used in coop-library.html)
fetch-prices.js      <- reads games.json, calls IsThereAnyDeal, writes prices.json
prices.json           <- generated file, loaded by the page (never edit by hand)
game-info.json        <- per-game detail pages: theme, gallery, i18n (EN/FR), platform data — you hand-edit most of this
fetch-game-info.js    <- refreshes each game's `gallery` field in game-info.json from the Steam appdetails API
coop-library.html      <- the main library page (grid of games, filters)
info.html               <- one reusable game-details page for every game, driven by game-info.json (?game=<appid>)
price-history.html      <- the chart page, deep-linked as price-history.html?appid=NNNN
netlify.toml          <- tells Netlify to run fetch-prices.js + fetch-game-info.js on every deploy
netlify/functions/scheduled-refresh.js <- pings a build hook once a day
```

`coop-library.html`'s "📈 Price history" link on each card points to
`price-history.html?appid=<that game's Steam appid>`, which reads
`games.json` + `prices.json` to find the matching game and render its chart.
If you want `coop-library.html` to be the page visitors land on first,
rename it to `index.html` (or add a Netlify redirect from `/` to
`/coop-library.html`).

## Game details pages

There's one HTML file for every game's detail page: `info.html`. It reads
`?game=<appid>` from the URL and pulls that game's entry out of
`game-info.json` — theme colors/fonts, hero image, gallery, platform info,
English + French copy, all of it. To add a details page for a new game, add
an entry to `game-info.json` keyed by its Steam appid (copy an existing
entry as a starting point) and link to `info.html?game=<appid>`. No new
HTML file needed.

Screenshots in `gallery` are the one part of that file meant to be
machine-generated rather than hand-typed: `fetch-game-info.js` calls
Steam's public appdetails API for every appid already in `game-info.json`
and overwrites `gallery` with real, full-size screenshots (up to 8). It
runs automatically as part of the Netlify build (see `netlify.toml`), same
as the price fetch. It never touches theme, i18n, or platform data — only
`gallery`, and `heroImage` if that field is empty. If you've hand-picked a
gallery for a game and don't want it overwritten on the next deploy, add
`"lockGallery": true` to that game's entry.

To test it locally: `node fetch-game-info.js` (no API key needed, unlike
the price fetch — Steam's appdetails endpoint is public).

## One-time setup

1. **Get an ITAD API key**
   Register a small app at https://isthereanydeal.com/apps/my/ (no approval
   needed) and copy the API key it gives you.

2. **Add the key to Netlify (not to the code!)**
   Netlify dashboard → Site settings → Environment variables → add:
   - `ITAD_API_KEY` = your key

3. **Create a Build Hook**
   Netlify dashboard → Site settings → Build & deploy → Build hooks →
   Add build hook (name it e.g. `daily-price-refresh`). Copy the URL it
   gives you.

4. **Add the build hook URL as an environment variable too**
   - `BUILD_HOOK_URL` = the URL from step 3

That's it. From now on:
- Every time you push a change (or Netlify auto-deploys), it runs
  `node fetch-prices.js` as part of the build, which regenerates
  `prices.json` with fresh data.
- The scheduled function fires once a day (04:00 UTC by default — edit the
  cron in `scheduled-refresh.js` if you want a different time) and triggers
  a rebuild automatically, even if you haven't touched the code.

## Theme switcher

Both pages include a small circle-button switcher (🌙 / ☀️ / 🖼️) powered by `theme.js`:

- **Dark** and **Light** swap the color palette instantly.
- **Custom** lets a visitor upload their own photo as a wallpaper. The image is resized/compressed in the browser and saved in `localStorage`, so it stays applied across pages and future visits **on that browser only** — it's not uploaded anywhere or shared with other visitors.
- Clicking 🖼️ again while it's already active lets you swap the photo; the ✕ button that appears next to it removes the wallpaper and reverts to the last dark/light theme.

To add the switcher to a new page, include the script and an empty container:

```html
<script src="theme.js"></script>
...
<div class="theme-switch" id="themeSwitcher"></div>
```

and copy the `.theme-switch` / `.theme-btn` / `.theme-remove-btn` CSS rules from `coop-library.html` or `price-history.html`.

## Adding a game

Just edit `games.json` and add an entry with the Steam appid:

```json
{ "appid": 570, "title": "Dota 2", "players": "2-10" }
```

Commit + push (or redeploy). The next build will fetch its price history
automatically.

## Testing locally

You'll need Node 18+ (for built-in `fetch`). From this folder:

```bash
ITAD_API_KEY=your_key_here node fetch-prices.js
```

Then serve the folder with any static server (double-clicking the HTML
file won't work — browsers block API-style fetches from `file://` pages,
even for local JSON in some browsers). For example:

```bash
npx serve .
```
