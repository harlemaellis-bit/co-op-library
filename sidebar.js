/**
 * sidebar.js
 * -----------------------------------------------------------------
 * Site-wide collapsible left nav rail.
 *
 *   Drag the thin handle on the right edge (or click the chevron at
 *   the bottom) to open it wide and reveal labels + the Following
 *   list. Collapsed = icon-only strip pinned to the left edge, with
 *   hover tooltips.
 *
 *   🏠 Home        -> coop-library.html
 *   ♥  Favorites   -> favorites.html
 *   ⚙  Settings    -> opens the existing theme.js panel
 *   ────────────────
 *   FOLLOWING
 *   [icon] Game name  -> one row per saved favorite, click to open it
 *
 * Fully self-contained — include after theme.js and favorites.js:
 *
 *   <script src="theme.js"></script>
 *   <script src="favorites.js"></script>
 *   <script src="sidebar.js"></script>
 *
 * It reuses theme.js's existing settings panel (no changes needed
 * to theme.js) — it just hides theme.js's own little gear button
 * and re-triggers it from the rail's gear icon instead, and nudges
 * the panel's position to open next to the rail.
 * -----------------------------------------------------------------
 */
(function () {
  const file = (window.location.pathname.split("/").pop() || "").toLowerCase();
  const isHome = file === "" || file === "coop-library.html" || file === "index.html";
  const isFav = file === "favorites.html";

  const COLLAPSED = 96;
  const EXPANDED = 250;
  const THRESHOLD = (COLLAPSED + EXPANDED) / 2;
  const EXPANDED_KEY = "coopRailExpanded";

  function getSavedExpanded() {
    try {
      return localStorage.getItem(EXPANDED_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function saveExpanded(isExpanded) {
    try {
      localStorage.setItem(EXPANDED_KEY, isExpanded ? "1" : "0");
    } catch (e) {
      /* ignore — e.g. storage disabled */
    }
  }

  const STYLE = `
    /* Reclaim the space the old floating gear button used to reserve,
       and hide that button — the rail's own gear icon replaces it. */
    body{ padding-top:32px !important; padding-left:${COLLAPSED + 32}px !important; }
    .theme-menu-btn{ display:none !important; }
    .theme-panel{ top:16px !important; left:${COLLAPSED + 38}px !important; }

    .coop-rail{
      --rail-accent-1: var(--only2, #ff6b81);
      --rail-accent-2: var(--twoto4, #5b9dff);
      position:fixed; top:14px; left:14px; bottom:14px;
      height:calc(100vh - 28px);
      width:${COLLAPSED}px;
      min-width:${COLLAPSED}px;
      z-index:950;
      display:flex;
      flex-direction:column;
      background: linear-gradient(180deg, var(--surface, #1b1f2e), var(--bg-alt, #151824));
      border:1px solid var(--border, #2a3044);
      border-radius:26px;
      padding:18px 0;
      box-shadow:0 8px 28px rgba(0,0,0,0.28);
      transition: width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s cubic-bezier(.4,0,.2,1);
      overflow:hidden;
    }
    .coop-rail.expanded{
      width:${EXPANDED}px;
      min-width:${EXPANDED}px;
      box-shadow:14px 12px 38px rgba(0,0,0,0.35);
    }
    .coop-rail.dragging{ transition:none; }

    .coop-rail-brand{
      display:flex; align-items:center; gap:10px;
      padding:0 14px 18px 14px;
      margin-bottom:6px;
      border-bottom:1px solid var(--border, #2a3044);
      white-space:nowrap; overflow:hidden; flex-shrink:0;
    }
    .coop-rail-menu-btn{
      flex:0 0 auto; width:26px; height:26px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      background:none; border:1px solid var(--border, #2a3044);
      color:var(--text-dim, #9aa0b8); cursor:pointer; padding:0;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }
    .coop-rail-menu-btn:hover{
      background:color-mix(in srgb, var(--surface-hover, #212639) 75%, transparent);
      color:var(--text, #eef1f7); border-color:var(--text-faint, #5e6478);
    }
    .coop-rail-brand-mark{
      flex:0 0 auto; width:32px; height:32px; border-radius:50%;
      background: linear-gradient(135deg, var(--rail-accent-1), var(--rail-accent-2));
      display:flex; align-items:center; justify-content:center;
      font-family:'Press Start 2P', monospace;
      font-size:10px; color:#0e1016;
      text-decoration:none; cursor:pointer;
      transition: filter 0.15s ease;
    }
    .coop-rail-brand-mark:hover{ filter:brightness(1.12); }
    .coop-rail-brand-text{
      font-family:'Press Start 2P', monospace;
      font-size:11px; line-height:1.5; color:var(--text, #eef1f7);
      text-decoration:none;
      opacity:0; transform:translateX(-6px);
      transition: opacity 0.22s ease, transform 0.22s ease, color 0.15s ease;
    }
    .coop-rail-brand-text:hover{ color:var(--rail-accent-2); }
    .coop-rail.expanded .coop-rail-brand-text{ opacity:1; transform:none; }

    nav.coop-rail-nav{
      display:flex; flex-direction:column; gap:4px;
      padding:8px 12px; flex-shrink:0;
    }

    .coop-rail-item{
      position:relative;
      display:flex; align-items:center; gap:14px;
      height:44px; padding:0 14px;
      border-radius:999px;
      color:var(--text-dim, #9aa0b8);
      cursor:pointer; background:none; border:none;
      text-decoration:none;
      font-family:'Space Grotesk', sans-serif;
      font-weight:600; font-size:13.5px;
      white-space:nowrap; overflow:hidden; width:100%; text-align:left;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .coop-rail-item:hover{ background:color-mix(in srgb, var(--surface-hover, #212639) 75%, transparent); color:var(--text, #eef1f7); }
    .coop-rail-item.active{
      color:var(--text, #eef1f7);
      background: linear-gradient(90deg, color-mix(in srgb, var(--rail-accent-1) 22%, transparent), color-mix(in srgb, var(--rail-accent-2) 8%, transparent));
    }
    .coop-rail-item.active::before{
      content:""; position:absolute; left:-12px; top:7px; bottom:7px; width:4px;
      border-radius:4px;
      background: linear-gradient(180deg, var(--rail-accent-1), var(--rail-accent-2));
    }

    .coop-rail-item .icon{ flex:0 0 auto; width:20px; text-align:center; font-size:16px; line-height:1; }
    .coop-rail-item .label{
      opacity:0; transform:translateX(-6px);
      transition: opacity 0.22s ease, transform 0.22s ease;
    }
    .coop-rail.expanded .coop-rail-item .label{ opacity:1; transform:none; }

    .coop-rail-item .tooltip{
      position:absolute; left:calc(${COLLAPSED}px - 4px); top:50%; transform:translateY(-50%);
      background: var(--surface-hover, #212639);
      border:1px solid var(--border, #2a3044);
      color:var(--text, #eef1f7);
      padding:6px 12px; border-radius:12px; font-size:12px; white-space:nowrap;
      opacity:0; pointer-events:none; transition:opacity 150ms ease;
      box-shadow:0 6px 18px rgba(0,0,0,.35); z-index:20;
    }
    .coop-rail:not(.expanded) .coop-rail-item:hover .tooltip{ opacity:1; }
    .coop-rail.expanded .tooltip{ display:none; }

    .coop-rail-badge{
      margin-left:auto; min-width:18px; height:18px; padding:0 5px;
      border-radius:9px; background:var(--rail-accent-1);
      color:#fff; font-family:'IBM Plex Mono', monospace;
      font-size:10px; font-weight:700;
      display:none; align-items:center; justify-content:center;
      opacity:0; transition:opacity 0.15s ease; flex-shrink:0;
    }
    .coop-rail.expanded .coop-rail-badge{ opacity:1; }

    .coop-rail-divider{
      margin:8px 18px; border-top:1px solid var(--border, #2a3044);
      opacity:0; transition:opacity 0.15s ease; flex-shrink:0;
    }
    .coop-rail.expanded .coop-rail-divider{ opacity:1; }

    .coop-rail-section-label{
      padding:6px 18px 6px;
      font-family:'IBM Plex Mono', monospace;
      font-size:10px; letter-spacing:0.1em; text-transform:uppercase;
      color:var(--text-faint, #5e6478);
      opacity:0; transition:opacity 0.15s ease;
      white-space:nowrap; flex-shrink:0;
    }
    .coop-rail-section-label::before{ content:"▸ "; color:var(--rail-accent-2); }
    .coop-rail.expanded .coop-rail-section-label{ opacity:1; }

    .coop-rail-following{ overflow-y:auto; display:none; flex:1; min-height:0; }
    .coop-rail.expanded .coop-rail-following{ display:block; }
    .coop-rail-following::-webkit-scrollbar{ width:5px; }
    .coop-rail-following::-webkit-scrollbar-track{ background:transparent; }
    .coop-rail-following::-webkit-scrollbar-thumb{ background:var(--border, #2a3044); border-radius:3px; }
    .coop-rail-following::-webkit-scrollbar-thumb:hover{ background:var(--text-faint, #5e6478); }

    .coop-rail-follow-item{
      display:flex; align-items:center; gap:12px;
      padding:8px 18px;
      color:var(--text-dim, #9aa0b8);
      text-decoration:none;
      font-size:12.5px;
      white-space:nowrap;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .coop-rail-follow-item:hover{ background:color-mix(in srgb, var(--surface-hover, #212639) 60%, transparent); color:var(--text, #eef1f7); }
    .coop-rail-follow-thumb{
      width:42px; height:26px; border-radius:8px;
      object-fit:cover; object-position:center; flex-shrink:0;
      background:var(--bg-alt, #151824);
      border:1px solid var(--border, #2a3044);
    }
    .coop-rail-follow-thumb-fallback{
      width:42px; height:26px; border-radius:8px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      background:var(--bg-alt, #151824);
      border:1px solid var(--border, #2a3044);
      font-family:'Press Start 2P', monospace; font-size:9px;
      color:var(--text-faint, #5e6478);
    }
    .coop-rail-follow-name{ overflow:hidden; text-overflow:ellipsis; }
    .coop-rail-empty{
      padding:6px 18px 14px; font-size:11.5px; line-height:1.5;
      color:var(--text-faint, #5e6478); white-space:normal;
    }

    .coop-rail-foot{
      padding:10px 12px 0 12px;
      border-top:1px solid var(--border, #2a3044);
      flex-shrink:0;
    }
    .coop-rail-collapse-icon{ transition: transform 0.22s ease; display:flex; }
    .coop-rail.expanded .coop-rail-collapse-icon{ transform:rotate(180deg); }

    .coop-rail-handle{
      position:absolute; top:0; right:-3px; width:6px; height:100%;
      cursor:ew-resize; display:flex; align-items:center; justify-content:center; z-index:30;
    }
    .coop-rail-handle::after{
      content:""; width:3px; height:48px; border-radius:3px;
      background:var(--border, #2a3044);
      transition: background 150ms ease, height 150ms ease, box-shadow 150ms ease;
    }
    .coop-rail-handle:hover::after, .coop-rail-handle.active::after{
      height:80px;
      background: linear-gradient(180deg, var(--rail-accent-1), var(--rail-accent-2));
      box-shadow:0 0 14px color-mix(in srgb, var(--rail-accent-1) 55%, transparent);
    }

    @media (max-width:640px){
      body{ padding-left:24px !important; padding-bottom:78px !important; }
      .coop-rail{
        top:auto; bottom:0; left:0; right:0; height:60px; width:100% !important; min-width:100% !important;
        flex-direction:row; align-items:center; justify-content:space-around;
        padding:0; border:none; border-top:1px solid var(--border, #2a3044);
        border-radius:20px 20px 0 0;
        box-shadow:0 -8px 24px rgba(0,0,0,0.3);
      }
      .coop-rail-brand, .coop-rail-divider, .coop-rail-section-label, .coop-rail-following, .coop-rail-foot, .coop-rail-handle{ display:none; }
      nav.coop-rail-nav{ flex-direction:row; padding:0; gap:0; width:100%; justify-content:space-around; }
      .coop-rail-item{
        flex-direction:column; gap:2px; width:auto; height:auto; padding:8px 14px;
        font-size:9.5px; text-align:center; border-radius:16px;
      }
      .coop-rail-item .label{ opacity:1; transform:none; }
      .coop-rail-item.active::before{ left:8px; right:8px; top:-1px; bottom:auto; width:auto; height:3px; border-radius:4px 4px 0 0; }
      .coop-rail-badge{ opacity:1; position:absolute; top:2px; right:6px; }
      .theme-panel{ top:auto !important; bottom:72px !important; left:16px !important; }
    }
  `;

  function ensureFont() {
    if (document.querySelector('link[data-coop-rail-font]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
    link.setAttribute("data-coop-rail-font", "1");
    document.head.appendChild(link);
  }

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
    } catch (e) {
      return [];
    }
  }

  function renderFollowing() {
    const list = document.getElementById("coopRailFollowing");
    const badge = document.getElementById("coopRailBadge");
    if (!list) return;
    const favorites = getFavorites();

    if (badge) {
      badge.textContent = favorites.length > 99 ? "99+" : String(favorites.length);
      badge.style.display = favorites.length > 0 ? "flex" : "none";
    }

    if (favorites.length === 0) {
      list.innerHTML = `<div class="coop-rail-empty">Heart a game from its info page and it'll show up here.</div>`;
      return;
    }

    list.innerHTML = favorites.map(g => {
      const name = (g.name || "Untitled").replace(/</g, "&lt;");
      const url = g.infoUrl || g.steamUrl || "favorites.html";
      const thumb = g.img
        ? `<img class="coop-rail-follow-thumb" src="${g.img}" alt="" loading="lazy" onerror="this.outerHTML='<div class=&quot;coop-rail-follow-thumb-fallback&quot;>${name.charAt(0)}</div>'">`
        : `<div class="coop-rail-follow-thumb-fallback">${name.charAt(0)}</div>`;
      return `<a class="coop-rail-follow-item" href="${url}">${thumb}<span class="coop-rail-follow-name">${name}</span></a>`;
    }).join("");
  }

  function build() {
    const rail = document.createElement("div");
    rail.className = "coop-rail" + (getSavedExpanded() ? " expanded" : "");
    rail.innerHTML = `
      <div class="coop-rail-brand">
        <button type="button" class="coop-rail-menu-btn" id="coopRailMenuBtn" aria-label="Expand or collapse the sidebar" title="Expand or collapse the sidebar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <a class="coop-rail-brand-mark" href="coop-library.html" aria-label="Co-op Library home">CO</a>
        <a class="coop-rail-brand-text" href="coop-library.html">CO-OP<br>LIBRARY</a>
      </div>

      <nav class="coop-rail-nav">
        <a class="coop-rail-item${isHome ? " active" : ""}" href="coop-library.html">
          <span class="icon">🏠</span><span class="label">Home</span>
          <span class="tooltip">Home</span>
        </a>
        <a class="coop-rail-item${isFav ? " active" : ""}" href="favorites.html">
          <span class="icon">♥</span><span class="label">Favorites</span>
          <span class="coop-rail-badge" id="coopRailBadge">0</span>
          <span class="tooltip">Favorites</span>
        </a>
        <button type="button" class="coop-rail-item" id="coopRailSettings">
          <span class="icon">⚙</span><span class="label">Settings</span>
          <span class="tooltip">Settings</span>
        </button>
      </nav>

      <div class="coop-rail-divider"></div>
      <div class="coop-rail-section-label">Following</div>
      <div class="coop-rail-following" id="coopRailFollowing"></div>

      <div class="coop-rail-foot">
        <button type="button" class="coop-rail-item" id="coopRailCollapse">
          <span class="icon coop-rail-collapse-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </span>
          <span class="label">Collapse</span>
          <span class="tooltip">Expand</span>
        </button>
      </div>

      <div class="coop-rail-handle" id="coopRailHandle"></div>
    `;
    document.body.appendChild(rail);

    const handle = document.getElementById("coopRailHandle");
    const collapseBtn = document.getElementById("coopRailCollapse");

    let dragging = false;
    let startX = 0;
    let startWidth = COLLAPSED;

    function setExpanded(isExpanded) {
      rail.classList.toggle("expanded", isExpanded);
      rail.style.width = "";
      rail.style.minWidth = "";
      saveExpanded(isExpanded);
    }

    collapseBtn.addEventListener("click", () => {
      setExpanded(!rail.classList.contains("expanded"));
    });

    const menuBtn = document.getElementById("coopRailMenuBtn");
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setExpanded(!rail.classList.contains("expanded"));
    });

    function onDragStart(clientX) {
      dragging = true;
      startX = clientX;
      startWidth = rail.getBoundingClientRect().width;
      rail.classList.add("dragging");
      handle.classList.add("active");
      document.body.style.userSelect = "none";
    }

    function onDragMove(clientX) {
      if (!dragging) return;
      const delta = clientX - startX;
      let newWidth = startWidth + delta;
      newWidth = Math.max(COLLAPSED, Math.min(EXPANDED, newWidth));
      rail.style.width = newWidth + "px";
      rail.style.minWidth = newWidth + "px";
    }

    function onDragEnd() {
      if (!dragging) return;
      dragging = false;
      rail.classList.remove("dragging");
      handle.classList.remove("active");
      document.body.style.userSelect = "";
      const currentWidth = rail.getBoundingClientRect().width;
      setExpanded(currentWidth >= THRESHOLD);
    }

    handle.addEventListener("mousedown", e => onDragStart(e.clientX));
    window.addEventListener("mousemove", e => onDragMove(e.clientX));
    window.addEventListener("mouseup", onDragEnd);
    handle.addEventListener("touchstart", e => onDragStart(e.touches[0].clientX), { passive: true });
    window.addEventListener("touchmove", e => onDragMove(e.touches[0].clientX), { passive: true });
    window.addEventListener("touchend", onDragEnd);

    const settingsBtn = document.getElementById("coopRailSettings");
    settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const originalBtn = document.querySelector(".theme-menu-btn");
      if (originalBtn) originalBtn.click();
    });

    // Mirror the real theme-panel's open/closed state onto the Settings
    // item so it lights up (active pill + accent bar) exactly while the
    // panel is visible, then clears the moment it's dismissed — by
    // outside click, Escape, or clicking Settings again.
    //
    // Only one item should ever look "active" at a time. Home/Favorites
    // get their active state baked in at build time based on the current
    // page (see isHome/isFav above), so while Settings is open we need to
    // temporarily switch that page item's highlight off, then switch it
    // back on the moment Settings closes.
    const pageActiveItem = rail.querySelector(".coop-rail-item.active:not(#coopRailSettings)");
    const themePanel = document.querySelector(".theme-panel");
    if (themePanel) {
      const syncSettingsActive = () => {
        const isOpen = themePanel.classList.contains("open");
        settingsBtn.classList.toggle("active", isOpen);
        if (pageActiveItem) pageActiveItem.classList.toggle("active", !isOpen);
      };
      new MutationObserver(syncSettingsActive).observe(themePanel, {
        attributes: true,
        attributeFilter: ["class"]
      });
      syncSettingsActive();
    }

    renderFollowing();
  }

  window.addEventListener("coopFavoritesChanged", renderFollowing);
  window.addEventListener("storage", (e) => {
    if (e.key === "coopLibraryFavorites") renderFollowing();
  });

  function init() {
    ensureFont();
    injectStyle();
    build();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
