/**
 * sidebar.js
 * -----------------------------------------------------------------
 * Site-wide left nav rail — new visual design (rounded glass panel,
 * "MENU" section label, Settings flyout with background/theme
 * options). Replaces the old flat icon-rail design but keeps the
 * same footprint on the page: fixed to the left edge, full height
 * (top of the page to the bottom).
 *
 *   Logo/brand -> coop-library.html
 *   Home       -> coop-library.html
 *   Favorites  -> favorites.html (clicking the row navigates there;
 *                 the chevron instead opens/closes a dropdown of
 *                 every game you've favorited, same as before)
 *   Settings   -> opens a flyout panel next to the rail. Right now
 *                 only two controls in it are wired up for real:
 *                   - "Upload image"   -> same background-upload
 *                                         flow as the old settings
 *                                         menu (theme.js)
 *                   - light / dark     -> same theme switch as the
 *                                         old settings menu (theme.js)
 *                 Everything else in the flyout ("solid colors",
 *                 "image from Gallery", the theme swatch grid,
 *                 "device", "reset to default") is visual-only for
 *                 now — placeholders to wire up later.
 *
 * Fully self-contained — include after theme.js and favorites.js:
 *
 *   <script src="theme.js"></script>
 *   <script src="favorites.js"></script>
 *   <script src="sidebar.js"></script>
 * -----------------------------------------------------------------
 */
(function () {
  const file = (window.location.pathname.split("/").pop() || "").toLowerCase();
  const isHome = file === "" || file === "coop-library.html" || file === "index.html";
  const isFav = file === "favorites.html";
  const isComingSoon = file === "coming-soon.html";

  const RAIL_COLLAPSED = 76;
  const RAIL_EXPANDED = 260;
  const FLYOUT_WIDTH = 272;
  const EXPANDED_KEY = "coopRailExpanded";
  const FAV_OPEN_KEY = "coopRailFavOpen";
  const SOLID_BG_KEY = "coopSolidBg";
  const THEME_PALETTE_KEY = "coopThemePalette";

  const I18N = {
    en: {
      toggleMenu: "Toggle menu",
      brandHome: "Co-op Library home",
      brand: "co-op library",
      menu: "MENU",
      home: "Home",
      settings: "Settings",
      favorites: "Favorites",
      showFavorites: "Show favorited games",
      favoritesEmpty: "Heart a game from its info page and it'll show up here.",
      comingSoon: "Coming Soon",
      followUs: "Follow us",
      changeBackground: "change background",
      solidColors: "solid colors",
      themes: "Themes",
      uploadImage: "Upload image",
      light: "light",
      dark: "dark",
      device: "device",
      resetDefault: "reset to default",
      back: "Back",
      solidColorsTitle: "Solid colors",
      themesTitle: "Themes",
      clayTheme: "Clay",
      neonTheme: "Neon",
      customPaletteTitle: "Custom palette",
      customCard: "Card",
      customLabel: "Label",
      customPill: "Chips"
    },
    fr: {
      toggleMenu: "Afficher/masquer le menu",
      brandHome: "Accueil de Co-op Library",
      brand: "co-op library",
      menu: "MENU",
      home: "Accueil",
      settings: "Paramètres",
      favorites: "Favoris",
      showFavorites: "Afficher les jeux favoris",
      favoritesEmpty: "Ajoutez un jeu depuis sa fiche pour le voir apparaître ici.",
      comingSoon: "À venir",
      followUs: "Suivez-nous",
      changeBackground: "changer le fond",
      solidColors: "couleurs unies",
      themes: "Thèmes",
      uploadImage: "Importer une image",
      light: "clair",
      dark: "sombre",
      device: "système",
      resetDefault: "réinitialiser",
      back: "Retour",
      solidColorsTitle: "Couleurs unies",
      themesTitle: "Thèmes",
      clayTheme: "Clay",
      neonTheme: "Néon",
      customPaletteTitle: "Palette personnalisée",
      customCard: "Carte",
      customLabel: "Titre",
      customPill: "Puces"
    }
  };
  function lang() {
    return window.CoopLang ? window.CoopLang.get() : "en";
  }

  function getSaved(key) {
    try { return localStorage.getItem(key) === "1"; } catch (e) { return false; }
  }
  function saveFlag(key, val) {
    try { localStorage.setItem(key, val ? "1" : "0"); } catch (e) {}
  }

  function getSavedSolidBg() {
    try { return localStorage.getItem(SOLID_BG_KEY) || ""; } catch (e) { return ""; }
  }
  function getSiteThemeMode() {
    try { return localStorage.getItem("siteTheme") === "light" ? "light" : "dark"; } catch (e) { return "dark"; }
  }
  // Mixes a hex color toward white by `amount` (0-1). Used so a picked
  // solid color reads as a light-mode-appropriate tint instead of its
  // full saturated (dark-mode) value.
  function lightenHex(hex, amount) {
    const c = hex.replace("#", "");
    const full = c.length === 3 ? c.split("").map(ch => ch + ch).join("") : c;
    const num = parseInt(full, 16);
    let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
    return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
  }
  function displaySolidBg(hex) {
    return getSiteThemeMode() === "light" ? lightenHex(hex, 0.45) : hex;
  }
  function applySolidBg(hex) {
    const display = displaySolidBg(hex);
    document.documentElement.style.background = display;
    document.body.style.background = display;
  }
  function chooseSolidBg(hex) {
    try { localStorage.setItem(SOLID_BG_KEY, hex); } catch (e) {}
    applySolidBg(hex);
  }
  function clearSolidBg() {
    try { localStorage.removeItem(SOLID_BG_KEY); } catch (e) {}
    document.documentElement.style.background = "";
    document.body.style.background = "";
  }

  function getSavedThemePaletteIndex() {
    try {
      const raw = localStorage.getItem(THEME_PALETTE_KEY);
      if (raw === null || raw === "custom") return -1;
      return parseInt(raw, 10);
    } catch (e) { return -1; }
  }
  function isCustomPaletteActive() {
    try { return localStorage.getItem(THEME_PALETTE_KEY) === "custom"; } catch (e) { return false; }
  }
  // Picks black or white, whichever reads better against a given hex
  // background — used so card notes / active toggle text stay legible
  // no matter which of the 3 palette colors ends up behind them.
  function contrastText(hex) {
    const c = hex.replace("#", "");
    const full = c.length === 3 ? c.split("").map(ch => ch + ch).join("") : c;
    const num = parseInt(full, 16);
    const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? "#161616" : "#ffffff";
  }

  // --- Color-math helpers for the custom palette picker (ported from
  // the old sidebar's single-color "Card accent" picker, generalized
  // to drive 3 independent sliders instead of 1). ---
  function clamp01(v) { return Math.min(1, Math.max(0, v)); }
  function hexToRgb(hex) {
    if (!hex) return null;
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    const num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b]
      .map(v => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, "0"))
      .join("");
  }
  function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
  }
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    return { h, s: max === 0 ? 0 : d / max, v: max };
  }

  const CUSTOM_PALETTE_KEY = "coopCustomPalette";
  const CUSTOM_PALETTE_DEFAULT = { card: "#606c38", label: "#283618", pill: "#fefae0" };

  function getSavedCustomPalette() {
    try {
      const raw = localStorage.getItem(CUSTOM_PALETTE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.card && parsed.label && parsed.pill) return parsed;
      return null;
    } catch (e) { return null; }
  }
  function saveCustomPalette(palette) {
    try { localStorage.setItem(CUSTOM_PALETTE_KEY, JSON.stringify(palette)); } catch (e) {}
  }
  // "custom" is stored as a sentinel string in THEME_PALETTE_KEY (which
  // otherwise holds a numeric index into THEME_PALETTES) so the two
  // sources of truth — curated grid vs. custom picker — share one
  // "what's currently selected" flag instead of drifting out of sync.
  function chooseCustomPalette(palette) {
    saveCustomPalette(palette);
    try { localStorage.setItem(THEME_PALETTE_KEY, "custom"); } catch (e) {}
    applyPaletteColors(palette);
  }

  // What the custom picker should seed itself from when opened. If a
  // curated palette is active, that palette's exact colors (so Lemon
  // Zest -> custom "snaps to" Lemon Zest). If custom is already active,
  // its own saved values. Otherwise (freshly reset — no palette at
  // all) the site's own native colors for whichever mode is currently
  // showing, read straight off <html> rather than a hardcoded default.
  function getCurrentEffectivePalette() {
    if (isCustomPaletteActive()) {
      return getSavedCustomPalette() || CUSTOM_PALETTE_DEFAULT;
    }
    const idx = getSavedThemePaletteIndex();
    if (idx >= 0 && THEME_PALETTES[idx]) {
      const p = THEME_PALETTES[idx];
      return { card: p.card, label: p.label, pill: p.pill };
    }
    const cs = getComputedStyle(document.documentElement);
    const read = (name, fallback) => {
      const v = cs.getPropertyValue(name).trim();
      return v || fallback;
    };
    return {
      card: read("--surface", "#1b1f2e"),
      label: read("--text", "#eef1f7"),
      pill: read("--bg", "#0e1016")
    };
  }

  function chooseThemePalette(index) {
    try { localStorage.setItem(THEME_PALETTE_KEY, String(index)); } catch (e) {}
    applyThemePalette(index);
  }

  // Pushes 3 palette colors onto <html> as CSS vars and toggles the
  // .cn-theme-applied class the CSS rules above key off of. Colors map
  // 1:1 to (1) card background, (2) label text, (3) the squad-size /
  // budget pill container behind the labels (.mode-tag / .price-tag).
  // Shared by both the curated grid (applyThemePalette) and the custom
  // 3-slider picker (chooseCustomPalette) so they stay in lockstep.
  function applyPaletteColors(palette) {
    const root = document.documentElement;
    if (!palette) {
      root.classList.remove("cn-theme-applied");
      ["--cn-t-card", "--cn-t-label", "--cn-t-pill", "--cn-t-note", "--cn-t-active-text"].forEach(v => root.style.removeProperty(v));
      return;
    }
    root.style.setProperty("--cn-t-card", palette.card);
    root.style.setProperty("--cn-t-label", palette.label);
    root.style.setProperty("--cn-t-pill", palette.pill);
    // Derived, not curated: always legible regardless of which 3 hex
    // values a palette (or a future custom one) happens to use.
    root.style.setProperty("--cn-t-note", contrastText(palette.card));
    // Reused everywhere text sits directly on the pill color: price-tag,
    // mode-tag (the bottom-right player tag), filter chips, and the
    // active language toggle.
    root.style.setProperty("--cn-t-active-text", contrastText(palette.pill));
    root.classList.add("cn-theme-applied");
  }
  function applyThemePalette(index) {
    applyPaletteColors(THEME_PALETTES[index] || null);
  }

  // Curated 3-color aesthetic palettes for the theme grid. Roles named
  // explicitly (not positional) — card/label/pill map 1:1 to what's
  // already live: (1) card background, (2) title text on the card,
  // (3) the squad-size/budget pill + chip background.
  const THEME_PALETTES = [
    { name: 'Lemon Zest Delight', card: '#606c38', label: '#283618', pill: '#fefae0' },
    { name: 'Ocean Breeze',       card: '#023047', label: '#219ebc', pill: '#ffb703' },
    { name: 'Terracotta Dusk',    card: '#3d405b', label: '#e07a5f', pill: '#f2cc8f' }
  ];
  const SOLID_COLORS = [

    '#4286f5', '#03a9f5', '#00bcd5', '#3f51b5',
    '#673bb7', '#9c28b1', '#b19bd9', '#009788',
    '#109d58', '#8bc24a', '#cddc39', '#f5b400',
    '#fbbc6f', '#ff9700', '#e46962', '#fe5722',
    '#ea1e63', '#ff758f', '#f1adf0', '#fdc5c6',
    '#e8d1a8', '#795547', '#9e9e9e', '#607d8b',
    '#888888', '#303030'
  ];

  // ---------------------------------------------------------------
  // UI "Themes" — a whole-site skin, distinct from the per-card
  // accent colors above (solid bg / theme palette / custom palette).
  // Picking one overrides the site's core --bg/--surface/--text
  // variable set (the same 8 vars theme.js's dark/light modes drive)
  // so every page that already themes itself off those vars —
  // coop-library, favorites, info — recolors automatically. A second
  // set of "extra" vars plus the .cn-clay-active / .cn-neon-active CSS
  // below layer each theme's decorative look on top of that base
  // recolor. Each theme just needs a `vars` + `extra` object below,
  // plus a matching `html.cn-<id>-active` CSS block further down.
  // ---------------------------------------------------------------
  const UI_THEME_KEY = "coopUiTheme"; // "" | "clay" | "neon"

  const UI_THEMES = {
    clay: {
      label: "Clay",
      // Core site vars (same 8 keys theme.js's dark/light palettes set)
      vars: {
        "--bg": "#8f8e88",
        "--bg-alt": "#96958e",
        "--surface": "#a3a29d",
        "--surface-hover": "#adaca6",
        "--border": "transparent",
        "--text": "#3a3733",
        "--text-dim": "#4a4742",
        "--text-faint": "#615d57"
      },
      // Decorative extras that power the puffy/embossed look
      extra: {
        "--clay": "#A3A29D",
        "--clay-hi": "#ADACA6",
        "--clay-lo": "#96958E",
        "--clay-divider": "rgba(0,0,0,0.16)",
        "--clay-hover-bg": "rgba(255,255,255,0.14)",
        "--clay-accent-dark": "#2e2b28",
        "--clay-accent-text": "#f5f3f0",
        "--clay-dark-pill": "#2b2825",
        "--clay-shadow-drop": "19px 7px 4px rgba(0,0,0,0.25)",
        "--clay-shadow-dark": "inset -8px -8px 16px #413C3C",
        "--clay-shadow-light": "inset 8px 8px 20px #E7F4F5",
        "--clay-shadow-puffy": "var(--clay-shadow-drop), var(--clay-shadow-dark), var(--clay-shadow-light)",
        "--clay-shadow-chip": "8px 4px 5px rgba(0,0,0,0.22), inset -4px -4px 8px #413C3C, inset 4px 4px 10px #E7F4F5",
        "--clay-shadow-sunken": "inset 6px 6px 10px #413C3C, inset -6px -6px 10px #E7F4F5",
        "--clay-shadow-chip-color": "4px 3px 5px rgba(0,0,0,0.28), inset -3px -3px 6px rgba(0,0,0,0.22), inset 3px 3px 7px rgba(255,255,255,0.35)",
        "--clay-font-logo": "'Baloo 2', cursive",
        "--clay-font-ui": "'Poppins', system-ui, sans-serif"
      },
      // Small preview swatch shown in the Themes grid
      preview: { bg: "#96958E", panel: "#A3A29D", dot: "#2e2b28" }
    },
    neon: {
      label: "Neon",
      // Core site vars (same 8 keys theme.js's dark/light palettes set)
      vars: {
        "--bg": "#0b0221",
        "--bg-alt": "#150a30",
        "--surface": "#150a30",
        "--surface-hover": "#1d0f42",
        "--border": "rgba(0,255,242,0.28)",
        "--text": "#eafcff",
        "--text-dim": "rgba(210,235,245,0.68)",
        "--text-faint": "rgba(210,235,245,0.42)"
      },
      // Decorative extras that power the cyan/pink glow look
      extra: {
        "--neon-cyan": "#00fff2",
        "--neon-pink": "#ff2bd6",
        "--neon-violet": "#8b5cf6",
        "--neon-panel-bg": "rgba(14,6,32,0.55)",
        "--neon-panel-bg-solid": "#150a30",
        "--neon-panel-border": "rgba(0,255,242,0.9)",
        "--neon-divider": "rgba(0,255,242,0.55)",
        "--neon-hover-bg": "rgba(255,43,214,0.10)",
        "--neon-tile-bg": "rgba(255,255,255,0.04)",
        "--neon-tile-bg-active": "rgba(0,255,242,0.12)",
        "--neon-tile-border": "rgba(0,255,242,0.55)",
        "--neon-accent": "#ff2bd6",
        "--neon-accent-text": "#1a0314",
        "--neon-dark-pill": "#0d0420",
        "--neon-glow-cyan": "0 0 6px rgba(0,255,242,0.85), 0 0 18px rgba(0,255,242,0.45), 0 0 40px rgba(0,255,242,0.2)",
        "--neon-glow-pink": "0 0 6px rgba(255,43,214,0.85), 0 0 18px rgba(255,43,214,0.45), 0 0 40px rgba(255,43,214,0.2)",
        "--neon-font-logo": "'Orbitron', sans-serif",
        "--neon-font-ui": "'Rajdhani', sans-serif"
      },
      // Small preview swatch shown in the Themes grid
      preview: { bg: "#0b0221", panel: "#150a30", dot: "#00fff2" }
    }
  };

  function getSavedUiTheme() {
    try {
      const v = localStorage.getItem(UI_THEME_KEY);
      return UI_THEMES[v] ? v : "";
    } catch (e) { return ""; }
  }
  function applyUiTheme(id) {
    const root = document.documentElement;
    const theme = UI_THEMES[id];
    if (!theme) return;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    Object.entries(theme.extra).forEach(([k, v]) => root.style.setProperty(k, v));
    // Only one whole-site theme can be active at a time — drop any
    // other theme's active class before adding this one's.
    Object.keys(UI_THEMES).forEach(otherId => root.classList.remove(`cn-${otherId}-active`));
    root.classList.add(`cn-${id}-active`);
  }
  function clearUiTheme() {
    const root = document.documentElement;
    Object.entries(UI_THEMES).forEach(([id, theme]) => {
      Object.keys(theme.vars).forEach(k => root.style.removeProperty(k));
      Object.keys(theme.extra).forEach(k => root.style.removeProperty(k));
      root.classList.remove(`cn-${id}-active`);
    });
    // Re-apply whatever dark/light base theme.js normally owns, since
    // we just wiped its inline --bg/--surface/etc overrides too.
    if (window.CoopTheme && window.CoopTheme.reapplyBase) window.CoopTheme.reapplyBase();
  }
  function chooseUiTheme(id) {
    try {
      if (id) localStorage.setItem(UI_THEME_KEY, id);
      else localStorage.removeItem(UI_THEME_KEY);
    } catch (e) {}
    if (id) {
      // A whole-site theme is a fixed, curated look — clear any
      // per-card color customization so nothing's left fighting it.
      clearSolidBg();
      try { localStorage.removeItem(THEME_PALETTE_KEY); } catch (e) {}
      try { localStorage.removeItem(CUSTOM_PALETTE_KEY); } catch (e) {}
      applyThemePalette(-1);
      if (window.CoopTheme && window.CoopTheme.clearCardColor) window.CoopTheme.clearCardColor();
      applyUiTheme(id);
    } else {
      clearUiTheme();
    }
    window.dispatchEvent(new CustomEvent("coopUiThemeChanged", { detail: { id } }));
  }

  const STYLE = `
    @import url("https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Kavoon&family=Poppins:wght@400;500;600;700&family=Orbitron:wght@500;600;700;800&family=Rajdhani:wght@400;500;600;700&display=swap");

    body{ padding-top:24px !important; padding-left:${RAIL_COLLAPSED + 16}px !important; }
    .theme-menu-btn{ display:none !important; }

    /* Smoother cross-fade when navigating between pages (e.g. Home <->
       Favorites), on browsers that support the View Transitions API.
       No-ops harmlessly on browsers that don't. */
    ::view-transition-old(root), ::view-transition-new(root){
      animation-duration: 0.22s;
      animation-timing-function: ease;
    }

    .cn-rail, .cn-flyout{
      /* Theme-reactive glass panel. theme.js sets --bg/--surface/--text
         etc. on <html> for light vs dark mode already — we tint our
         own translucent panel from those same variables. Dark mode
         gets a transparent version of the site's navy; light mode
         gets a plain white tint instead (via the .cn-light override
         below), toggled in JS to match whatever's picked. Text
         follows the same variables too — black in light mode, white
         in dark mode. */
      --cn-panel-bg: color-mix(in srgb, var(--surface, #1b1f2e) 22%, transparent);
      --cn-panel-bg-solid: var(--surface-hover, #212639);
      --cn-panel-border: color-mix(in srgb, var(--text, #ffffff) 12%, transparent);
      --cn-divider: color-mix(in srgb, var(--text, #ffffff) 12%, transparent);
      --cn-text: var(--text, #eef1f7);
      --cn-text-dim: #ffffff;
      --cn-hover-bg: color-mix(in srgb, var(--text, #ffffff) 9%, transparent);
      --cn-active-bg: color-mix(in srgb, var(--text, #ffffff) 15%, transparent);
      --cn-tile-bg: color-mix(in srgb, var(--text, #ffffff) 7%, transparent);
      --cn-tile-bg-active: color-mix(in srgb, var(--text, #ffffff) 14%, transparent);
      --cn-pill-track: color-mix(in srgb, var(--text, #ffffff) 6%, transparent);
      --cn-pill-border: color-mix(in srgb, var(--text, #ffffff) 30%, transparent);
      --cn-lavender:#cfb7df;
      --cn-lavender-text:#3a2249;
      --font-logo: 'Kavoon', cursive;
      --font-ui: 'Poppins', system-ui, sans-serif;

      font-family: var(--font-ui);
      color: var(--cn-text);
      background: var(--cn-panel-bg);
      border: 1px solid var(--cn-panel-border);
      -webkit-backdrop-filter: blur(18px);
      backdrop-filter: blur(18px);
      box-shadow: 0 20px 45px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
    }
    /* Light mode: plain white glass instead of the navy tint (a touch
       brighter/whiter than the dark-mode panel), toggled in JS. */
    .cn-rail.cn-light, .cn-flyout.cn-light{
      --cn-panel-bg: rgba(255,255,255,0.30);
    }
    .cn-rail *, .cn-rail *::before, .cn-rail *::after,
    .cn-flyout *, .cn-flyout *::before, .cn-flyout *::after{
      box-sizing:border-box;
    }

    /* ---------------- Rail ---------------- */
    .cn-rail{
      position: fixed;
      top: 0; left: 0; bottom: 0;
      width: ${RAIL_COLLAPSED}px;
      z-index: 950;
      border-radius: 0 20px 20px 0;
      border-left: none;
      padding: 14px 0;
      display: flex;
      flex-direction: column;
      overflow: visible;
      transition: width .28s cubic-bezier(.4,0,.2,1);
    }
    .cn-rail.expanded{
      width: ${RAIL_EXPANDED}px;
      align-items: stretch;
    }
    .cn-rail:not(.expanded){ align-items: center; }

    .cn-rail-top{
      display:flex; align-items:center; gap:12px;
      padding: 2px 20px 16px 24px; width:100%;
    }
    .cn-rail:not(.expanded) .cn-rail-top{ justify-content:center; padding-left:0; padding-right:0; }
    .cn-rail.expanded .cn-rail-top{ padding: 2px 18px 16px 20px; }

    .cn-icon-btn{
      background:none; border:none; color: var(--cn-text); cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      padding:6px; border-radius:10px; flex-shrink:0;
      transition: background .15s ease, transform .15s ease;
    }
    .cn-icon-btn:hover{ background: var(--cn-hover-bg); }
    .cn-icon-btn:active{ transform: scale(.94); }
    .cn-icon-btn svg{ width:20px; height:20px; display:block; }

    .cn-logo-mark{
      width:38px; height:38px;
      flex-shrink:0; position:relative;
      display:flex; align-items:center; justify-content:center; box-sizing:border-box;
    }
    .cn-logo-mark svg{ width:100%; height:100%; display:block; }

    .cn-brand{
      font-family: var(--font-logo); font-weight:700; font-size:18px;
      white-space:nowrap; letter-spacing:.2px; text-decoration:none; color: var(--cn-text);
    }

    .cn-rail:not(.expanded) .cn-logo-mark,
    .cn-rail:not(.expanded) .cn-brand,
    .cn-rail:not(.expanded) .cn-menu-label,
    .cn-rail:not(.expanded) .cn-nav-label,
    .cn-rail:not(.expanded) .cn-chev,
    .cn-rail:not(.expanded) .cn-badge{
      display:none;
    }

    .cn-divider{ width:100%; height:1px; background: var(--cn-divider); margin: 4px 0 14px 0; flex-shrink:0; }

    .cn-menu-label{
      font-size:11px; letter-spacing:1.5px; color: var(--cn-text-dim);
      font-weight:600; padding: 0 20px 10px 24px; flex-shrink:0;
    }

    .cn-nav{
      display:flex; flex-direction:column; gap:4px; width:100%; padding: 0 10px;
      overflow-y:auto;
    }
    .cn-rail:not(.expanded) .cn-nav{ align-items:center; padding:0; gap:14px; overflow:visible; }

    .cn-nav-item{
      display:flex; align-items:center; gap:14px; width:100%;
      background:none; border:none; color: var(--cn-text);
      font-family: var(--font-ui); font-size:15px;
      padding:10px 12px; border-radius:12px; cursor:pointer;
      text-align:left; text-decoration:none;
      transition: background .15s ease;
      position: relative;
    }
    .cn-rail:not(.expanded) .cn-nav-item{
      width:44px; height:44px; padding:0; justify-content:center; border-radius:12px;
    }
    .cn-nav-item:hover{ background: var(--cn-hover-bg); }
    .cn-nav-item.active{ background: var(--cn-active-bg); }
    .cn-nav-item svg{ width:20px; height:20px; flex-shrink:0; }
    .cn-nav-label{ flex:1; white-space:nowrap; }
    .cn-chev{ width:14px; height:14px; opacity:.8; flex-shrink:0; }

    .cn-tooltip{
      position:absolute; left:calc(100% + 12px); top:50%;
      transform:translateY(-50%) translateX(-6px);
      background: var(--cn-panel-bg-solid); color: var(--cn-text);
      font-family: var(--font-ui); font-size:13px; font-weight:600;
      padding:7px 13px; border-radius:9px; white-space:nowrap;
      opacity:0; visibility:hidden; pointer-events:none; z-index:1000;
      box-shadow: 0 10px 25px rgba(0,0,0,0.35);
      transition: opacity .15s ease, transform .15s ease;
    }
    .cn-rail.expanded .cn-tooltip{ display:none; }
    .cn-nav-item:hover .cn-tooltip{
      opacity:1; visibility:visible; transform:translateY(-50%) translateX(0);
    }

    .cn-badge{
      min-width: 17px; height: 17px; padding: 0 5px;
      border-radius: 9px; background: var(--cn-lavender); color: var(--cn-lavender-text);
      font-size: 10px; font-weight: 700;
      display: none; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .cn-rail.expanded .cn-badge.has-items{ display:flex; }

    .cn-chevron-btn{
      display:none; align-items:center; justify-content:center;
      width:22px; height:22px; border-radius:6px; flex-shrink:0;
      background:none; border:none; color: var(--cn-text-dim); cursor:pointer;
    }
    .cn-chevron-btn:hover{ background: var(--cn-hover-bg); color: var(--cn-text); }
    .cn-rail.expanded .cn-chevron-btn{ display:flex; }
    .cn-chevron-btn svg{ transition: transform .15s ease; }
    .cn-nav-item.open .cn-chevron-btn svg{ transform: rotate(180deg); }

    .cn-favorites-list{
      overflow:hidden; max-height:0; opacity:0; flex-shrink:0;
      transition: max-height .25s ease, opacity .2s ease;
      padding: 0 10px;
    }
    .cn-favorites-list.open{ max-height:240px; overflow-y:auto; opacity:1; }
    .cn-rail:not(.expanded) .cn-favorites-list{ max-height:0 !important; opacity:0 !important; }

    .cn-favorite-row{
      display:flex; align-items:center; gap:10px; height:38px;
      padding: 0 8px; border-radius:10px; cursor:pointer; text-decoration:none;
      font-size:13px; color: var(--cn-text-dim);
      transition: background-color .15s ease, color .15s ease;
    }
    .cn-favorite-row:hover{ background: var(--cn-hover-bg); color: var(--cn-text); }
    .cn-favorite-row .cn-avatar{
      width:32px; height:18px; border-radius:5px; background:#3f3f3f;
      display:flex; align-items:center; justify-content:center; font-size:10px;
      flex-shrink:0; overflow:hidden; color: var(--cn-text);
    }
    .cn-favorite-row .cn-avatar img{ width:100%; height:100%; object-fit:cover; }
    .cn-favorite-row .cn-name{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .cn-favorites-empty{ padding: 8px 4px 12px; font-size:11.5px; line-height:1.5; color: var(--cn-text-dim); }

    /* ---------------- Follow us ---------------- */
    .cn-social-section{ margin-top:auto; width:100%; padding-top:10px; flex-shrink:0; }
    .cn-rail:not(.expanded) .cn-social-section{ display:flex; justify-content:center; padding-top:10px; }

    .cn-social-row{ display:flex; gap:8px; padding: 0 20px 4px 24px; }
    .cn-rail:not(.expanded) .cn-social-row{ display:none; }

    .cn-social-tile{
      width:44px; height:44px; flex:1; max-width:44px;
      border-radius:12px; background: var(--cn-tile-bg);
      border:1px solid var(--cn-panel-border);
    }

    .cn-social-collapsed{
      display:none; width:44px; height:44px; border-radius:12px;
      background: var(--cn-tile-bg); border:1px solid var(--cn-panel-border);
      align-items:center; justify-content:center; color: var(--cn-text);
      cursor:pointer; position:relative;
    }
    .cn-rail:not(.expanded) .cn-social-collapsed{ display:flex; }
    .cn-social-collapsed:hover{ background: var(--cn-hover-bg); }
    .cn-social-collapsed svg{ width:20px; height:20px; }

    .cn-social-popover{
      position:absolute; left:calc(100% + 12px); top:50%;
      transform:translateY(-50%) translateX(-6px);
      display:flex; gap:7px;
      background: var(--cn-panel-bg-solid); border:1px solid var(--cn-panel-border);
      padding:8px; border-radius:14px;
      opacity:0; visibility:hidden; pointer-events:none; z-index:1000;
      box-shadow: 0 10px 25px rgba(0,0,0,0.35);
      transition: opacity .15s ease, transform .15s ease;
    }
    .cn-social-popover .cn-social-tile{ width:36px; height:36px; max-width:36px; }
    .cn-social-collapsed:hover .cn-social-popover{
      opacity:1; visibility:visible; transform:translateY(-50%) translateX(0);
    }

    /* ---------------- Flyouts ---------------- */
    .cn-flyout{
      position: fixed;
      top: 16px;
      left: ${RAIL_COLLAPSED + 14}px;
      width: ${FLYOUT_WIDTH}px;
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      z-index: 960;
      border-radius: 22px;
      padding: 16px 14px 18px;
      display: none;
      flex-direction: column;
      opacity: 0;
      transform: translateX(-8px);
      transition: opacity .18s ease, transform .18s ease;
    }
    .cn-flyout.open{ display:flex; opacity:1; transform:translateX(0); }

    .cn-flyout-header{
      background: var(--cn-lavender); color: var(--cn-lavender-text); text-align:center;
      font-size:13px; font-weight:600; padding:10px 14px; border-radius:12px; margin-bottom:14px;
    }
    .cn-flyout-header.with-back{
      display:flex; align-items:center; gap:10px; background:none; color: var(--cn-text);
      justify-content:flex-start; padding:4px 2px 12px; font-size:16px; font-weight:600;
    }
    .cn-flyout-header.with-back button{
      background: var(--cn-hover-bg); border:none; color: var(--cn-text);
      width:28px; height:28px; border-radius:9px; display:flex; align-items:center; justify-content:center; cursor:pointer;
    }
    .cn-flyout-header.with-back svg{ width:16px; height:16px; }

    .cn-tiles{ display:grid; grid-template-columns: repeat(3,1fr); gap:7px; margin-bottom:14px; }
    .cn-tile{
      background: var(--cn-tile-bg); border: 1px solid var(--cn-panel-border); border-radius:16px;
      padding:11px 6px 9px; display:flex; flex-direction:column; align-items:center; gap:8px;
      cursor:pointer; color: var(--cn-text); font-family: var(--font-ui);
      transition: background .15s ease, transform .1s ease;
    }
    .cn-tile:hover{ background: var(--cn-tile-bg-active); }
    .cn-tile:active{ transform: scale(.97); }
    .cn-tile svg{ width:20px; height:20px; }
    .cn-tile span{ font-size:10.5px; text-align:center; line-height:1.2; color: var(--cn-text-dim); }

    /* Color-editing controls (solid colors tile, light/dark toggle,
       card-accent palette grid) get greyed out and inert while a
       whole-site theme like Clay is active — it's a fixed look, not
       something meant to be tweaked on top of. */
    .cn-tile.cn-locked,
    .cn-segmented.cn-locked,
    .cn-theme-grid.cn-locked,
    .cn-solid-grid.cn-locked{
      opacity: .38;
      pointer-events: none;
      filter: grayscale(.4);
    }

    .cn-sep{ border:none; height:1px; background: var(--cn-divider); margin: 4px 0 14px; width:100%; }

    .cn-segmented{
      display:flex; align-items:center; border:1px solid var(--cn-pill-border); border-radius:999px;
      background: var(--cn-pill-track); padding:4px; margin-bottom:16px;
    }
    .cn-segmented button{
      flex:1; border:none; background:none; color: var(--cn-text-dim); font-family: var(--font-ui);
      font-size:12.5px; font-weight:500; padding:8px 6px; border-radius:999px; cursor:pointer;
      transition: background .18s ease, color .18s ease;
    }
    .cn-segmented button.selected{ background: var(--cn-lavender); color: var(--cn-lavender-text); font-weight:600; }

    .cn-theme-grid{ display:grid; grid-template-columns: repeat(4,1fr); gap:7px; margin-bottom:14px; }
    .cn-theme-swatch{
      aspect-ratio:1; border-radius:14px; background: rgba(0,0,0,0.18);
      display:flex; align-items:center; justify-content:center; cursor:pointer;
      border:1px solid transparent; transition: border-color .15s ease, background .15s ease;
    }
    .cn-theme-swatch:hover{ background: rgba(0,0,0,0.28); }
    .cn-theme-swatch.selected{ border-color: color-mix(in srgb, var(--text, #ffffff) 55%, transparent); }
    .cn-donut{ width:24px; height:24px; border-radius:50%; position:relative; }
    .cn-donut::after{ content:""; position:absolute; inset:6px; border-radius:50%; background: transparent; }
    .cn-pencil-btn{
      width:24px; height:24px; border-radius:50%; background: var(--cn-lavender);
      display:flex; align-items:center; justify-content:center; color: var(--cn-lavender-text);
    }
    .cn-pencil-btn svg{ width:12px; height:12px; }

    .cn-reset-row{
      display:flex; align-items:center; justify-content:space-between; padding: 2px 4px;
      font-weight:700; font-size:14px; color: var(--cn-text);
    }
    .cn-reset-row button{
      background:none; border:1px solid var(--cn-pill-border); color: var(--cn-text);
      width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;
    }
    .cn-reset-row svg{ width:14px; height:14px; }

    /* Custom palette: 1 shared SV square with 3 markers (Card/Label/Chips),
       3 hue sliders underneath, 1 shared hex field for whichever marker
       is currently active. */
    .cn-sv-square{
      position:relative; width:100%; height:110px; border-radius:8px; margin-bottom:14px;
      cursor:crosshair; overflow:hidden; touch-action:none;
    }
    .cn-sv-square-white{ position:absolute; inset:0; background:linear-gradient(to right, #fff, rgba(255,255,255,0)); }
    .cn-sv-square-black{ position:absolute; inset:0; background:linear-gradient(to top, #000, rgba(0,0,0,0)); }
    .cn-sv-pointer{
      position:absolute; width:16px; height:16px; border-radius:50%; border:2px solid #fff;
      box-shadow:0 0 0 1px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.4);
      transform:translate(-50%,-50%); cursor:grab;
    }
    .cn-sv-pointer.active{ box-shadow:0 0 0 2px #fff, 0 0 0 4px rgba(0,0,0,0.5); z-index:2; }
    .cn-hue-row{ display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .cn-hue-row:last-of-type{ margin-bottom:0; }
    .cn-picker-dot{
      width:16px; height:16px; border-radius:50%; border:2px solid var(--cn-pill-border);
      flex-shrink:0; cursor:pointer;
    }
    .cn-hue-row.active .cn-picker-dot{ border-color: var(--cn-text); }
    .cn-picker-role-name{
      font-size:12px; font-weight:600; color: var(--cn-text-dim);
      width:44px; flex-shrink:0; cursor:pointer;
    }
    .cn-hue-row.active .cn-picker-role-name{ color: var(--cn-text); }
    .cn-hue-slider{
      position:relative; flex:1; height:12px; border-radius:6px;
      cursor:pointer; touch-action:none; border:1px solid var(--cn-pill-border);
      background:linear-gradient(to right, #f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);
    }
    .cn-hue-pointer{
      position:absolute; top:50%; width:14px; height:14px; border-radius:50%; border:2px solid #fff;
      box-shadow:0 0 0 1px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.4);
      transform:translate(-50%,-50%); pointer-events:none; background:transparent;
    }
    .cn-picker-preview-row{ display:flex; align-items:center; gap:8px; margin-top:10px; }
    .cn-picker-swatch{ width:24px; height:24px; border-radius:6px; border:1px solid var(--cn-pill-border); flex-shrink:0; }
    .cn-picker-hex-input{
      flex:1; min-width:0; font-family:'IBM Plex Mono', monospace; font-size:12px; letter-spacing:0.02em;
      background: var(--cn-tile-bg); border:1px solid var(--cn-pill-border); color: var(--cn-text);
      border-radius:6px; padding:5px 8px;
    }
    .cn-picker-hex-input:focus{ outline:none; border-color: var(--cn-text-dim); }

    .cn-solid-grid{ display:grid; grid-template-columns: repeat(4,1fr); gap:7px; }
    .cn-solid-swatch{
      aspect-ratio:1; border-radius:12px; cursor:pointer; position:relative;
      border:2px solid transparent; transition: transform .1s ease, border-color .15s ease;
    }
    .cn-solid-swatch:hover{ transform: translateY(-1px); }
    .cn-solid-swatch.selected{ border-color:#fff; }
    .cn-solid-swatch .cn-check{
      position:absolute; top:-6px; right:-6px; width:18px; height:18px; background:#fff;
      border-radius:50%; display:none; align-items:center; justify-content:center;
    }
    .cn-solid-swatch.selected .cn-check{ display:flex; }
    .cn-solid-swatch .cn-check svg{ width:10px; height:10px; color:#111; }

    /* Whole-site "Themes" grid (Clay, and any future themes) */
    .cn-themepick-grid{ display:grid; grid-template-columns: repeat(3,1fr); gap:10px; }
    .cn-themepick-cell{ display:flex; flex-direction:column; }
    .cn-themepick{
      aspect-ratio:1; border-radius: var(--radius-swatch, 12px); cursor:pointer; position:relative;
      overflow:hidden; border:2px solid transparent; box-shadow: 0 6px 16px rgba(0,0,0,0.35);
      transition: transform .1s ease, border-color .15s ease, box-shadow .15s ease;
    }
    .cn-themepick:hover{ transform: translateY(-1px); }
    .cn-themepick.selected{ border-color: #fff; }
    .cn-tp-bg{ position:absolute; inset:0; }
    .cn-tp-panel{ position:absolute; left:14%; right:14%; bottom:12%; top:38%; border-radius:6px; }
    .cn-tp-dot{ position:absolute; width:12px; height:12px; border-radius:50%; top:16%; left:14%; }
    .cn-themepick .cn-check{
      position:absolute; top:-6px; right:-6px; width:18px; height:18px; background:#fff;
      border-radius:50%; display:none; align-items:center; justify-content:center;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
    }
    .cn-themepick.selected .cn-check{ display:flex; }
    .cn-themepick .cn-check svg{ width:10px; height:10px; color:#111; }
    .cn-themepick-label{ text-align:center; font-size:11px; font-weight:600; color: var(--cn-text-dim); margin-top:6px; }

    /* ---------------- Clay theme (whole-site) ----------------
       The --bg/--surface/--text/etc color swap alone (applied via
       inline styles the same way theme.js's dark/light modes work)
       already recolors every page that themes off those vars —
       cards, chips, pills, buttons, the sidebar's own translucent
       panels. This block layers the puffy/embossed "clay" look on
       top of that for both the sidebar and the shared surfaces on
       coop-library / favorites / info, gated behind .cn-clay-active
       so it's a total no-op until the theme is actually picked. */
    html.cn-clay-active .cn-rail,
    html.cn-clay-active .cn-flyout{
      --cn-panel-bg: var(--clay);
      --cn-panel-bg-solid: var(--clay);
      --cn-panel-border: transparent;
      --cn-divider: var(--clay-divider);
      --cn-text-dim: var(--text-dim);
      --cn-hover-bg: var(--clay-hover-bg);
      --cn-active-bg: var(--clay);
      --cn-tile-bg: var(--clay);
      --cn-tile-bg-active: var(--clay-hi);
      --cn-pill-track: var(--clay-lo);
      --cn-pill-border: rgba(0,0,0,0.18);
      --cn-lavender: var(--clay-accent-dark);
      --cn-lavender-text: var(--clay-accent-text);
      --font-logo: var(--clay-font-logo);
      --font-ui: var(--clay-font-ui);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      box-shadow: var(--clay-shadow-puffy);
      border: none;
    }
    html.cn-clay-active .cn-logo-mark{ box-shadow: var(--clay-shadow-chip); }
    html.cn-clay-active .cn-tile{ box-shadow: var(--clay-shadow-chip); border: none; }
    html.cn-clay-active .cn-tile:active{ box-shadow: var(--clay-shadow-sunken); }
    html.cn-clay-active .cn-nav-item.active{ box-shadow: var(--clay-shadow-chip); }
    html.cn-clay-active .cn-flyout-header{
      background: var(--clay-dark-pill); color:#fff;
      box-shadow: inset 2px 2px 5px rgba(0,0,0,0.45), inset -2px -2px 5px rgba(255,255,255,0.05);
    }
    html.cn-clay-active .cn-flyout-header.with-back button{ background: var(--clay); box-shadow: var(--clay-shadow-chip); border: none; }
    html.cn-clay-active .cn-segmented{ box-shadow: var(--clay-shadow-chip); border: none; }
    html.cn-clay-active .cn-segmented button.selected{ box-shadow: 3px 2px 4px rgba(0,0,0,0.3); }
    html.cn-clay-active .cn-theme-swatch,
    html.cn-clay-active .cn-solid-swatch,
    html.cn-clay-active .cn-themepick{ box-shadow: var(--clay-shadow-chip-color); border: none; }
    html.cn-clay-active .cn-reset-row button{ background: var(--clay); box-shadow: var(--clay-shadow-chip); border: none; }
    html.cn-clay-active .cn-badge{ background: var(--clay-accent-dark); color: var(--clay-accent-text); }

    /* Shared surfaces on coop-library / favorites / info — same puffy
       treatment applied to whatever plays the "card" / "pill" /
       "button" role on each page. Uses border: none (not just a
       transparent border-color) so there's no leftover 1px ring
       between the puffy shadow and the shape's edge. */
    html.cn-clay-active body{ background: var(--clay-lo) !important; }
    html.cn-clay-active .card,
    html.cn-clay-active .chip,
    html.cn-clay-active .lang-btn,
    html.cn-clay-active .disclaimer-box,
    html.cn-clay-active .filters,
    html.cn-clay-active .thumb,
    html.cn-clay-active .thumb-placeholder,
    html.cn-clay-active .btn,
    html.cn-clay-active .data-card,
    html.cn-clay-active .tag-pill,
    html.cn-clay-active .card-link-btn{
      border: none !important;
      box-shadow: var(--clay-shadow-chip) !important;
    }
    /* .calc-panel (the "Can You Run It?" check-your-specs container on
       info.html) doesn't define its own border-radius anywhere else on
       the page, unlike .card/.btn/.data-card which all do — so it gets
       its own rule here instead of joining the shared list above, to
       make sure the puffy shadow follows a rounded shape rather than
       bleeding off the corners of a square box. */
    html.cn-clay-active .calc-panel{
      border: none !important;
      border-radius: var(--radius, 14px);
      padding: 24px;
      box-shadow: var(--clay-shadow-chip) !important;
    }
    html.cn-clay-active .card:hover{ box-shadow: var(--clay-shadow-chip), 0 0 0 1px rgba(0,0,0,0.08) !important; }
    /* Active/selected pills (filter chips, the EN/FR toggle, the
       primary favorite/back button) previously inverted using
       var(--bg)/var(--text), which under Clay's muted palette came
       out as low-contrast dark-brown-on-taupe — hard to read. Use
       the same crisp near-black/near-white accent pair the puffy
       shadow recipe already defines instead. */
    html.cn-clay-active .chip.active,
    html.cn-clay-active .lang-btn.active,
    html.cn-clay-active .card-link-btn.primary{
      background: var(--clay-accent-dark) !important;
      color: var(--clay-accent-text) !important;
      border: none !important;
      box-shadow: var(--clay-shadow-chip-color) !important;
    }
    html.cn-clay-active .mode-tag,
    html.cn-clay-active .price-tag,
    html.cn-clay-active .priority-badge{
      border: none !important;
      box-shadow: var(--clay-shadow-chip-color) !important;
    }
    html.cn-clay-active .btn-primary{
      background: var(--clay-accent-dark) !important;
      color: var(--clay-accent-text) !important;
      border: none !important;
    }
    html.cn-clay-active body,
    html.cn-clay-active .card,
    html.cn-clay-active .btn{ font-family: var(--clay-font-ui); }
    html.cn-clay-active .brand,
    html.cn-clay-active h1{ font-family: var(--clay-font-logo); }

    /* ---------- NEON ----------
       Same idea as Clay above (base --bg/--surface/--text swap already
       recolors every page, this block layers the theme's specific look
       on top) but swaps the puffy/embossed treatment for a dark panel
       with thin cyan borders and cyan/pink glow — gated behind
       .cn-neon-active so it's a no-op until the theme is picked. */
    html.cn-neon-active .cn-rail,
    html.cn-neon-active .cn-flyout{
      --cn-panel-bg: var(--neon-panel-bg);
      --cn-panel-bg-solid: var(--neon-panel-bg-solid);
      --cn-panel-border: var(--neon-panel-border);
      --cn-divider: var(--neon-divider);
      --cn-text-dim: var(--text-dim);
      --cn-hover-bg: var(--neon-hover-bg);
      --cn-active-bg: var(--neon-tile-bg-active);
      --cn-tile-bg: var(--neon-tile-bg);
      --cn-tile-bg-active: var(--neon-tile-bg-active);
      --cn-pill-track: var(--neon-divider);
      --cn-pill-border: var(--neon-panel-border);
      --cn-lavender: var(--neon-accent);
      --cn-lavender-text: var(--neon-accent-text);
      --font-logo: var(--neon-font-logo);
      --font-ui: var(--neon-font-ui);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1.5px solid var(--neon-panel-border);
      box-shadow: 0 20px 45px rgba(0,0,0,0.55), 0 0 10px rgba(0,255,242,0.5), 0 0 26px rgba(0,255,242,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
    }
    html.cn-neon-active .cn-logo-mark{ box-shadow: var(--neon-glow-cyan); }
    html.cn-neon-active .cn-tile{ border: 1.5px solid var(--neon-tile-border); box-shadow: 0 0 8px rgba(0,255,242,0.25); }
    html.cn-neon-active .cn-tile:hover{ box-shadow: inset 0 0 0 1px rgba(0,255,242,0.4), 0 0 14px rgba(0,255,242,0.2); }
    html.cn-neon-active .cn-nav-item.active{ box-shadow: inset 0 0 0 1px rgba(0,255,242,0.45), 0 0 16px rgba(0,255,242,0.18); color: var(--neon-cyan); }
    html.cn-neon-active .cn-flyout-header{
      background: var(--neon-dark-pill); color: var(--neon-cyan);
      border-bottom: 1px solid rgba(0,255,242,0.25);
      text-shadow: 0 0 8px rgba(0,255,242,0.5);
      box-shadow: none;
    }
    html.cn-neon-active .cn-flyout-header.with-back button{ background: rgba(255,255,255,0.08); color: var(--neon-cyan); box-shadow: none; border: none; }
    html.cn-neon-active .cn-segmented{ box-shadow: none; border: 1px solid var(--neon-panel-border); }
    html.cn-neon-active .cn-segmented button.selected{ background: var(--neon-accent); color: var(--neon-accent-text); box-shadow: var(--neon-glow-pink); }
    html.cn-neon-active .cn-theme-swatch,
    html.cn-neon-active .cn-solid-swatch,
    html.cn-neon-active .cn-themepick{ box-shadow: none; border: 1px solid var(--neon-panel-border); }
    html.cn-neon-active .cn-theme-swatch:hover,
    html.cn-neon-active .cn-solid-swatch:hover,
    html.cn-neon-active .cn-themepick:hover{ border-color: var(--neon-cyan); box-shadow: var(--neon-glow-cyan); }
    html.cn-neon-active .cn-theme-swatch.selected,
    html.cn-neon-active .cn-solid-swatch.selected,
    html.cn-neon-active .cn-themepick.selected{ border-color: var(--neon-cyan); box-shadow: var(--neon-glow-cyan); }
    html.cn-neon-active .cn-reset-row button{ background: transparent; color: var(--neon-cyan); border: 1px solid var(--neon-panel-border); box-shadow: none; }
    html.cn-neon-active .cn-badge{ background: var(--neon-accent); color: var(--neon-accent-text); box-shadow: var(--neon-glow-pink); }

    /* Shared surfaces on coop-library / favorites / info — same thin
       border + glow treatment applied to whatever plays the "card" /
       "pill" / "button" role on each page. */
    html.cn-neon-active body{ background: var(--bg) !important; }
    html.cn-neon-active .card,
    html.cn-neon-active .chip,
    html.cn-neon-active .lang-btn,
    html.cn-neon-active .disclaimer-box,
    html.cn-neon-active .filters,
    html.cn-neon-active .thumb,
    html.cn-neon-active .thumb-placeholder,
    html.cn-neon-active .btn,
    html.cn-neon-active .data-card,
    html.cn-neon-active .tag-pill,
    html.cn-neon-active .card-link-btn{
      border: 1.5px solid var(--neon-panel-border) !important;
      box-shadow: 0 0 8px rgba(0,255,242,0.35), 0 0 20px rgba(0,255,242,0.18) !important;
    }
    /* .calc-panel doesn't define its own border-radius anywhere else on
       the page (see the matching Clay comment above), so it gets its
       own rule here too instead of joining the shared list above. */
    html.cn-neon-active .calc-panel{
      border: 1.5px solid var(--neon-panel-border) !important;
      border-radius: var(--radius, 14px);
      padding: 24px;
      box-shadow: 0 0 8px rgba(0,255,242,0.35), 0 0 20px rgba(0,255,242,0.18) !important;
    }
    html.cn-neon-active .card:hover{ border-color: var(--neon-cyan) !important; box-shadow: var(--neon-glow-cyan) !important; }
    /* Active/selected pills (filter chips, the EN/FR toggle, the
       primary favorite/back button) get the pink accent + glow. */
    html.cn-neon-active .chip.active,
    html.cn-neon-active .lang-btn.active,
    html.cn-neon-active .card-link-btn.primary{
      background: var(--neon-accent) !important;
      color: var(--neon-accent-text) !important;
      border: 1px solid var(--neon-accent) !important;
      box-shadow: var(--neon-glow-pink) !important;
    }
    html.cn-neon-active .mode-tag,
    html.cn-neon-active .price-tag,
    html.cn-neon-active .priority-badge{
      border: 1.5px solid var(--neon-panel-border) !important;
      box-shadow: 0 0 10px rgba(0,255,242,0.3) !important;
    }
    html.cn-neon-active .btn-primary{
      background: var(--neon-accent) !important;
      color: var(--neon-accent-text) !important;
      border: 1px solid var(--neon-accent) !important;
      box-shadow: var(--neon-glow-pink) !important;
    }
    html.cn-neon-active body,
    html.cn-neon-active .card,
    html.cn-neon-active .btn{ font-family: var(--neon-font-ui); }
    html.cn-neon-active .brand,
    html.cn-neon-active h1{
      font-family: var(--neon-font-logo);
      text-shadow: 0 0 8px rgba(0,255,242,0.5);
    }

    /* Applied theme palette (from the theme-swatch grid) recolors the
       game-card grid on coop-library.html / favorites.html. Guarded by
       the .cn-theme-applied class on <html> so it's a no-op until a
       palette is actually picked. !important beats the page's own
       per-mode rules (e.g. .m-only2 .mode-tag) regardless of source
       order. */
    html.cn-theme-applied .card{ background: var(--cn-t-card) !important; }
    html.cn-theme-applied .card:hover{ background: color-mix(in srgb, var(--cn-t-card) 82%, white) !important; }
    html.cn-theme-applied .name{ color: var(--cn-t-label) !important; }
    /* Price tag + player-count tag (bottom-right of each card). Text
       color is derived from the pill background so it's always legible
       — this was previously left at the page's plain white, which went
       invisible on pale palettes like Lemon Zest Delight's cream pill. */
    html.cn-theme-applied .mode-tag,
    html.cn-theme-applied .price-tag{
      background: var(--cn-t-pill) !important;
      color: var(--cn-t-active-text) !important;
    }
    /* Card description text — derived contrast color, not a fixed
       palette hue, so it stays readable no matter which color ends up
       behind it as the card background. */
    html.cn-theme-applied .note{ color: var(--cn-t-note) !important; }
    /* "Squad size" / "Budget" / "Extra" row labels, and the legend
       above the filters ("Only 2 players", "1-3 players", etc). These
       sit on the site's own dark background rather than a card, so
       they use the palette's brightest color (var(--cn-t-pill)) —
       the darker label color is tuned for sitting on the card
       background instead and would be hard to read here. */
    html.cn-theme-applied .filter-label,
    html.cn-theme-applied .legend-item{ color: var(--cn-t-pill) !important; }
    /* Filter chip group container — same background as the cards. */
    html.cn-theme-applied .filters{ background: var(--cn-t-card) !important; }
    /* Individual filter chips (2P, 1-4P, under €5, etc) — same pale
       color as the price tag / player tag on the cards, with the same
       derived contrast text so they stay legible. .active is left
       alone: it already has its own strong inverted look and shouldn't
       be flattened into the palette. */
    html.cn-theme-applied .chip:not(.active){
      background: var(--cn-t-pill) !important;
      color: var(--cn-t-active-text) !important;
      border-color: transparent !important;
    }
    /* EN / FR language toggle. */
    html.cn-theme-applied .lang-btn{
      background: var(--cn-t-card) !important;
      color: var(--cn-t-pill) !important;
      border-color: transparent !important;
    }
    html.cn-theme-applied .lang-btn.active{
      background: var(--cn-t-pill) !important;
      color: var(--cn-t-active-text) !important;
      border-color: transparent !important;
    }

    @media (max-width: 640px) {
      body{ padding-left: 16px !important; padding-bottom: 78px !important; }
      .cn-rail{
        top: auto; bottom: 0; left: 0; right: 0; height: 64px; width: 100% !important;
        border-radius: 20px 20px 0 0;
        flex-direction: row; align-items: center; justify-content: space-around; padding: 0 4px;
      }
      .cn-rail-top, .cn-divider, .cn-menu-label{ display:none; }
      .cn-nav{ flex-direction: row; width:100%; justify-content:space-around; padding:0; gap:0; overflow:visible; }
      .cn-favorites-list{ display:none; }
      .cn-social-section{ display:none !important; }
      .cn-flyout{ left: 12px; right: 12px; width:auto; bottom: 78px; top:auto; max-height: 60vh; }
    }
  `;

  function injectStyle() {
    const s = document.createElement("style");
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function getFavorites() {
    if (window.CoopFavorites) return window.CoopFavorites.getAll();
    try {
      const raw = localStorage.getItem("coopLibraryFavorites");
      return raw ? (JSON.parse(raw) || []) : [];
    } catch (e) { return []; }
  }

  function renderFavorites() {
    const list = document.getElementById("cnFavoritesList");
    const badge = document.getElementById("cnFavoritesBadge");
    if (!list) return;
    const favorites = getFavorites();

    if (badge) {
      badge.textContent = favorites.length > 99 ? "99+" : String(favorites.length);
      badge.classList.toggle("has-items", favorites.length > 0);
    }

    if (favorites.length === 0) {
      list.innerHTML = `<div class="cn-favorites-empty">${I18N[lang()].favoritesEmpty}</div>`;
      return;
    }

    list.innerHTML = favorites.map(g => {
      const name = (g.name || "Untitled").replace(/</g, "&lt;");
      const url = g.infoUrl || g.steamUrl || "favorites.html";
      const avatar = g.img
        ? `<img src="${g.img}" alt="" loading="lazy" onerror="this.parentElement.textContent='${name.charAt(0)}'">`
        : name.charAt(0);
      return `
        <a class="cn-favorite-row" href="${url}">
          <span class="cn-avatar">${avatar}</span>
          <span class="cn-name">${name}</span>
        </a>`;
    }).join("");
  }

  function build() {
    const t = I18N[lang()];

    const rail = document.createElement("nav");
    rail.className = "cn-rail" + (getSaved(EXPANDED_KEY) ? " expanded" : "");
    rail.id = "cnRail";
    rail.innerHTML = `
      <div class="cn-rail-top">
        <button class="cn-icon-btn" id="cnMenuBtn" aria-label="${t.toggleMenu}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <a class="cn-logo-mark" href="coop-library.html" aria-label="${t.brandHome}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2105 3162"><g transform="translate(2105,0) rotate(90)"><path d="M 1691,1122 L 1679,1125 L 1670,1138 L 1650,1147 L 1624,1172 L 1588,1194 L 1415,1332 L 1298,1417 L 1288,1430 L 1263,1444 L 1254,1457 L 1200,1493 L 1185,1511 L 1148,1534 L 1103,1575 L 943,1696 L 928,1714 L 836,1781 L 821,1799 L 746,1853 L 736,1869 L 1709,1841 Z M 1647,1214 L 1659,1777 L 1655,1796 L 1549,1795 L 1540,1799 L 1471,1797 L 1354,1803 L 1325,1800 L 1324,1804 L 1285,1801 L 1245,1806 L 1128,1805 L 1092,1810 L 1071,1807 L 906,1815 L 882,1811 L 953,1754 L 955,1748 L 971,1741 L 973,1735 L 1055,1673 L 1061,1664 L 1359,1434 L 1378,1414 L 1413,1392 L 1634,1218 Z M 739,231 L 740,237 L 760,247 L 912,369 L 919,369 L 999,436 L 1031,454 L 1127,533 L 1135,533 L 1149,550 L 1169,560 L 1260,633 L 1267,633 L 1277,646 L 1301,659 L 1306,668 L 1618,902 L 1625,902 L 1635,915 L 1677,945 L 1690,948 L 1691,249 Z M 887,286 L 1644,298 L 1643,857 L 1634,857 L 1624,845 L 1613,841 L 1341,632 L 1306,610 L 1087,440 L 1058,422 L 1031,397 L 993,372 L 965,346 L 941,332 L 926,316 L 893,296 Z M 57,96 L 42,2001 L 283,1780 L 294,1156 L 1371,1147 L 464,1848 L 462,2065 L 2649,1988 L 2880,1768 L 1869,1787 L 1858,1144 L 2978,1137 L 3133,934 L 1851,924 L 1853,302 L 2854,319 L 2644,105 L 472,39 L 474,252 L 1370,924 L 296,926 L 293,318 Z M 109,213 L 239,330 L 239,973 L 1503,974 L 525,233 L 522,94 L 2624,147 L 2741,268 L 1805,251 L 1804,974 L 3048,977 L 2959,1094 L 1805,1099 L 1822,1835 L 2771,1817 L 2637,1943 L 519,2012 L 522,1865 L 1504,1100 L 250,1108 L 229,1764 L 96,1883 Z" fill="#1E6EFF" fill-rule="evenodd"/></g></svg></a>
        <a class="cn-brand" href="coop-library.html" aria-label="${t.brandHome}">${t.brand}</a>
      </div>

      <div class="cn-divider"></div>
      <div class="cn-menu-label">${t.menu}</div>

      <div class="cn-nav">
        <a class="cn-nav-item${isHome ? " active" : ""}" href="coop-library.html" data-page="home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/></svg>
          <span class="cn-nav-label">${t.home}</span>
          <span class="cn-tooltip">${t.home}</span>
        </a>

        <a class="cn-nav-item${isComingSoon ? " active" : ""}" href="coming-soon.html" data-page="coming-soon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/></svg>
          <span class="cn-nav-label">${t.comingSoon}</span>
          <span class="cn-tooltip">${t.comingSoon}</span>
        </a>

        <button type="button" class="cn-nav-item" id="cnSettingsBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.37 9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.96z"/></svg>
          <span class="cn-nav-label" data-cn-t="settings">${t.settings}</span>
          <span class="cn-tooltip">${t.settings}</span>
        </button>

        <a class="cn-nav-item${isFav ? " active" : ""}" href="favorites.html" id="cnFavoritesToggle" data-page="favorites">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          <span class="cn-nav-label" data-cn-t="favorites">${t.favorites}</span>
          <span class="cn-badge" id="cnFavoritesBadge">0</span>
          <button type="button" class="cn-chevron-btn" id="cnFavoritesChevronBtn" aria-label="${t.showFavorites}" title="${t.showFavorites}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <span class="cn-tooltip">${t.favorites}</span>
        </a>

        <div class="cn-favorites-list" id="cnFavoritesList"></div>
      </div>

      <div class="cn-social-section">
        <div class="cn-menu-label">${t.followUs}</div>
        <div class="cn-social-row">
          <div class="cn-social-tile" aria-hidden="true"></div>
          <div class="cn-social-tile" aria-hidden="true"></div>
          <div class="cn-social-tile" aria-hidden="true"></div>
          <div class="cn-social-tile" aria-hidden="true"></div>
        </div>
        <button type="button" class="cn-social-collapsed" aria-label="${t.followUs}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.6" x2="15.4" y2="6.4"/><line x1="8.6" y1="13.4" x2="15.4" y2="17.6"/></svg>
          <div class="cn-social-popover">
            <div class="cn-social-tile" aria-hidden="true"></div>
            <div class="cn-social-tile" aria-hidden="true"></div>
            <div class="cn-social-tile" aria-hidden="true"></div>
            <div class="cn-social-tile" aria-hidden="true"></div>
          </div>
        </button>
      </div>
    `;
    document.body.appendChild(rail);

    // ---- Settings flyout ----
    const settingsFlyout = document.createElement("aside");
    settingsFlyout.className = "cn-flyout";
    settingsFlyout.id = "cnSettingsFlyout";
    settingsFlyout.innerHTML = `
      <div class="cn-flyout-header" data-cn-t="changeBackground">${t.changeBackground}</div>
      <div class="cn-tiles">
        <div class="cn-tile" id="cnOpenSolidColors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#f5b400"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 2-4 2-4s2 2.4 2 4Z"/></svg>
          <span data-cn-t="solidColors">${t.solidColors}</span>
        </div>
        <div class="cn-tile" id="cnOpenThemes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#4286f5"><circle cx="13.5" cy="6.5" r="1.4"/><circle cx="17.5" cy="10.5" r="1.4"/><circle cx="8.5" cy="7.5" r="1.4"/><circle cx="6.5" cy="12.5" r="1.4"/><path d="M12 21a9 9 0 1 1 0-18 6 6 0 0 1 0 12h-1.2a1.8 1.8 0 0 0-1 3.3c.4.3.2.7-.3.7Z"/></svg>
          <span data-cn-t="themes">${t.themes}</span>
        </div>
        <div class="cn-tile" id="cnUploadImage">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#109d58"><path d="M12 4v11"/><path d="M7 9l5-5 5 5"/><path d="M4 19h16"/></svg>
          <span data-cn-t="uploadImage">${t.uploadImage}</span>
        </div>
      </div>

      <hr class="cn-sep"/>

      <div class="cn-segmented" id="cnSegmented">
        <button type="button" data-mode="light" data-cn-t="light">${t.light}</button>
        <button type="button" data-mode="dark" data-cn-t="dark">${t.dark}</button>
        <button type="button" data-mode="device" data-cn-t="device">${t.device}</button>
      </div>

      <div class="cn-theme-grid" id="cnThemeGrid"></div>

      <hr class="cn-sep"/>

      <div class="cn-reset-row">
        <span data-cn-t="resetDefault">${t.resetDefault}</span>
        <button type="button" id="cnResetBtn" aria-label="${t.resetDefault}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>
        </button>
      </div>
    `;
    document.body.appendChild(settingsFlyout);

    // ---- Solid colors flyout ----
    const solidFlyout = document.createElement("aside");
    solidFlyout.className = "cn-flyout";
    solidFlyout.id = "cnSolidFlyout";
    solidFlyout.innerHTML = `
      <div class="cn-flyout-header with-back">
        <button type="button" id="cnBackToSettings" aria-label="${t.back}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span data-cn-t="solidColorsTitle">${t.solidColorsTitle}</span>
      </div>
      <div class="cn-solid-grid" id="cnSolidGrid"></div>
    `;
    document.body.appendChild(solidFlyout);

    // ---- Themes flyout: switches the whole site's look. Every entry
    // in UI_THEMES (Clay, Neon, ...) shows up here automatically. ----
    const themesFlyout = document.createElement("aside");
    themesFlyout.className = "cn-flyout";
    themesFlyout.id = "cnThemesFlyout";
    themesFlyout.innerHTML = `
      <div class="cn-flyout-header with-back">
        <button type="button" id="cnBackFromThemes" aria-label="${t.back}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span data-cn-t="themesTitle">${t.themesTitle}</span>
      </div>
      <div class="cn-themepick-grid" id="cnThemepickGrid"></div>
    `;
    document.body.appendChild(themesFlyout);

    // ---- Custom palette flyout: ONE shared saturation/value square with
    // 3 markers on it (Card / Label / Chips), 3 hue sliders underneath —
    // one per marker — and a single shared hex field that always reflects
    // whichever marker/slider you touched most recently. ----
    const pickerRoles = [
      { key: "card", labelKey: "customCard", letter: "C" },
      { key: "label", labelKey: "customLabel", letter: "L" },
      { key: "pill", labelKey: "customPill", letter: "P" }
    ];
    const customFlyout = document.createElement("aside");
    customFlyout.className = "cn-flyout";
    customFlyout.id = "cnCustomFlyout";
    customFlyout.innerHTML = `
      <div class="cn-flyout-header with-back">
        <button type="button" id="cnBackToSettingsFromCustom" aria-label="${t.back}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span data-cn-t="customPaletteTitle">${t.customPaletteTitle}</span>
      </div>
      <div class="cn-sv-square" id="cnSvSquare">
        <div class="cn-sv-square-white"></div>
        <div class="cn-sv-square-black"></div>
        ${pickerRoles.map(r => `<div class="cn-sv-pointer" id="cnSvPointer-${r.key}" data-role="${r.key}"></div>`).join("")}
      </div>
      ${pickerRoles.map(r => `
        <div class="cn-hue-row" data-role="${r.key}">
          <span class="cn-picker-dot" id="cnDot-${r.key}"></span>
          <span class="cn-picker-role-name" data-cn-t="${r.labelKey}">${t[r.labelKey]}</span>
          <div class="cn-hue-slider" id="cnHue-${r.key}">
            <div class="cn-hue-pointer" id="cnHuePointer-${r.key}"></div>
          </div>
        </div>
      `).join("")}
      <div class="cn-picker-preview-row">
        <div class="cn-picker-swatch" id="cnSwatchActive"></div>
        <input type="text" class="cn-picker-hex-input" id="cnHexInputActive" maxlength="7" spellcheck="false" aria-label="${t.customPaletteTitle}">
      </div>
    `;
    document.body.appendChild(customFlyout);

    // ---- Build the theme (palette) + solid grids ----
    const themeGrid = document.getElementById("cnThemeGrid");
    const savedPaletteIdx = getSavedThemePaletteIndex();
    THEME_PALETTES.forEach((palette, i) => {
      const stops = [palette.card, palette.label, palette.pill];
      const cell = document.createElement("div");
      cell.className = "cn-theme-swatch" + (i === savedPaletteIdx ? " selected" : "");
      cell.title = palette.name;
      const donut = document.createElement("div");
      donut.className = "cn-donut";
      donut.style.background = `conic-gradient(${stops[0]} 0% 33.33%, ${stops[1]} 33.33% 66.66%, ${stops[2]} 66.66% 100%)`;
      cell.appendChild(donut);
      cell.addEventListener("click", () => {
        themeGrid.querySelectorAll(".cn-theme-swatch").forEach(s => s.classList.remove("selected"));
        cell.classList.add("selected");
        chooseThemePalette(i);
      });
      themeGrid.appendChild(cell);
    });
    const pencilCell = document.createElement("div");
    pencilCell.className = "cn-theme-swatch" + (isCustomPaletteActive() ? " selected" : "");
    pencilCell.title = t.customPaletteTitle;
    pencilCell.innerHTML = `<div class="cn-pencil-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div>`;
    themeGrid.appendChild(pencilCell);

    const solidGrid = document.getElementById("cnSolidGrid");
    const savedBg = getSavedSolidBg();
    SOLID_COLORS.forEach((hex) => {
      const cell = document.createElement("div");
      cell.className = "cn-solid-swatch" + (hex.toLowerCase() === savedBg.toLowerCase() ? " selected" : "");
      cell.style.background = hex;
      cell.innerHTML = `<span class="cn-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`;
      cell.addEventListener("click", () => {
        solidGrid.querySelectorAll(".cn-solid-swatch").forEach(s => s.classList.remove("selected"));
        cell.classList.add("selected");
        chooseSolidBg(hex);
      });
      solidGrid.appendChild(cell);
    });

    const themepickGrid = document.getElementById("cnThemepickGrid");
    const savedUiTheme = getSavedUiTheme();
    Object.keys(UI_THEMES).forEach((id) => {
      const theme = UI_THEMES[id];
      const wrap = document.createElement("div");
      wrap.className = "cn-themepick-cell";

      const cell = document.createElement("div");
      cell.className = "cn-themepick" + (id === savedUiTheme ? " selected" : "");
      cell.dataset.themeId = id;
      cell.innerHTML = `
        <div class="cn-tp-bg" style="background:${theme.preview.bg}"></div>
        <div class="cn-tp-panel" style="background:${theme.preview.panel}"></div>
        <div class="cn-tp-dot" style="background:${theme.preview.dot}"></div>
        <span class="cn-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
      `;
      cell.addEventListener("click", () => {
        const isActive = cell.classList.contains("selected");
        themepickGrid.querySelectorAll(".cn-themepick").forEach(s => s.classList.remove("selected"));
        if (isActive) {
          chooseUiTheme("");
        } else {
          cell.classList.add("selected");
          chooseUiTheme(id);
        }
      });

      const label = document.createElement("div");
      label.className = "cn-themepick-label";
      label.textContent = theme.label;

      wrap.appendChild(cell);
      wrap.appendChild(label);
      themepickGrid.appendChild(wrap);
    });

    // ---- Wiring ----
    const menuBtn = document.getElementById("cnMenuBtn");
    const favoritesToggle = document.getElementById("cnFavoritesToggle");
    const favoritesChevronBtn = document.getElementById("cnFavoritesChevronBtn");
    const favoritesList = document.getElementById("cnFavoritesList");
    const settingsBtn = document.getElementById("cnSettingsBtn");

    function setExpanded(isExpanded) {
      rail.classList.toggle("expanded", isExpanded);
      saveFlag(EXPANDED_KEY, isExpanded);
    }

    function closeFlyouts() {
      settingsFlyout.classList.remove("open");
      solidFlyout.classList.remove("open");
      themesFlyout.classList.remove("open");
      customFlyout.classList.remove("open");
      settingsBtn.classList.remove("active");
    }

    menuBtn.addEventListener("click", () => {
      setExpanded(!rail.classList.contains("expanded"));
      if (rail.classList.contains("expanded")) closeFlyouts();
    });

    // Favorites row navigates like Home; the chevron opens/closes the
    // in-place dropdown of favorited games instead.
    if (getSaved(FAV_OPEN_KEY)) {
      favoritesToggle.classList.add("open");
      favoritesList.classList.add("open");
    }
    favoritesChevronBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!rail.classList.contains("expanded")) setExpanded(true);
      const isOpen = favoritesToggle.classList.toggle("open");
      favoritesList.classList.toggle("open", isOpen);
      saveFlag(FAV_OPEN_KEY, isOpen);
    });

    // Settings flyout always shows next to the collapsed rail.
    settingsBtn.addEventListener("click", () => {
      const isOpen = settingsFlyout.classList.contains("open");
      closeFlyouts();
      setExpanded(false);
      if (!isOpen) {
        settingsFlyout.classList.add("open");
        settingsBtn.classList.add("active");
      }
    });

    document.getElementById("cnOpenSolidColors").addEventListener("click", () => {
      settingsFlyout.classList.remove("open");
      solidFlyout.classList.add("open");
    });
    document.getElementById("cnBackToSettings").addEventListener("click", () => {
      solidFlyout.classList.remove("open");
      settingsFlyout.classList.add("open");
      settingsBtn.classList.add("active");
    });

    document.getElementById("cnOpenThemes").addEventListener("click", () => {
      settingsFlyout.classList.remove("open");
      themesFlyout.classList.add("open");
    });
    document.getElementById("cnBackFromThemes").addEventListener("click", () => {
      themesFlyout.classList.remove("open");
      settingsFlyout.classList.add("open");
      settingsBtn.classList.add("active");
    });


    // ---- Custom palette: 1 shared SV square, 3 markers, 3 hue sliders,
    // 1 shared hex field for whichever marker is currently active ----
    function bindDrag(el, onMove) {
      let dragging = false;
      const move = (evt) => {
        const rect = el.getBoundingClientRect();
        const point = evt.touches ? evt.touches[0] : evt;
        onMove(clamp01((point.clientX - rect.left) / rect.width), clamp01((point.clientY - rect.top) / rect.height));
      };
      const start = (evt) => { dragging = true; move(evt); evt.preventDefault(); };
      const drag = (evt) => { if (dragging) move(evt); };
      const stop = () => { dragging = false; };
      el.addEventListener("mousedown", start);
      window.addEventListener("mousemove", drag);
      window.addEventListener("mouseup", stop);
      el.addEventListener("touchstart", start, { passive: false });
      el.addEventListener("touchmove", drag, { passive: false });
      el.addEventListener("touchend", stop);
    }

    const customValues = Object.assign({}, CUSTOM_PALETTE_DEFAULT, getSavedCustomPalette() || {});
    // Each role keeps its own h/s/v so all 3 markers can sit on the one
    // shared square independently. "active" decides which marker the
    // square's own drag and the shared hex field currently point at —
    // whichever marker or hue slider was touched most recently.
    const roleState = {};
    pickerRoles.forEach(r => { roleState[r.key] = { h: 0, s: 0, v: 0 }; });
    let activeRole = "card";

    const svSquare = document.getElementById("cnSvSquare");
    const hexInputActive = document.getElementById("cnHexInputActive");
    const swatchActive = document.getElementById("cnSwatchActive");
    const svPointers = {}, huePointers = {}, hueSliders = {}, dots = {}, hueRows = {};
    pickerRoles.forEach(r => {
      svPointers[r.key] = document.getElementById(`cnSvPointer-${r.key}`);
      huePointers[r.key] = document.getElementById(`cnHuePointer-${r.key}`);
      hueSliders[r.key] = document.getElementById(`cnHue-${r.key}`);
      dots[r.key] = document.getElementById(`cnDot-${r.key}`);
      hueRows[r.key] = customFlyout.querySelector(`.cn-hue-row[data-role="${r.key}"]`);
    });

    function hexForRole(key) {
      const st = roleState[key];
      const rgb = hsvToRgb(st.h, st.s, st.v);
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    }
    function renderAll() {
      pickerRoles.forEach(r => {
        const st = roleState[r.key];
        const hex = hexForRole(r.key);
        svPointers[r.key].style.left = (st.s * 100) + "%";
        svPointers[r.key].style.top = ((1 - st.v) * 100) + "%";
        svPointers[r.key].classList.toggle("active", r.key === activeRole);
        huePointers[r.key].style.left = (st.h / 360 * 100) + "%";
        dots[r.key].style.background = hex;
        hueRows[r.key].classList.toggle("active", r.key === activeRole);
      });
      svSquare.style.backgroundColor = `hsl(${roleState[activeRole].h}, 100%, 50%)`;
      const activeHex = hexForRole(activeRole);
      if (document.activeElement !== hexInputActive) hexInputActive.value = activeHex;
      swatchActive.style.background = activeHex;
    }
    function setRoleFromHex(key, hex) {
      const rgb = hexToRgb(hex);
      if (!rgb) return;
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      roleState[key] = { h: hsv.h, s: hsv.s, v: hsv.v || 1 };
    }
    function commit() {
      pickerRoles.forEach(r => { customValues[r.key] = hexForRole(r.key); });
      chooseCustomPalette(customValues);
      themeGrid.querySelectorAll(".cn-theme-swatch").forEach(s => s.classList.remove("selected"));
      pencilCell.classList.add("selected");
    }

    // Dragging the shared square always moves whichever marker is
    // currently active; grabbing a marker directly (or its hue slider,
    // or its dot) makes it the active one first.
    bindDrag(svSquare, (x, y) => {
      roleState[activeRole].s = x;
      roleState[activeRole].v = 1 - y;
      renderAll();
      commit();
    });
    pickerRoles.forEach(r => {
      const activate = () => { activeRole = r.key; renderAll(); };
      svPointers[r.key].addEventListener("mousedown", activate);
      svPointers[r.key].addEventListener("touchstart", activate, { passive: true });
      hueRows[r.key].addEventListener("click", activate);
      hueSliders[r.key].addEventListener("mousedown", activate);
      hueSliders[r.key].addEventListener("touchstart", activate, { passive: true });
      bindDrag(hueSliders[r.key], (x) => {
        activeRole = r.key;
        roleState[r.key].h = x * 360;
        renderAll();
        commit();
      });
    });
    hexInputActive.addEventListener("change", () => {
      let val = hexInputActive.value.trim();
      if (val && !val.startsWith("#")) val = "#" + val;
      const rgb = hexToRgb(val);
      if (!rgb) { renderAll(); return; } // invalid entry — revert the field
      setRoleFromHex(activeRole, rgbToHex(rgb.r, rgb.g, rgb.b));
      renderAll();
      commit();
    });

    pickerRoles.forEach(r => setRoleFromHex(r.key, customValues[r.key]));
    renderAll();

    // Opening the custom panel from a fresh reset or from a curated
    // palette should "snap to" whatever's currently showing, not a
    // fixed default — only if custom isn't already the active choice
    // (in which case we leave it exactly as the person left it).
    pencilCell.addEventListener("click", () => {
      if (!isCustomPaletteActive()) {
        const seed = getCurrentEffectivePalette();
        Object.assign(customValues, seed);
        pickerRoles.forEach(r => setRoleFromHex(r.key, customValues[r.key]));
        activeRole = "card";
        renderAll();
        chooseCustomPalette(customValues);
        themeGrid.querySelectorAll(".cn-theme-swatch").forEach(s => s.classList.remove("selected"));
        pencilCell.classList.add("selected");
      }
      settingsFlyout.classList.remove("open");
      customFlyout.classList.add("open");
    });
    document.getElementById("cnBackToSettingsFromCustom").addEventListener("click", () => {
      customFlyout.classList.remove("open");
      settingsFlyout.classList.add("open");
      settingsBtn.classList.add("active");
    });

    // Close flyouts when clicking outside of them / the rail. Triggering
    // the real (hidden) theme.js controls below fires its own click
    // events on elements that live outside our rail/flyouts, which would
    // otherwise look like an "outside click" and close our panel — the
    // ignoreNextOutsideClick flag lets those proxy-clicks through without
    // dismissing anything.
    let ignoreNextOutsideClick = false;
    function clickRealThemeControl(el) {
      if (!el) return;
      ignoreNextOutsideClick = true;
      el.click();
      // Fallback in case no click bubble ever arrives (e.g. the file
      // dialog was cancelled) so the flag doesn't get stuck on.
      setTimeout(() => { ignoreNextOutsideClick = false; }, 400);
    }
    document.addEventListener("click", (e) => {
      if (ignoreNextOutsideClick) { ignoreNextOutsideClick = false; return; }
      if (rail.contains(e.target) || settingsFlyout.contains(e.target) || solidFlyout.contains(e.target) || themesFlyout.contains(e.target) || customFlyout.contains(e.target)) return;
      closeFlyouts();
    });

    document.getElementById("cnResetBtn").addEventListener("click", () => {
      clearSolidBg();
      solidGrid.querySelectorAll(".cn-solid-swatch").forEach(s => s.classList.remove("selected"));
      try { localStorage.removeItem(THEME_PALETTE_KEY); } catch (e) {}
      try { localStorage.removeItem(CUSTOM_PALETTE_KEY); } catch (e) {}
      applyThemePalette(-1);
      if (window.CoopTheme && window.CoopTheme.clearCardColor) window.CoopTheme.clearCardColor();
      themeGrid.querySelectorAll(".cn-theme-swatch").forEach(s => s.classList.remove("selected"));
      pencilCell.classList.remove("selected");
      chooseUiTheme("");
      themepickGrid.querySelectorAll(".cn-themepick").forEach(s => s.classList.remove("selected"));
      // Sliders themselves aren't touched here — the next time the
      // pencil is clicked, they reseed from whatever's actually on the
      // page now (the site's native dark/light colors, since no
      // palette is active), not a fixed default.
    });

    // --- Real wiring: Upload image + light/dark reuse theme.js as-is ---
    document.getElementById("cnUploadImage").addEventListener("click", () => {
      clickRealThemeControl(document.querySelector(".theme-image-input"));
    });

    const segmented = document.getElementById("cnSegmented");
    function selectSegment(mode) {
      segmented.querySelectorAll("button").forEach(b => b.classList.toggle("selected", b.dataset.mode === mode));
    }
    const savedTheme = (function () { try { return localStorage.getItem("siteTheme"); } catch (e) { return null; } })();
    selectSegment(savedTheme === "light" ? "light" : "dark");

    segmented.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        selectSegment(btn.dataset.mode);
        if (btn.dataset.mode === "light" || btn.dataset.mode === "dark") {
          clickRealThemeControl(document.querySelector(`.theme-swatch[data-theme="${btn.dataset.mode}"]`));
          const savedBg = getSavedSolidBg();
          if (savedBg) applySolidBg(savedBg);
        }
        // "device" has no real behavior wired up yet.
      });
    });

    // ---- Lock color-editing controls while a whole-site theme (Clay)
    // is active — it's a fixed, curated look, not something meant to
    // be tweaked on top of. Re-enabled the moment the theme's turned
    // back off (clicking its swatch again in the Themes flyout, or
    // "reset to default"). ----
    const openSolidColorsTile = document.getElementById("cnOpenSolidColors");
    function updateThemeLockUI() {
      const locked = !!getSavedUiTheme();
      [openSolidColorsTile, segmented, themeGrid, solidGrid].forEach(el => {
        if (!el) return;
        el.classList.toggle("cn-locked", locked);
      });
    }
    updateThemeLockUI();
    window.addEventListener("coopUiThemeChanged", updateThemeLockUI);

    renderFavorites();
  }

  function retranslate() {
    const rail = document.getElementById("cnRail");
    if (!rail) return;
    const t = I18N[lang()];
    const menuBtn = document.getElementById("cnMenuBtn");
    if (menuBtn) menuBtn.setAttribute("aria-label", t.toggleMenu);
    document.querySelectorAll('[data-cn-t]').forEach(el => {
      el.textContent = t[el.dataset.cnT];
    });
    const chevronBtn = document.getElementById("cnFavoritesChevronBtn");
    if (chevronBtn) {
      chevronBtn.setAttribute("aria-label", t.showFavorites);
      chevronBtn.setAttribute("title", t.showFavorites);
    }
    renderFavorites();
  }

  window.addEventListener("coopFavoritesChanged", renderFavorites);
  window.addEventListener("coopLangChanged", retranslate);
  window.addEventListener("storage", (e) => {
    if (e.key === "coopLibraryFavorites") renderFavorites();
    if (e.key === "coopLibraryLang") retranslate();
  });

  function init() {
    const savedUiTheme = getSavedUiTheme();
    if (savedUiTheme) applyUiTheme(savedUiTheme);
    const savedBg = getSavedSolidBg();
    if (savedBg) applySolidBg(savedBg);
    if (isCustomPaletteActive()) {
      const custom = getSavedCustomPalette();
      if (custom) applyPaletteColors(custom);
    } else {
      const savedPaletteIdx = getSavedThemePaletteIndex();
      if (savedPaletteIdx >= 0) applyThemePalette(savedPaletteIdx);
    }
    injectStyle();
    build();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
