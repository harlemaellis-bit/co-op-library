/**
 * fetch-prices.js
 * -----------------------------------------------------------------
 * Reads games.json (Harlem's curated game list), calls the
 * IsThereAnyDeal API for each game, and writes prices.json.
 *
 * Run manually:   ITAD_API_KEY=xxxx node fetch-prices.js
 * Run on GitHub Pages: set ITAD_API_KEY as a repo Actions secret; this
 *                  runs automatically via the scheduled workflow (see
 *                  .github/workflows/refresh-data.yml), which commits the
 *                  refreshed prices.json so Pages picks it up.
 * -----------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

const API_BASE = "https://api.isthereanydeal.com";
const COUNTRY = "FR";
const STEAM_SHOP_ID = 61;
const HISTORY_YEARS_BACK = 2;

const API_KEY = process.env.ITAD_API_KEY;

async function main() {
  if (!API_KEY) {
    console.error(
      "ERROR: ITAD_API_KEY environment variable is not set.\n" +
      "Get a free key at https://isthereanydeal.com/apps/my/ and set it as\n" +
      "an environment variable before running this script."
    );
    process.exit(1);
  }

  const gamesPath = path.join(__dirname, "games.json");
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));

  console.log(`Fetching price data for ${games.length} game(s)...`);

  const result = {
    generatedAt: new Date().toISOString(),
    country: COUNTRY,
    games: {}
  };

  for (const game of games) {
    try {
      console.log(`  - ${game.title} (appid ${game.appid})`);
      const data = await fetchGameData(game.appid);
      result.games[game.appid] = data;
    } catch (err) {
      console.error(`    Failed: ${err.message}`);
      // Keep going so one bad game doesn't kill the whole build.
      result.games[game.appid] = { error: err.message };
    }
  }

  const outPath = path.join(__dirname, "prices.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`Wrote ${outPath}`);
}

async function fetchGameData(appid) {
  // 1. Resolve Steam appid -> ITAD game ID
  const lookupRes = await fetch(
    `${API_BASE}/games/lookup/v1?key=${encodeURIComponent(API_KEY)}&appid=${appid}`
  );
  if (!lookupRes.ok) throw new Error(`Lookup failed (${lookupRes.status}): ${await lookupRes.text()}`);
  const lookup = await lookupRes.json();
  if (!lookup.found) throw new Error("Game not found on IsThereAnyDeal");
  const itadId = lookup.game.id;

  // 2. Current price + all-time / yearly low (Steam only)
  const pricesRes = await fetch(
    `${API_BASE}/games/prices/v3?key=${encodeURIComponent(API_KEY)}&country=${COUNTRY}&shops=${STEAM_SHOP_ID}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([itadId])
    }
  );
  if (!pricesRes.ok) throw new Error(`Prices failed (${pricesRes.status}): ${await pricesRes.text()}`);
  const pricesData = await pricesRes.json();
  const priceInfo = pricesData[0] || {};
  const steamDeal = (priceInfo.deals || [])[0] || null;

  // 3. Full price history log (Steam only), going back N years
  const since = new Date();
  since.setFullYear(since.getFullYear() - HISTORY_YEARS_BACK);
  // ITAD expects RFC3339 without milliseconds, e.g. 2024-07-11T01:15:00Z
  const sinceStr = since.toISOString().replace(/\.\d{3}Z$/, "Z");
  const historyRes = await fetch(
    `${API_BASE}/games/history/v2?key=${encodeURIComponent(API_KEY)}&id=${itadId}&country=${COUNTRY}&shops=${STEAM_SHOP_ID}&since=${encodeURIComponent(sinceStr)}`
  );
  if (!historyRes.ok) throw new Error(`History failed (${historyRes.status}): ${await historyRes.text()}`);
  const rawHistory = await historyRes.json();

  const history = rawHistory
    .map(h => ({
      date: h.timestamp,
      price: h.deal.price.amount,
      currency: h.deal.price.currency
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    itadId,
    current: steamDeal ? steamDeal.price : null,
    allTimeLow: priceInfo.historyLow?.all || null,
    yearLow: priceInfo.historyLow?.y1 || null,
    history
  };
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
