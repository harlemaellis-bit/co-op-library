/**
 * fetch-game-info.js
 * -----------------------------------------------------------------
 * Fills in `heroImage` for any game listed in game-info.json that
 * doesn't already have one, straight from Steam's appdetails API.
 * Everything else in game-info.json (theme, i18n, platform labels,
 * quick facts, and the `gallery` screenshots) is hand-written and
 * left alone — this script only touches heroImage, and only when
 * it's missing.
 *
 * The gallery is 100% manual now: this script never reads or writes
 * `entry.gallery`. Add screenshot URLs to a game's "gallery" array
 * in game-info.json yourself and they'll stay exactly as you left
 * them, forever — no lockGallery flag needed, since there's nothing
 * left to lock.
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
 * -----------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

const STEAM_ENDPOINT = "https://store.steampowered.com/api/appdetails";
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

  const needHero = appids.filter(appid => !gameInfo[appid].heroImage);

  console.log(`${appids.length} game(s) total, ${needHero.length} missing a heroImage.`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const appid of appids) {
    const entry = gameInfo[appid];

    if (entry.heroImage) {
      skipped++;
      continue;
    }

    try {
      console.log(`  - ${appid}: fetching from Steam for heroImage...`);
      const data = await fetchGameDetails(appid);

      // Deliberately using the first real screenshot, not data.header_image —
      // Steam's header image is a branded poster/packshot (logo + tagline on
      // a mostly-empty background), which reads as staged rather than
      // "in the game," and that's exactly the look this hero band should
      // avoid.
      const firstScreenshot = (data.screenshots || [])
        .map(s => s.path_full)
        .filter(Boolean)[0];

      if (firstScreenshot) {
        entry.heroImage = firstScreenshot;
        updated++;
      } else {
        console.warn(`    Steam returned no screenshots for ${appid}, leaving heroImage unset`);
      }
    } catch (err) {
      console.error(`    Failed for ${appid}: ${err.message}`);
      failed++;
    }

    await sleep(REQUEST_DELAY_MS);
  }

  fs.writeFileSync(infoPath, JSON.stringify(gameInfo, null, 2) + "\n");
  console.log(`\nWrote ${infoPath}`);
  console.log(`${updated} heroImage(s) added, ${skipped} already had one, ${failed} failed.`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
