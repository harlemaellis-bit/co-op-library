/**
 * scheduled-refresh.js
 * -----------------------------------------------------------------
 * Runs automatically once a day (see `config.schedule` below).
 * It doesn't fetch prices itself — instead it pings a Netlify
 * "Build Hook" URL, which tells Netlify to rebuild the site.
 * Rebuilding reruns `node fetch-prices.js` (see netlify.toml),
 * which regenerates prices.json with fresh data, then deploys it.
 *
 * SETUP (one-time, in the Netlify dashboard):
 *   1. Site settings -> Build & deploy -> Build hooks -> Add build hook
 *      Name it e.g. "daily-price-refresh", save it.
 *   2. Copy the generated URL.
 *   3. Site settings -> Environment variables -> add:
 *        BUILD_HOOK_URL = <the URL you copied>
 *   4. Also make sure ITAD_API_KEY is set there too (used by
 *      fetch-prices.js during the build).
 * -----------------------------------------------------------------
 */

export default async () => {
  const hookUrl = process.env.BUILD_HOOK_URL;

  if (!hookUrl) {
    console.error("BUILD_HOOK_URL is not set — skipping rebuild trigger.");
    return new Response("Missing BUILD_HOOK_URL", { status: 500 });
  }

  const res = await fetch(hookUrl, { method: "POST" });

  if (!res.ok) {
    console.error(`Build hook call failed: ${res.status}`);
    return new Response(`Build hook failed: ${res.status}`, { status: 502 });
  }

  console.log("Triggered a rebuild to refresh prices.json");
  return new Response("Rebuild triggered", { status: 200 });
};

// Runs once a day at 04:00 UTC. Adjust the cron expression if you'd
// like a different time.
export const config = {
  schedule: "0 4 * * *"
};
