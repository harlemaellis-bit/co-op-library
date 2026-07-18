/**
 * hardware-tiers.js
 * -----------------------------------------------------------------
 * Shared CPU/GPU tier database + scoring/matching helpers.
 *
 * Loaded two ways so both sides always agree on scores:
 *   - Node (fetch-spec-requirements.js), via require('./hardware-tiers.js')
 *   - Browser (info.html), via <script src="hardware-tiers.js">
 *
 * Scores are 0-100 relative performance, aligned to published hardware
 * hierarchies (same source/methodology as the old standalone FPS
 * calculator this replaces). tierFor() buckets a score into 5 labels.
 * -----------------------------------------------------------------
 */
(function (root) {

  // [name, score(0-100), extra] — extra is boost GHz for CPUs, VRAM(GB) for GPUs.
  const CPUS = [
    // -- Core i9 / Core Ultra 9 --
    ["Intel Core i9 14900K",78.2,3.2],["Intel Core i9 13900K",76.8,3.0],["Intel Core Ultra 9 285K",71.8,3.7],
    // -- Core i9 / Core Ultra 9 (Laptop) --
    ["Intel Core Ultra 9 285HX (Laptop)",76.0,2.8],["Intel Core Ultra 9 275HX (Laptop)",73.0,2.7],
    ["Intel Core i9 14900HX (Laptop)",72.0,2.2],["Intel Core i9 13980HX (Laptop)",66.0,2.2],
    // -- Ryzen 9 --
    ["AMD Ryzen 9 9950X3D",95.7,4.3],["AMD Ryzen 9 9900X3D",86.9,4.4],["AMD Ryzen 9 7950X3D",83.9,4.2],
    ["AMD Ryzen 9 9950X",76.9,4.3],["AMD Ryzen 9 9900X",73.9,4.4],["AMD Ryzen 9 7950X",71.0,4.5],
    ["AMD Ryzen 9 7900X",69.2,4.7],["AMD Ryzen 9 5950X",55.3,3.4],["AMD Ryzen 9 5900X",55.1,3.7],
    // -- Ryzen 9 (Laptop) --
    ["AMD Ryzen 9 9955HX3D (Laptop)",87.0,2.5],["AMD Ryzen 9 7945HX3D (Laptop)",76.0,2.5],
    ["AMD Ryzen 9 9955HX (Laptop)",68.0,2.5],["AMD Ryzen 9 7945HX (Laptop)",60.0,2.5],
    ["AMD Ryzen 9 5900HX (Laptop)",44.0,3.3],["AMD Ryzen 9 6900HX (Laptop)",42.0,3.3],
    // -- Core i7 / Core Ultra 7 --
    ["Intel Core Ultra 7 270K Plus",77.5,3.7],["Intel Core i7 14700K",76.4,3.4],
    ["Intel Core i7 13700K",75.8,3.4],["Intel Core Ultra 7 265K",70.3,3.9],
    ["Intel Core i7 12700K",65.8,3.6],
    // -- Core i7 / Core Ultra 7 (Laptop) --
    ["Intel Core Ultra 7 255HX (Laptop)",64.0,2.4],["Intel Core i7 14700HX (Laptop)",61.0,2.1],
    ["Intel Core i7 13700HX (Laptop)",58.0,2.1],["Intel Core i7 12700H (Laptop)",50.0,2.3],
    ["Intel Core i7 11800H (Laptop)",44.0,2.3],["Intel Core i7 10875H (Laptop)",40.0,2.3],
    ["Intel Core i7 9750H (Laptop)",33.0,2.6],
    // -- Ryzen 7 --
    ["AMD Ryzen 7 9850X3D",100,4.7],["AMD Ryzen 7 9800X3D",97,4.7],["AMD Ryzen 7 7800X3D",85.6,4.2],
    ["AMD Ryzen 7 7900X3D",77.1,4.4],["AMD Ryzen 7 5800X3D",72.5,3.4],["AMD Ryzen 7 7700X",70.6,4.5],
    ["AMD Ryzen 7 7700",66.2,3.8],["AMD Ryzen 7 5800X",54.5,3.8],["AMD Ryzen 7 5700X",53.4,3.4],
    // -- Ryzen 7 (Laptop) --
    ["AMD Ryzen 7 7745HX (Laptop)",52.0,3.6],["AMD Ryzen 7 8845HS (Laptop)",48.0,3.8],
    ["AMD Ryzen 7 5800H (Laptop)",40.0,3.2],["AMD Ryzen 7 6800H (Laptop)",38.0,3.2],
    ["AMD Ryzen 7 4800H (Laptop)",28.0,2.9],
    // -- Core i5 / Core Ultra 5 --
    ["Intel Core Ultra 5 250K Plus",73.3,4.2],["Intel Core i5 14600K",72.8,3.5],
    ["Intel Core i5 13600K",70.9,3.5],["Intel Core Ultra 5 245K",67.1,4.2],
    ["Intel Core Ultra 5 225",62.5,3.3],["Intel Core i5 12600K",60.8,3.7],
    ["Intel Core i5 14400",58.0,2.5],["Intel Core i5 12400",51.2,2.5],
    // -- Core i5 / Core Ultra 5 (Laptop) --
    ["Intel Core i5 12500H (Laptop)",43.0,2.5],["Intel Core i5 11400H (Laptop)",37.0,2.7],
    ["Intel Core i5 10300H (Laptop)",30.0,2.5],
    // -- Ryzen 5 --
    ["AMD Ryzen 5 7600X3D",80.6,4.1],["AMD Ryzen 5 9600X",72.6,3.9],
    ["AMD Ryzen 5 7600X",67.3,4.7],["AMD Ryzen 5 7600",61.2,3.8],["AMD Ryzen 5 5600X",51.9,3.7],
    // -- Ryzen 5 (Laptop) --
    ["AMD Ryzen 5 5600H (Laptop)",32.0,3.3],["AMD Ryzen 5 4600H (Laptop)",24.0,3.0]
  ];

  // [name, score(0-100), vramGB]
  const GPUS = [
    // -- NVIDIA GeForce RTX 50-series --
    ["NVIDIA GeForce RTX 5090",100.0,32],["NVIDIA GeForce RTX 5080",81.9,16],
    ["NVIDIA GeForce RTX 5070 Ti",76.2,16],["NVIDIA GeForce RTX 5070",65.1,12],
    ["NVIDIA GeForce RTX 5060 Ti 16GB",51.6,16],["NVIDIA GeForce RTX 5060 Ti 8GB",49.3,8],
    ["NVIDIA GeForce RTX 5060",43.4,8],["NVIDIA GeForce RTX 5050",34.0,8],
    // -- NVIDIA GeForce RTX 50-series (Laptop) --
    ["NVIDIA GeForce RTX 5090 Laptop",80.0,24],["NVIDIA GeForce RTX 5080 Laptop",61.0,16],
    ["NVIDIA GeForce RTX 5070 Ti Laptop",52.0,12],["NVIDIA GeForce RTX 5070 Laptop",44.0,8],
    ["NVIDIA GeForce RTX 5060 Laptop",31.0,8],["NVIDIA GeForce RTX 5050 Laptop",22.0,8],
    // -- NVIDIA GeForce RTX 40-series --
    ["NVIDIA GeForce RTX 4090",90.1,24],["NVIDIA GeForce RTX 4080 Super",78.0,16],
    ["NVIDIA GeForce RTX 4080",77.2,16],["NVIDIA GeForce RTX 4070 Ti Super",69.3,16],
    ["NVIDIA GeForce RTX 4070 Ti",66.3,12],["NVIDIA GeForce RTX 4070 Super",62.2,12],
    ["NVIDIA GeForce RTX 4070",54.7,12],["NVIDIA GeForce RTX 4060 Ti 16GB",43.8,16],
    ["NVIDIA GeForce RTX 4060 Ti 8GB",43.2,8],["NVIDIA GeForce RTX 4060",35.1,8],
    // -- NVIDIA GeForce RTX 40-series (Laptop) --
    ["NVIDIA GeForce RTX 4090 Laptop",71.0,16],["NVIDIA GeForce RTX 4080 Laptop",60.0,12],
    ["NVIDIA GeForce RTX 4070 Laptop",39.0,8],["NVIDIA GeForce RTX 4060 Laptop",29.0,8],
    ["NVIDIA GeForce RTX 4050 Laptop",21.0,6],
    // -- NVIDIA GeForce RTX 30-series --
    ["NVIDIA GeForce RTX 3090 Ti",64.7,24],["NVIDIA GeForce RTX 3090",60.3,24],
    ["NVIDIA GeForce RTX 3080 Ti",58.7,12],["NVIDIA GeForce RTX 3080",54.8,10],
    ["NVIDIA GeForce RTX 3070 Ti",46.4,8],["NVIDIA GeForce RTX 3070",42.8,8],
    ["NVIDIA GeForce RTX 3060 Ti",36.4,8],["NVIDIA GeForce RTX 3060 12GB",30.2,12],
    ["NVIDIA GeForce RTX 3050",21.9,8],
    // -- NVIDIA GeForce RTX 30-series (Laptop) --
    ["NVIDIA GeForce RTX 3080 Ti Laptop",44.0,16],["NVIDIA GeForce RTX 3080 Laptop",38.5,16],
    ["NVIDIA GeForce RTX 3070 Ti Laptop",33.0,8],["NVIDIA GeForce RTX 3070 Laptop",27.0,8],
    ["NVIDIA GeForce RTX 3060 Laptop",20.0,6],["NVIDIA GeForce RTX 3050 Ti Laptop",15.0,4],
    // -- NVIDIA GeForce RTX 20-series --
    ["NVIDIA GeForce RTX 2080 Ti",38.0,11],["NVIDIA GeForce RTX 2080 Super",32.0,8],
    ["NVIDIA GeForce RTX 2070 Super",29.0,8],["NVIDIA GeForce RTX 2060 Super",24.0,8],
    ["NVIDIA GeForce RTX 2060",21.0,6],
    // -- NVIDIA GeForce GTX 10/16-series --
    ["NVIDIA GeForce GTX 1080 Ti",27.0,11],["NVIDIA GeForce GTX 1080",20.0,8],
    ["NVIDIA GeForce GTX 1070 Ti",18.0,8],["NVIDIA GeForce GTX 1070",16.0,8],
    ["NVIDIA GeForce GTX 1660 Ti",14.5,6],["NVIDIA GeForce GTX 1660 Super",14.0,6],
    ["NVIDIA GeForce GTX 1060 6GB",9.5,6],
    // -- AMD Radeon RX 9000-series --
    ["AMD Radeon RX 9070 XT",76.9,16],["AMD Radeon RX 9070",69.1,16],
    ["AMD Radeon RX 9070 GRE",59.2,12],["AMD Radeon RX 9060 XT 16GB",48.2,16],
    ["AMD Radeon RX 9060 XT 8GB",45.7,8],
    // -- AMD Radeon RX 7000-series --
    ["AMD Radeon RX 7900 XTX",79.3,24],["AMD Radeon RX 7900 XT",71.3,20],
    ["AMD Radeon RX 7800 XT",58.1,16],["AMD Radeon RX 7700 XT",50.5,12],
    ["AMD Radeon RX 7600 XT",50.1,16],["AMD Radeon RX 7600",34.3,8],
    // -- AMD Radeon RX 6000-series --
    ["AMD Radeon RX 6950 XT",60.5,16],["AMD Radeon RX 6900 XT",57.4,16],
    ["AMD Radeon RX 6800 XT",54.9,16],["AMD Radeon RX 6750 XT",40.8,12],
    ["AMD Radeon RX 6700 XT",38.9,12],["AMD Radeon RX 6650 XT",31.5,8],
    ["AMD Radeon RX 6600 XT",30.8,8],["AMD Radeon RX 6600",25.5,8],
    // -- Intel Arc --
    ["Intel Arc B580",35.1,12],["Intel Arc B570",31.1,10]
  ];

  function tierFor(score) {
    if (score >= 90) return "flagship";
    if (score >= 75) return "high-end";
    if (score >= 55) return "mid-range";
    if (score >= 35) return "entry-mid";
    return "budget";
  }

  function scoreForName(name, list) {
    const hit = list.find(x => x[0] === name);
    return hit ? { name: hit[0], score: hit[1] } : null;
  }

  // "Intel Core i7 14700K" -> "intel", "AMD Radeon RX 7800 XT" -> "amd",
  // "NVIDIA GeForce RTX 4070" -> "nvidia". Works on any component name that
  // starts with its brand, which is true of every entry in CPUS/GPUS above.
  function brandOf(name) {
    if (!name) return null;
    const n = name.trim().toLowerCase();
    if (n.startsWith("intel")) return "intel";
    if (n.startsWith("amd")) return "amd";
    if (n.startsWith("nvidia")) return "nvidia";
    return null;
  }

  // Fallback brand sniff for raw, unmatched Steam requirement text (e.g. an
  // alternative that named a part older than anything in CPUS/GPUS) — still
  // useful for brand-aware alternative picking even without a score.
  function brandFromText(text) {
    if (!text) return null;
    const n = text.toLowerCase();
    if (/\bintel\b/.test(n)) return "intel";
    if (/\bamd\b/.test(n)) return "amd";
    if (/\bnvidia\b|geforce/.test(n)) return "nvidia";
    return null;
  }

  // Steam frequently lists CPU/GPU requirements as alternatives rather than
  // a combined requirement, e.g. "Intel Core i7-4790K / AMD Ryzen 5 1500X"
  // or "NVIDIA GeForce GTX 980 Ti / AMD Radeon RX 6500 XT". Split on "/" or
  // " or " so each brand's option is evaluated on its own instead of being
  // (wrongly) treated as one combined requirement.
  function splitAlternatives(text) {
    if (!text) return [];
    return text
      .split(/\s*\/\s*|\s+or\s+/i)
      .map(s => s.trim())
      .filter(Boolean);
  }

  // Normalize for matching: lowercase, drop brand words that publishers
  // inconsistently include/omit ("AMD", "Intel", "NVIDIA"), strip everything
  // that isn't a letter or digit.
  function normalize(s) {
    return s
      .toLowerCase()
      .replace(/\(r\)|\(tm\)|®|™/g, "")
      .replace(/\b(amd|nvidia|intel)\b/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  /**
   * Best-effort match of a Steam requirement string (e.g. "Intel Core
   * i5-9600K or better", "AMD Ryzen 5 3600") against our known component
   * list. Deliberately strict: requires the ENTIRE candidate model name
   * (minus "(Laptop)") to appear as a contiguous substring of the
   * requirement text, so "i5 14600K" can never match a requirement that
   * actually says "i5 9600K". Returns null rather than guess when nothing
   * qualifies — expected to happen fairly often for minimum-spec CPUs/GPUs
   * older or more obscure than this list covers (it's weighted toward
   * recent/mid-range-and-up parts). Unmatched components should be reviewed
   * manually, not silently treated as "meets requirement."
   */
  function findComponent(text, list) {
    if (!text) return null;
    const hay = normalize(text);
    if (!hay) return null;
    let best = null;
    for (const entry of list) {
      const key = normalize(entry[0].replace(/\(laptop\)/i, ""));
      if (key.length >= 4 && hay.includes(key)) {
        if (!best || entry[0].length > best[0].length) best = entry;
      }
    }
    return best ? { name: best[0], score: best[1], confidence: "matched" } : null;
  }

  /**
   * Splits a Steam requirement string into its alternatives (see
   * splitAlternatives above) and resolves each one against `list`
   * independently, tagging each with its brand. An alternative that doesn't
   * match anything in `list` still gets a best-effort brand (sniffed from
   * its own text) so brand-aware picking can still work later, even though
   * it won't have a score to compare against.
   *
   * Returns e.g. for "Intel Core i7-4790K / AMD Ryzen 5 1500X":
   *   [{ raw:"Intel Core i7-4790K", brand:"intel", name:null, score:null },
   *    { raw:"AMD Ryzen 5 1500X",   brand:"amd",   name:"AMD Ryzen 5 1500X", score:51.9 }]
   * (i5-4790K predates this list and comes back unmatched — expected.)
   */
  function matchAlternatives(text, list) {
    return splitAlternatives(text).map(raw => {
      const match = findComponent(raw, list);
      return {
        raw,
        brand: match ? brandOf(match.name) : brandFromText(raw),
        name: match ? match.name : null,
        score: match ? match.score : null
      };
    });
  }

  // Severity order for the 5 component statuses, lowest to highest. Used to
  // roll individual CPU/GPU/RAM statuses up into one overall result (the
  // *worst* one wins — a great CPU/GPU can't cancel out too little RAM).
  const STATUS_ORDER = ["below-minimum", "meets-minimum", "above-minimum", "meets-recommended", "exceeds-recommended"];
  const SEVERITY = STATUS_ORDER.reduce((m, s, i) => (m[s] = i, m), {});

  // Fixed storage-speed tiering. This is intentionally independent of what
  // any individual game's Steam page says about storage (that's almost
  // never specified anyway) — it's a general "how much will your drive
  // slow you down" read, same for every game, and never affects the
  // CPU/GPU/RAM-driven overall result.
  const STORAGE_TIER = { hdd: "works", ssd: "meets", nvme: "exceeds" };

  /**
   * Gives a single component (CPU, GPU, or RAM) one of 5 statuses by
   * comparing `myScore` against that component's minimum/recommended
   * requirement scores:
   *
   *   below-minimum      myScore is under the minimum requirement
   *   meets-minimum       at (or just over) the minimum requirement
   *   above-minimum        clears minimum by a real margin, short of recommended
   *   meets-recommended    at (or just over) the recommended requirement
   *   exceeds-recommended  comfortably (25%+) over the recommended requirement
   *
   * If only one of minimum/recommended is known, the scale collapses to the
   * 3 statuses that make sense for that one reference point: below-minimum
   * is reused as the generic "falls short" result either way, since with
   * only one known number there's nothing else to call a shortfall.
   */
  function statusForComponent(myScore, minScore, recScore) {
    if (myScore == null) return null;
    const haveMin = minScore != null;
    const haveRec = recScore != null;
    if (!haveMin && !haveRec) return null;

    if (haveMin && haveRec) {
      if (myScore < minScore) return "below-minimum";
      if (myScore < minScore * 1.1) return "meets-minimum";
      if (myScore < recScore) return "above-minimum";
      if (myScore < recScore * 1.25) return "meets-recommended";
      return "exceeds-recommended";
    }
    if (haveMin) {
      if (myScore < minScore) return "below-minimum";
      if (myScore < minScore * 1.1) return "meets-minimum";
      return "above-minimum";
    }
    // Only recommended is known.
    if (myScore < recScore) return "below-minimum";
    if (myScore < recScore * 1.25) return "meets-recommended";
    return "exceeds-recommended";
  }

  // Picks which alternative (of a possibly brand-split requirement list) to
  // compare a visitor's part against: same brand first, since that's an
  // apples-to-apples comparison Steam intended as one option; otherwise the
  // first alternative that actually resolved to a score, since we still
  // need *something* to compare against and one brand's requirement is
  // almost always a reasonable stand-in for the other's.
  function pickAlternative(alternatives, myBrand) {
    if (!alternatives || !alternatives.length) return null;
    const scored = alternatives.filter(a => a.score != null);
    if (!scored.length) return null;
    const sameBrand = myBrand ? scored.find(a => a.brand === myBrand) : null;
    return sameBrand || scored[0];
  }

  /**
   * Compares `my` (a visitor's or the site owner's specs) against a game's
   * parsed minimum/recommended requirement tiers. Each of CPU, GPU, and RAM
   * gets its own 5-status result; the overall result is the worst of the
   * three (so e.g. a CPU and GPU that exceed recommended can't paper over
   * RAM that's below minimum). Storage is evaluated separately by type
   * (HDD/SSD/NVMe) and never factors into the overall result — only its
   * required capacity does, as an informational note.
   *
   * my: {
   *   cpuScore, cpuBrand,      // cpuBrand: "intel" | "amd" | null
   *   gpuScore, gpuBrand,      // gpuBrand: "nvidia" | "amd" | "intel" | null
   *   ramGB,
   *   storageType              // "hdd" | "ssd" | "nvme" | null
   * }
   * requirement: {
   *   minimum:     { cpu:[alt,...], gpu:[alt,...], ramGB, storageGB },
   *   recommended: { cpu:[alt,...], gpu:[alt,...], ramGB, storageGB }
   * }
   * (each `alt` is one entry from matchAlternatives(): {raw,brand,name,score})
   */
  function evaluate(my, requirement) {
    const min = (requirement && requirement.minimum) || {};
    const rec = (requirement && requirement.recommended) || {};

    const minCpu = pickAlternative(min.cpu, my.cpuBrand);
    const recCpu = pickAlternative(rec.cpu, my.cpuBrand);
    const minGpu = pickAlternative(min.gpu, my.gpuBrand);
    const recGpu = pickAlternative(rec.gpu, my.gpuBrand);

    const cpuStatus = statusForComponent(my.cpuScore, minCpu && minCpu.score, recCpu && recCpu.score);
    const gpuStatus = statusForComponent(my.gpuScore, minGpu && minGpu.score, recGpu && recGpu.score);
    const ramStatus = statusForComponent(my.ramGB, min.ramGB, rec.ramGB);

    const known = [cpuStatus, gpuStatus, ramStatus].filter(Boolean);
    const overall = known.length
      ? known.reduce((worst, s) => (SEVERITY[s] < SEVERITY[worst] ? s : worst))
      : "not-listed";

    // Gap vs. the most demanding tier we have data for (recommended if
    // present, else minimum) — used for the CPU/GPU lean and priority list.
    const targetCpuScore = recCpu ? recCpu.score : (minCpu ? minCpu.score : null);
    const targetGpuScore = recGpu ? recGpu.score : (minGpu ? minGpu.score : null);
    const targetRamGB = rec.ramGB != null ? rec.ramGB : min.ramGB;

    const cpuGap = (targetCpuScore != null && my.cpuScore != null) ? my.cpuScore - targetCpuScore : null;
    const gpuGap = (targetGpuScore != null && my.gpuScore != null) ? my.gpuScore - targetGpuScore : null;
    const ramGap = (targetRamGB != null && my.ramGB != null) ? my.ramGB - targetRamGB : null;

    let lean = null;
    if (cpuGap != null && gpuGap != null && targetCpuScore && targetGpuScore) {
      const cpuRatio = cpuGap / targetCpuScore;
      const gpuRatio = gpuGap / targetGpuScore;
      if (Math.abs(cpuRatio - gpuRatio) < 0.1) lean = "balanced";
      else lean = cpuRatio < gpuRatio ? "cpu" : "gpu";
    }

    const priorities = [];
    if (cpuGap != null && cpuGap < 0) priorities.push({ component: "cpu", severity: cpuGap < -20 ? "critical" : "high", gap: cpuGap });
    if (gpuGap != null && gpuGap < 0) priorities.push({ component: "gpu", severity: gpuGap < -20 ? "critical" : "high", gap: gpuGap });
    if (ramGap != null && ramGap < 0) priorities.push({ component: "ram", severity: "critical", gap: ramGap });
    priorities.sort((a, b) => a.gap - b.gap);

    const storageGB = min.storageGB != null ? min.storageGB : rec.storageGB;

    return {
      overall,
      components: {
        cpu: { status: cpuStatus, myScore: my.cpuScore ?? null, minScore: minCpu ? minCpu.score : null, recScore: recCpu ? recCpu.score : null, minName: minCpu ? minCpu.name : null, recName: recCpu ? recCpu.name : null },
        gpu: { status: gpuStatus, myScore: my.gpuScore ?? null, minScore: minGpu ? minGpu.score : null, recScore: recGpu ? recGpu.score : null, minName: minGpu ? minGpu.name : null, recName: recGpu ? recGpu.name : null },
        ram: { status: ramStatus, myGB: my.ramGB ?? null, minGB: min.ramGB ?? null, recGB: rec.ramGB ?? null }
      },
      storage: {
        requiredGB: storageGB != null ? storageGB : null,
        type: my.storageType || null,
        tier: my.storageType ? STORAGE_TIER[my.storageType] : null
      },
      lean,
      priorities
    };
  }

  const api = {
    CPUS, GPUS, tierFor, scoreForName, findComponent,
    brandOf, brandFromText, splitAlternatives, matchAlternatives,
    statusForComponent, pickAlternative, evaluate
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HardwareTiers = api;

})(typeof window !== "undefined" ? window : global);
