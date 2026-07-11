# Co-op Library

A small site listing co-op games with live pricing pulled from
[IsThereAnyDeal](https://isthereanydeal.com).

- `coop-library.html` — main page (game grid, themes, card accent colors)
- `price-history.html` — redirects to the main page
- `games.json` — curated list of games (Steam appid + title)
- `fetch-prices.js` — runs at build time, reads `games.json`, calls the
  ITAD API, and writes `prices.json`
- `netlify/functions/scheduled-refresh.js` — scheduled Netlify function
  that pings a build hook once a day to keep prices fresh
- `theme.js` — site-wide theme switcher and per-card accent color picker

## Setup

Set these environment variables in your Netlify site settings:

- `ITAD_API_KEY` — free key from https://isthereanydeal.com/apps/my/
- `BUILD_HOOK_URL` — a Netlify build hook URL, used by the daily
  scheduled refresh

See `netlify.toml` for the build command.
