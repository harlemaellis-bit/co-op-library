/**
 * fetch-spec-requirements.js
 * -----------------------------------------------------------------
 * Powers the "Can You Run It?" section on each game's info page.
 *
 * For every game in game-info.json, this pulls that game's minimum and
 * recommended PC requirements from Steam, matches the listed CPU/GPU text
 * against hardware-tiers.js, and writes a `canYouRunIt` block back into
 * game-info.json containing:
 *   - requirements.minimum / requirements.recommended (parsed tiers, for
 *     the interactive "Check Your Specs" tab to compare visitor hardware
 *     against, client-side, with no further Steam calls needed). CPU and
 *     GPU are each stored as an ARRAY of alternatives (Steam often lists
 *     "Intel ... / AMD ..." as either/or, not a combined requirement) —
 *     see matchAlternatives() in hardware-tiers.js. Storage capacity
 *     (storageGB) is stored too, but only as an informational note —
 *     storage TYPE (HDD/SSD/NVMe) is compared separately client-side and
 *     never affects pass/fail.
 *   - mySpecs (the per-component status + overall result for YOUR_SPECS
 *     below, precomputed so the page can render it instantly)
 *
 * Why this has to run here and not in info.html: same as
 * fetch-game-info.js — store.steampowered.com/api/appdetails sends no CORS
 * headers, so a browser fetch() to it is blocked. Build-time fetch + a
 * static file the browser reads same-origin is the fix.
 *
 * Run manually:   node fetch-spec-requirements.js
 * Run on Netlify:  wire into the build command in netlify.toml alongside
 *                  fetch-game-info.js, so it refreshes on every deploy.
 *
 * IMPORTANT — matching isn't perfect: Steam's requirement text is
 * publisher-written free text, and hardware-tiers.js only covers
 * recent/mid-range-and-up parts. Minimum-spec CPUs/GPUs in particular are
 * often older than anything in that list and will come back unmatched —
 * that's expected, not a bug. Every unmatched component is logged below so
 * you can sanity-check or hand-correct specific games afterward.
 * -----------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const HardwareTiers = require("./hardware-tiers.js");

const STEAM_ENDPOINT = "https://store.steampowered.com/api/appdetails";
const REQUEST_DELAY_MS = 1200; // Steam rate-limits this endpoint hard — stay polite

// ---- Your specs (used to precompute the automatic "Can You Run It?" badge)
// Update this if your hardware changes, then re-run the script.
// storageType: "hdd" | "ssd" (SATA SSD) | "nvme" — set to whatever your
// actual boot/install drive is. Left as "nvme" here as a placeholder for a
// 2021 Razer Blade Pro 17, which shipped with an NVMe SSD — change it if
// yours is different.
const YOUR_SPECS_NAMED = {
  cpuName: "Intel Core i7 10875H (Laptop)",
  gpuName: "NVIDIA GeForce RTX 3060 Laptop",
  ramGB: 16,
  storageType: "nvme"
};

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

// Steam's pc_requirements.minimum/recommended are HTML strings like:
// "<strong>Minimum:</strong><br><ul class="bb_ul"><li><strong>OS:</strong> Windows 10<br></li>
//  <li><strong>Processor:</strong> Intel Core i5-4460<br></li>
//  <li><strong>Memory:</strong> 8 GB RAM<br></li>
//  <li><strong>Graphics:</strong> NVIDIA GTX 760<br></li>...</ul>"
function parseRequirementBlock(html) {
  if (!html) return null;

  const items = [...html.matchAll(/<strong>([^<]+):<\/strong>\s*([^<]*)/gi)]
    .map(m => ({ label: m[1].trim().toLowerCase(), value: m[2].trim() }));

  const get = label => (items.find(i => i.label.includes(label)) || {}).value || "";

  const cpuText = get("processor");
  const gpuText = get("graphics");
  const memText = get("memory");
  const storageText = get("storage");

  // Each is an array of alternatives (usually 1, sometimes 2+ when Steam
  // lists "Intel ... / AMD ...") — see matchAlternatives() in
  // hardware-tiers.js. The client picks whichever alternative matches the
  // visitor's own CPU/GPU brand at comparison time.
  const cpu = HardwareTiers.matchAlternatives(cpuText, HardwareTiers.CPUS);
  const gpu = HardwareTiers.matchAlternatives(gpuText, HardwareTiers.GPUS);

  return {
    raw: { cpu: cpuText, gpu: gpuText, memory: memText, storage: storageText },
    cpu,
    gpu,
    ramGB: HardwareTiers.parseSizeToGB(memText),
    storageGB: HardwareTiers.parseSizeToGB(storageText)
  };
}

async function main() {
  const infoPath = path.join(__dirname, "game-info.json");
  const gameInfo = JSON.parse(fs.readFileSync(infoPath, "utf8"));
  const appids = Object.keys(gameInfo);

  const myCpu = HardwareTiers.scoreForName(YOUR_SPECS_NAMED.cpuName, HardwareTiers.CPUS);
  const myGpu = HardwareTiers.scoreForName(YOUR_SPECS_NAMED.gpuName, HardwareTiers.GPUS);
  if (!myCpu) throw new Error(`YOUR_SPECS_NAMED.cpuName "${YOUR_SPECS_NAMED.cpuName}" isn't in hardware-tiers.js CPUS`);
  if (!myGpu) throw new Error(`YOUR_SPECS_NAMED.gpuName "${YOUR_SPECS_NAMED.gpuName}" isn't in hardware-tiers.js GPUS`);
  const mySpecsScored = {
    cpuScore: myCpu.score,
    cpuBrand: HardwareTiers.brandOf(myCpu.name),
    gpuScore: myGpu.score,
    gpuBrand: HardwareTiers.brandOf(myGpu.name),
    ramGB: YOUR_SPECS_NAMED.ramGB,
    storageType: YOUR_SPECS_NAMED.storageType
  };

  console.log(`${appids.length} game(s) total.`);
  console.log(`Comparing against: ${YOUR_SPECS_NAMED.cpuName} / ${YOUR_SPECS_NAMED.gpuName} / ${YOUR_SPECS_NAMED.ramGB}GB RAM / ${YOUR_SPECS_NAMED.storageType} storage\n`);

  let updated = 0;
  let notListed = 0;
  let failed = 0;
  const unmatched = [];

  for (const appid of appids) {
    const entry = gameInfo[appid];
    const gameName = entry.headerBrand || appid;

    try {
      console.log(`  - ${appid} (${gameName}): fetching requirements from Steam...`);
      const data = await fetchGameDetails(appid);
      const pcReq = data.pc_requirements || {};

      const minimum = parseRequirementBlock(pcReq.minimum);
      const recommended = parseRequirementBlock(pcReq.recommended);

      if (!minimum && !recommended) {
        entry.canYouRunIt = { requirements: { minimum: null, recommended: null }, mySpecs: { overall: "not-listed" } };
        notListed++;
        console.log(`    No requirements listed on Steam — badge set to Not Listed.`);
      } else {
        const flagUnmatched = (block, label) => {
          if (!block) return;
          if (block.cpu.length && block.cpu.every(a => !a.name)) unmatched.push(`${gameName} (${appid}) — ${label} CPU: "${block.raw.cpu}"`);
          if (block.gpu.length && block.gpu.every(a => !a.name)) unmatched.push(`${gameName} (${appid}) — ${label} GPU: "${block.raw.gpu}"`);
        };
        flagUnmatched(minimum, "minimum");
        flagUnmatched(recommended, "recommended");

        const requirements = { minimum, recommended };
        const mySpecs = HardwareTiers.evaluate(mySpecsScored, requirements);

        entry.canYouRunIt = { requirements, mySpecs };
        updated++;
      }
    } catch (err) {
      console.error(`    Failed for ${appid}: ${err.message}`);
      failed++;
    }

    // NOTE: this must stay outside the try block (and never behind a
    // `continue`) so every game — including "not listed" ones and failures —
    // still pays the polite delay before the next Steam request fires.
    await sleep(REQUEST_DELAY_MS);
  }

  fs.writeFileSync(infoPath, JSON.stringify(gameInfo, null, 2) + "\n");
  console.log(`\nWrote ${infoPath}`);
  console.log(`${updated} updated, ${notListed} had no Steam requirements listed, ${failed} failed.`);

  if (unmatched.length) {
    console.log(`\n${unmatched.length} component(s) couldn't be confidently matched to hardware-tiers.js (left as null — those checks are just skipped, not treated as a fail). Worth a manual look:`);
    unmatched.forEach(line => console.log(`  - ${line}`));
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
