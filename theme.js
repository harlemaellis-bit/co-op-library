/**
 * theme.js
 * -----------------------------------------------------------------
 * Site-wide settings menu (☰, top-left):
 *   - Theme: dark / light / custom wallpaper
 *   - Accent: an optional solid fill on game cards, picked from a
 *     full saturation/value square + hue slider + hex field — any
 *     color, not a fixed preset list. Text color (black/white) is
 *     picked automatically per-color via relative luminance, so it
 *     stays readable against whatever hex is chosen.
 *
 * Fully self-contained — just include this on any page:
 *
 *   <script src="theme.js"></script>
 *
 * No extra HTML or CSS needed. It builds its own hamburger button
 * and dropdown panel, and injects its own stylesheet. The "Accent"
 * option only visually affects elements with class "card" (the
 * game cards on coop-library.html) — harmless no-op on pages
 * without any.
 *
 * Everything is saved in localStorage, so choices stay applied
 * across pages and future visits.
 * -----------------------------------------------------------------
 */

/**
 * window.CoopLang — tiny site-wide language-persistence helper.
 * Any page with an EN/FR toggle calls CoopLang.set("fr") when the
 * user picks a language; any page (including this one, via
 * sidebar.js) calls CoopLang.get() on load to pick up whatever was
 * last chosen, so the language sticks even after navigating to a
 * different page. Fires "coopLangChanged" so already-loaded UI
 * (like the sidebar) can update immediately without a reload.
 */
(function () {
  const KEY = "coopLibraryLang";
  function get() {
    try {
      const v = localStorage.getItem(KEY);
      return (v === "fr" || v === "en") ? v : "en";
    } catch (e) {
      return "en";
    }
  }
  function set(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    window.dispatchEvent(new CustomEvent("coopLangChanged", { detail: { lang } }));
  }
  window.CoopLang = { get, set };
})();

(function () {
  const THEMES = {
    dark: {
      "--bg": "#0e1016",
      "--bg-alt": "#151824",
      "--surface": "#1b1f2e",
      "--surface-hover": "#212639",
      "--border": "#2a3044",
      "--text": "#eef1f7",
      "--text-dim": "#9aa0b8",
      "--text-faint": "#5e6478"
    },
    light: {
      "--bg": "#f3f4f8",
      "--bg-alt": "#e7e9f0",
      "--surface": "#ffffff",
      "--surface-hover": "#f2f3f8",
      "--border": "#d7dae3",
      "--text": "#181b24",
      "--text-dim": "#4c5166",
      "--text-faint": "#7a8098"
    }
  };

  // Default starting point for the picker before any color is chosen
  // (a muted sage — nothing is actually applied to cards until the
  // person interacts with the picker or has a saved value).
  const DEFAULT_PICKER_HEX = "#7C8870";

  const KEY_THEME = "siteTheme";        // "dark" | "light" | "custom"
  const KEY_IMAGE = "siteCustomImage";  // data URL of the wallpaper
  const KEY_BASE = "siteCustomBase";    // "dark" | "light" — palette used under the wallpaper
  const KEY_CARD_COLOR = "siteCardColor"; // hex string, e.g. "#7C8870", or absent for no accent

  // --- Color conversion helpers ---
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

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
      .map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
      .join("").toUpperCase();
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

  // Picks black or white text for readable contrast against an
  // arbitrary rgb background, using the standard WCAG relative
  // luminance formula (sRGB gamma-corrected).
  function contrastTextColor(r, g, b) {
    const toLinear = c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return L > 0.35 ? "#000000" : "#ffffff";
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

  const STYLE = `
    body{ padding-top: 84px !important; }
    @media (max-width:520px){ body{ padding-top: 76px !important; } }

    .theme-menu-btn{
      position:fixed; top:20px; left:20px; z-index:1000;
      width:40px; height:40px;
      display:flex; align-items:center; justify-content:center;
      background:var(--surface, #1b1f2e);
      border:1px solid var(--border, #2a3044);
      border-radius:10px;
      color:var(--text, #eef1f7);
      font-size:17px;
      cursor:pointer;
      transition: all 0.15s ease;
    }
    .theme-menu-btn:hover{ border-color:var(--text-faint, #5e6478); }

    .theme-panel{
      position:fixed; top:66px; left:20px; z-index:1000;
      background:var(--surface, #1b1f2e);
      border:1px solid var(--border, #2a3044);
      border-radius:12px;
      padding:14px;
      display:none;
      flex-direction:column;
      gap:8px;
      min-width:220px;
      box-shadow:0 10px 30px rgba(0,0,0,0.35);
      font-family:'Space Grotesk', sans-serif;
    }
    .theme-panel.open{ display:flex; }

    .theme-panel-label{
      font-family:'IBM Plex Mono', monospace;
      font-size:10.5px;
      letter-spacing:0.08em;
      text-transform:uppercase;
      color:var(--text-faint, #5e6478);
    }
    .theme-panel-label:not(:first-child){ margin-top:6px; }

    .theme-switch-row{ display:flex; gap:6px; align-items:center; flex-wrap:wrap; }

    .swatch-btn{
      width:26px; height:26px;
      border-radius:7px;
      border:1px solid var(--border, #2a3044);
      cursor:pointer;
      padding:0;
      flex-shrink:0;
      transition: all 0.15s ease;
    }
    .swatch-btn:hover{ transform:scale(1.1); }
    .swatch-btn.active{
      box-shadow:0 0 0 2px var(--surface, #1b1f2e), 0 0 0 4px #5b9dff;
    }

    .theme-swatch-custom{
      background: conic-gradient(from 180deg, #ff6b81, #ffb84d, #5ce1a0, #5b9dff, #ff6b81);
    }

    .theme-remove-btn{
      display:flex; align-items:center; justify-content:center;
      width:26px; height:26px;
      font-size:12px;
      color:var(--text-dim, #9aa0b8);
      background:var(--bg, #0e1016);
      border:1px solid var(--border, #2a3044);
      border-radius:50%;
      cursor:pointer;
      transition: all 0.15s ease;
    }
    .theme-remove-btn:hover{ color:var(--text, #eef1f7); border-color:var(--text-faint, #5e6478); }

    .sv-square{
      position:relative;
      width:100%;
      height:110px;
      border-radius:8px;
      margin-top:8px;
      border:1px solid var(--border, #2a3044);
      cursor:crosshair;
      overflow:hidden;
      touch-action:none;
    }
    .sv-square-white{
      position:absolute; inset:0;
      background:linear-gradient(to right, #fff, rgba(255,255,255,0));
    }
    .sv-square-black{
      position:absolute; inset:0;
      background:linear-gradient(to top, #000, rgba(0,0,0,0));
    }
    .sv-pointer{
      position:absolute;
      width:14px; height:14px;
      border-radius:50%;
      border:2px solid #fff;
      box-shadow:0 0 0 1px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.4);
      transform:translate(-50%,-50%);
      pointer-events:none;
    }

    .hue-slider{
      position:relative;
      width:100%;
      height:14px;
      border-radius:7px;
      margin-top:10px;
      cursor:pointer;
      touch-action:none;
      background:linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
      border:1px solid var(--border, #2a3044);
    }
    .hue-pointer{
      position:absolute;
      top:50%; width:16px; height:16px;
      border-radius:50%;
      border:2px solid #fff;
      box-shadow:0 0 0 1px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.4);
      transform:translate(-50%,-50%);
      pointer-events:none;
      background:transparent;
    }

    .picker-preview-row{
      display:flex;
      align-items:center;
      gap:8px;
      margin-top:10px;
    }
    .picker-swatch{
      width:26px; height:26px;
      border-radius:7px;
      border:1px solid var(--border, #2a3044);
      flex-shrink:0;
    }
    .picker-hex-input{
      flex:1;
      min-width:0;
      font-family:'IBM Plex Mono', monospace;
      font-size:12px;
      letter-spacing:0.02em;
      background:var(--bg, #0e1016);
      border:1px solid var(--border, #2a3044);
      color:var(--text, #eef1f7);
      border-radius:6px;
      padding:5px 8px;
    }
    .picker-hex-input:focus{ outline:none; border-color:var(--text-faint, #5e6478); }

    /* Header text (eyebrow / h1 / sub) sits directly on the body
       background with no opaque card behind it. Everywhere else that
       uses --text/--text-dim/--text-faint is wrapped in a --surface
       pill or card, so it stays readable no matter which base palette
       is picked. This text isn't, so when a wallpaper is active it
       needs to ignore the chosen light/dark base and always use
       light, readable colors — the scrim behind the photo is always
       dark, regardless of base. */
    body.has-custom-bg .eyebrow{ color:#b7bdcf !important; }
    body.has-custom-bg h1{ color:#f2efe9 !important; }
    body.has-custom-bg .sub{ color:#d3d7e3 !important; }
  `;

  function injectStyle() {
    const el = document.createElement("style");
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  function applyVars(vars) {
    const root = document.documentElement.style;
    Object.entries(vars).forEach(([k, v]) => root.setProperty(k, v));
  }

  function clearWallpaper() {
    document.body.style.backgroundImage = "";
    document.body.classList.remove("has-custom-bg");
  }

  function applyWallpaper(dataUrl) {
    // Dark scrim under the image keeps existing text readable regardless
    // of what the photo looks like.
    document.body.style.backgroundImage =
      `linear-gradient(rgba(6,8,14,0.6), rgba(6,8,14,0.6)), url("${dataUrl}")`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
    document.body.classList.add("has-custom-bg");
  }

  function setTheme(mode) {
    localStorage.setItem(KEY_THEME, mode);

    if (mode === "custom") {
      const base = localStorage.getItem(KEY_BASE) || "dark";
      applyVars(THEMES[base]);
      const img = localStorage.getItem(KEY_IMAGE);
      if (img) applyWallpaper(img);
    } else {
      applyVars(THEMES[mode] || THEMES.dark);
      clearWallpaper();
    }
    updateActiveStates();
  }

  // --- Game-card accent override ---
  function applyCardOverride() {
    let styleEl = document.getElementById("cardColorOverride");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "cardColorOverride";
      document.head.appendChild(styleEl);
    }
    const hex = localStorage.getItem(KEY_CARD_COLOR);
    const rgb = hexToRgb(hex);
    if (!rgb) {
      styleEl.textContent = "";
      return;
    }
    // Fill the whole card with the chosen color, and pick black or
    // white text automatically (via relative luminance) so it stays
    // readable against any hex the person lands on.
    const textColor = contrastTextColor(rgb.r, rgb.g, rgb.b);
    styleEl.textContent = `
      .card{
        background: ${hex} !important;
        border-color: ${hex} !important;
      }
      .card .name, .card .note{
        color: ${textColor} !important;
      }
    `;
  }

  function commitCardColor(hex) {
    localStorage.setItem(KEY_CARD_COLOR, hex);
    applyCardOverride();
    updateActiveStates();
  }

  function clearCardColor() {
    localStorage.removeItem(KEY_CARD_COLOR);
    applyCardOverride();
    updateActiveStates();
  }

  function updateActiveStates() {
    const themeMode = localStorage.getItem(KEY_THEME) || "dark";
    document.querySelectorAll(".theme-swatch").forEach(b => {
      b.classList.toggle("active", b.dataset.theme === themeMode);
    });
    const removeBtn = document.querySelector(".theme-remove-btn");
    if (removeBtn) removeBtn.style.display = (themeMode === "custom") ? "inline-flex" : "none";

    const pickerClearBtn = document.getElementById("pickerClearBtn");
    if (pickerClearBtn) {
      pickerClearBtn.style.display = localStorage.getItem(KEY_CARD_COLOR) ? "inline-flex" : "none";
    }
  }

  // Downscale + compress the chosen photo before storing it, so it
  // fits comfortably in localStorage and loads fast.
  function resizeImage(file, maxWidth, quality, cb) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        cb(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => cb(null);
      img.src = e.target.result;
    };
    reader.onerror = () => cb(null);
    reader.readAsDataURL(file);
  }

  function buildMenu() {
    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.className = "theme-menu-btn";
    menuBtn.setAttribute("aria-label", "Settings");
    menuBtn.textContent = "☰";

    const panel = document.createElement("div");
    panel.className = "theme-panel";
    panel.innerHTML = `
      <div class="theme-panel-label">Theme</div>
      <div class="theme-switch-row">
        <button class="swatch-btn theme-swatch" data-theme="dark" type="button" title="Dark theme" style="background:#0e1016;"></button>
        <button class="swatch-btn theme-swatch" data-theme="light" type="button" title="Light theme" style="background:#f3f4f8;"></button>
        <button class="swatch-btn theme-swatch theme-swatch-custom" data-theme="custom" type="button" title="Custom wallpaper"></button>
        <button class="theme-remove-btn" type="button" title="Remove wallpaper" style="display:none;">✕</button>
      </div>
      <input type="file" class="theme-image-input" accept="image/*" style="display:none;">

      <div class="theme-panel-label">Card accent</div>
      <div class="sv-square" id="svSquare">
        <div class="sv-square-white"></div>
        <div class="sv-square-black"></div>
        <div class="sv-pointer" id="svPointer"></div>
      </div>
      <div class="hue-slider" id="hueSlider">
        <div class="hue-pointer" id="huePointer"></div>
      </div>
      <div class="picker-preview-row">
        <div class="picker-swatch" id="pickerSwatch"></div>
        <input type="text" class="picker-hex-input" id="pickerHexInput" maxlength="7" spellcheck="false" aria-label="Accent hex value">
        <button class="theme-remove-btn" id="pickerClearBtn" type="button" title="Remove accent" style="display:none;">✕</button>
      </div>
    `;

    document.body.appendChild(menuBtn);
    document.body.appendChild(panel);

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== menuBtn) panel.classList.remove("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") panel.classList.remove("open");
    });

    const fileInput = panel.querySelector(".theme-image-input");

    panel.querySelectorAll(".theme-swatch").forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.theme;
        if (mode === "custom") {
          const hasImage = !!localStorage.getItem(KEY_IMAGE);
          const currentMode = localStorage.getItem(KEY_THEME);
          if (currentMode === "custom") {
            // Already on custom — clicking again lets you swap the photo.
            fileInput.click();
            return;
          }
          if (!hasImage) {
            fileInput.click();
            return;
          }
          const prev = localStorage.getItem(KEY_THEME);
          if (prev === "dark" || prev === "light") localStorage.setItem(KEY_BASE, prev);
          setTheme("custom");
        } else {
          setTheme(mode);
        }
      });
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      resizeImage(file, 1920, 0.82, (dataUrl) => {
        if (!dataUrl) {
          alert("Couldn't read that image — try a different file.");
          return;
        }
        try {
          localStorage.setItem(KEY_IMAGE, dataUrl);
        } catch (err) {
          alert("That image is too large to save. Try a smaller one.");
          return;
        }
        const prev = localStorage.getItem(KEY_THEME);
        if (prev === "dark" || prev === "light") localStorage.setItem(KEY_BASE, prev);
        setTheme("custom");
      });
      fileInput.value = "";
    });

    const removeBtn = panel.querySelector(".theme-remove-btn");
    removeBtn.addEventListener("click", () => {
      localStorage.removeItem(KEY_IMAGE);
      const base = localStorage.getItem(KEY_BASE) || "dark";
      setTheme(base);
    });

    // --- Card accent color picker (SV square + hue slider + hex) ---
    let pickerHue = 0, pickerSat = 0, pickerVal = 0;

    function renderPicker() {
      const svSquare = document.getElementById("svSquare");
      const svPointer = document.getElementById("svPointer");
      const huePointer = document.getElementById("huePointer");
      const hexInput = document.getElementById("pickerHexInput");
      const swatch = document.getElementById("pickerSwatch");

      if (svSquare) svSquare.style.backgroundColor = `hsl(${pickerHue}, 100%, 50%)`;
      if (svPointer) {
        svPointer.style.left = (pickerSat * 100) + "%";
        svPointer.style.top = ((1 - pickerVal) * 100) + "%";
      }
      if (huePointer) huePointer.style.left = (pickerHue / 360 * 100) + "%";

      const rgb = hsvToRgb(pickerHue, pickerSat, pickerVal);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;
      if (swatch) swatch.style.background = hex;
      return hex;
    }

    function setPickerFromHex(hex) {
      const rgb = hexToRgb(hex);
      if (!rgb) return;
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      pickerHue = hsv.h; pickerSat = hsv.s; pickerVal = hsv.v || 1;
      renderPicker();
    }

    // Initialize the picker from whatever's saved, or the default hue,
    // without writing anything to storage until the person interacts.
    setPickerFromHex(localStorage.getItem(KEY_CARD_COLOR) || DEFAULT_PICKER_HEX);

    function bindDrag(el, onMove) {
      let dragging = false;
      const move = (evt) => {
        const rect = el.getBoundingClientRect();
        const point = evt.touches ? evt.touches[0] : evt;
        onMove(clamp((point.clientX - rect.left) / rect.width, 0, 1), clamp((point.clientY - rect.top) / rect.height, 0, 1));
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

    const svSquareEl = panel.querySelector("#svSquare");
    bindDrag(svSquareEl, (x, y) => {
      pickerSat = x;
      pickerVal = 1 - y;
      commitCardColor(renderPicker());
    });

    const hueSliderEl = panel.querySelector("#hueSlider");
    bindDrag(hueSliderEl, (x) => {
      pickerHue = x * 360;
      commitCardColor(renderPicker());
    });

    const hexInputEl = panel.querySelector("#pickerHexInput");
    hexInputEl.addEventListener("change", () => {
      let val = hexInputEl.value.trim();
      if (val && !val.startsWith("#")) val = "#" + val;
      const rgb = hexToRgb(val);
      if (!rgb) {
        renderPicker(); // invalid entry — revert the field to the current color
        return;
      }
      setPickerFromHex(val);
      commitCardColor(rgbToHex(rgb.r, rgb.g, rgb.b));
    });

    panel.querySelector("#pickerClearBtn").addEventListener("click", () => {
      clearCardColor();
      setPickerFromHex(DEFAULT_PICKER_HEX);
    });

    renderPicker();
  }

  // Lets other scripts (the sidebar's whole-site "Themes" switcher)
  // put the dark/light base palette back after temporarily overriding
  // --bg/--surface/etc for something like the Clay theme.
  window.CoopTheme = {
    reapplyBase: function () {
      const mode = localStorage.getItem(KEY_THEME) || "dark";
      applyVars(THEMES[mode] || THEMES.dark);
    },
    // Lets other scripts (the sidebar's whole-site "Themes" switcher)
    // wipe the hamburger-menu's single-color card accent override —
    // otherwise its !important .card rule keeps winning over a
    // whole-site theme like Clay's own card coloring.
    clearCardColor: function () {
      clearCardColor();
    }
  };

  function init() {
    injectStyle();
    buildMenu();
    const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
    setTheme(savedTheme);
    applyCardOverride();
    updateActiveStates();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
