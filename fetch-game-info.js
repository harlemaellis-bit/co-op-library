/**
 * fetch-game-info.js
 * -----------------------------------------------------------------
 * Refreshes the `gallery` (screenshots) for every game already listed
 * in game-info.json, straight from Steam's appdetails API. Everything
 * else in game-info.json (theme, i18n, platform labels, quick facts)
 * is hand-written and left alone — this script only touches images.
 *
 * Why this has to run here and not in info.html:
 * store.steampowered.com/api/appdetails doesn't send CORS headers, so
 * a browser fetch() to it is blocked no matter what. Same wall as the
 * ITAD price API, same fix: call it at build time (here, or on
 * Netlify) and write a static file the browser can read same-origin.
 * No API key needed — this endpoint is public.
 *
 * Run manually:   node fetch-game-info.js
 * Run on Netlify:  wired into the build command in netlify.toml,
 *                  runs automatically on every deploy.
 *
 * Per-game opt-out: add "lockGallery": true to a game's entry in
 * game-info.json and this script will skip its screenshots (useful
 * once you've hand-picked a gallery you like and don't want it
 * overwritten on the next deploy).
 * -----------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

const STEAM_ENDPOINT = "https://store.steampowered.com/api/appdetails";
const MAX_SCREENSHOTS = 8;
const REQUEST_DELAY_MS = 1200; // Steam rate-limits this endpoint hard — stay polite

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchGameDetails(appid) {
  const res = await fetch(`${STEAM_ENDPOINT}?appids=${appid}&cc=us&l=english`);
  if (!res.ok) throw new Error(`Steam API returned ${res.status}`);
  const json = await res.json();
  const entry = json[String(appid)];
  if (!entry || !entry.success) throw new Error("Steam API had no data for this appid");
  return entry.data;
}

async function main() {
  const infoPath = path.join(__dirname, "game-info.json");
  const gameInfo = JSON.parse(fs.readFileSync(infoPath, "utf8"));
  const appids = Object.keys(gameInfo);

  console.log(`Refreshing screenshots for ${appids.length} game(s)...`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const appid of appids) {
    const entry = gameInfo[appid];

    if (entry.lockGallery) {
      console.log(`  - ${appid}: skipped (lockGallery: true)`);
      skipped++;
      continue;
    }

    try {
      console.log(`  - ${appid}: fetching from Steam...`);
      const data = await fetchGameDetails(appid);

      const screenshots = (data.screenshots || [])
        .map(s => s.path_full)
        .filter(Boolean)
        .slice(0, MAX_SCREENSHOTS);

      if (screenshots.length) {
        entry.gallery = screenshots;
      } else {
        console.warn(`    Steam returned no screenshots for ${appid}, leaving existing gallery as-is`);
      }

      // Only fill this in if nothing's there yet — several entries already
      // use a hand-picked hero shot that looks better than Steam's default
      // header image, and that choice should win.
      if (!entry.heroImage && data.header_image) {
        entry.heroImage = data.header_image;
      }

      updated++;
    } catch (err) {
      console.error(`    Failed for ${appid}: ${err.message}`);
      failed++;
    }

    await sleep(REQUEST_DELAY_MS);
  }

  fs.writeFileSync(infoPath, JSON.stringify(gameInfo, null, 2) + "\n");
  console.log(`\nWrote ${infoPath}`);
  console.log(`${updated} updated, ${skipped} skipped, ${failed} failed.`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
