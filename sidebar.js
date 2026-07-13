/**
 * sidebar.js
 * -----------------------------------------------------------------
 * Site-wide collapsible left nav rail (redesign).
 *
 *   Click the menu icon (☰) in the header to expand/collapse. Rail
 *   remembers the state you leave it in.
 *
 *   Collapsed: icon + tiny label, stacked. Expanded: icon + full
 *   label, side by side. Same DOM, just a flex-direction flip, so
 *   there's one motion instead of two separate layouts swapping.
 *
 *   Logo      -> coop-library.html   (always, click anywhere on it)
 *   Home      -> coop-library.html
 *   Favorites -> favorites.html (clicking the row navigates there);
 *                the chevron on that row instead opens/closes a
 *                dropdown of every game you've favorited, each one
 *                linking straight to its info page.
 *   Settings  -> opens the existing theme.js panel
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

  const COLLAPSED = 76;
  const EXPANDED = 240;
  const EXPANDED_KEY = "coopRailExpanded";
  const FAV_OPEN_KEY = "coopRailFavOpen";

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

  function getSavedFavOpen() {
    try {
      return localStorage.getItem(FAV_OPEN_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function saveFavOpen(isOpen) {
    try {
      localStorage.setItem(FAV_OPEN_KEY, isOpen ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
  }

  const STYLE = `
    /* Reclaim the space the old floating gear button used to reserve,
       and hide that button — the rail's own gear icon replaces it. */
    body{ padding-top:32px !important; padding-left:${COLLAPSED + 30}px !important; }
    .theme-menu-btn{ display:none !important; }
    .theme-panel{ top:16px !important; left:${COLLAPSED + 40}px !important; }

    .coop-rail{
      --rail-accent: var(--twoto4, #5b9dff);
      --rail-heart: var(--only2, #ff6b81);
      position:fixed; top:14px; left:14px; bottom:14px;
      width:${COLLAPSED}px;
      z-index:950;
      display:flex;
      flex-direction:column;
      background: var(--surface, #1b1f2e);
      border:1px solid var(--border, #2a3044);
      border-radius:20px;
      padding:14px 10px;
      box-shadow:0 8px 28px rgba(0,0,0,0.28);
      overflow:hidden;
      transition: width 0.26s cubic-bezier(.4,0,.2,1), padding 0.26s cubic-bezier(.4,0,.2,1);
      font-family:'Space Grotesk', sans-serif;
    }
    .coop-rail.expanded{
      width:${EXPANDED}px;
      padding:14px 12px;
      box-shadow:14px 12px 38px rgba(0,0,0,0.35);
    }

    /* ---------- Header: menu toggle + logo ---------- */

    .coop-rail-header{
      display:flex; align-items:center;
      height:40px; flex-shrink:0;
      margin-bottom:10px;
      gap:6px;
    }

    .coop-rail-menu-btn{
      flex:0 0 auto; width:36px; height:36px; border-radius:10px;
      display:flex; align-items:center; justify-content:center;
      background:none; border:none;
      color:var(--text-dim, #9aa0b8); cursor:pointer; padding:0;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .coop-rail-menu-btn:hover{
      background:var(--surface-hover, #212639);
      color:var(--text, #eef1f7);
    }
    .coop-rail-menu-btn svg{ width:18px; height:18px; flex-shrink:0; }

    .coop-rail-logo{
      display:flex; align-items:center; gap:9px;
      text-decoration:none; cursor:pointer;
      overflow:hidden; min-width:0;
      border-radius:10px;
      padding:2px 4px;
      transition: background 0.15s ease;
    }
    .coop-rail-logo:hover{ background:var(--surface-hover, #212639); }

    .coop-rail-logo-mark{
      flex:0 0 auto; width:26px; height:26px; border-radius:8px;
      display:flex; align-items:center; justify-content:center;
      background:var(--bg, #0e1016);
      border:1px solid var(--border, #2a3044);
      font-family:'Press Start 2P', monospace;
      font-size:9px; color:var(--rail-accent);
    }

    .coop-rail-logo-label{
      font-family:'IBM Plex Mono', monospace;
      font-size:12px; font-weight:600; letter-spacing:0.02em;
      color:var(--text, #eef1f7);
      white-space:nowrap;
      max-width:0; opacity:0; overflow:hidden;
      transition: max-width 0.26s cubic-bezier(.4,0,.2,1), opacity 0.2s ease;
    }
    .coop-rail.expanded .coop-rail-logo-label{
      max-width:160px; opacity:1;
      transition-delay:0.05s;
    }

    /* ---------- Nav ---------- */

    nav.coop-rail-nav{
      display:flex; flex-direction:column; gap:4px;
      overflow-y:auto; overflow-x:hidden;
      flex:1; min-height:0;
    }
    nav.coop-rail-nav::-webkit-scrollbar{ width:5px; }
    nav.coop-rail-nav::-webkit-scrollbar-track{ background:transparent; }
    nav.coop-rail-nav::-webkit-scrollbar-thumb{ background:var(--text-faint, #5e6478); border-radius:3px; }

    .coop-rail-item{
      position:relative;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:3px;
      height:54px; width:100%;
      border-radius:12px;
      color:var(--text-dim, #9aa0b8);
      cursor:pointer; background:none; border:none;
      text-decoration:none;
      font-family:'Space Grotesk', sans-serif;
      font-weight:600;
      flex-shrink:0;
      transition: background 0.15s ease, color 0.15s ease, flex-direction 0.15s ease;
    }
    .coop-rail.expanded .coop-rail-item{
      flex-direction:row; justify-content:flex-start; gap:12px;
      height:42px; padding:0 10px;
    }

    .coop-rail-item:hover{ background:var(--surface-hover, #212639); color:var(--text, #eef1f7); }
    .coop-rail-item.active{
      color:var(--text, #eef1f7);
      background: var(--surface-hover, #212639);
    }
    .coop-rail-item.active::before{
      content:""; position:absolute; left:6px; right:6px; top:-1px; height:3px;
      border-radius:0 0 4px 4px;
      background: var(--rail-accent);
    }
    .coop-rail.expanded .coop-rail-item.active::before{
      content:""; position:absolute; left:-1px; right:auto; top:8px; bottom:8px; width:3px; height:auto;
      border-radius:4px;
    }

    .coop-rail-item .icon{
      flex:0 0 auto; width:20px; height:20px;
      display:flex; align-items:center; justify-content:center;
    }
    .coop-rail-item .icon svg{ width:19px; height:19px; }

    .rail-label{
      font-size:9.5px;
      font-family:'IBM Plex Mono', monospace;
      letter-spacing:0.02em;
      white-space:nowrap;
    }
    .coop-rail.expanded .rail-label{ display:none; }

    .nav-label{
      font-size:13.5px;
      white-space:nowrap;
      max-width:0; opacity:0; overflow:hidden;
      transition: max-width 0.26s cubic-bezier(.4,0,.2,1), opacity 0.2s ease;
    }
    .coop-rail.expanded .nav-label{
      max-width:140px; opacity:1;
      transition-delay:0.05s;
    }

    .coop-rail-badge{
      margin-left:auto; min-width:17px; height:17px; padding:0 5px;
      border-radius:9px; background:var(--rail-heart);
      color:#1b0508;
      font-family:'IBM Plex Mono', monospace;
      font-size:9.5px; font-weight:700;
      display:none; align-items:center; justify-content:center;
      flex-shrink:0;
    }
    .coop-rail.expanded .coop-rail-badge{ display:flex; }

    /* ---------- Favorites row + chevron + dropdown ---------- */

    .coop-rail-fav-row{ position:relative; flex-shrink:0; }

    .coop-rail-chevron-btn{
      position:absolute; right:6px; top:50%; transform:translateY(-50%);
      width:22px; height:22px; border-radius:6px;
      display:none; align-items:center; justify-content:center;
      background:none; border:none; color:var(--text-faint, #5e6478); cursor:pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .coop-rail-chevron-btn:hover{ background:var(--surface, #1b1f2e); color:var(--text, #eef1f7); }
    .coop-rail.expanded .coop-rail-chevron-btn{ display:flex; }
    .coop-rail-chevron-btn svg{
      width:14px; height:14px;
      transition: transform 0.18s ease;
    }
    .coop-rail-fav-row.open .coop-rail-chevron-btn svg{ transform:rotate(180deg); }

    .coop-rail-following{
      overflow:hidden; max-height:0; opacity:0;
      transition: max-height 0.26s cubic-bezier(.4,0,.2,1), opacity 0.2s ease;
    }
    .coop-rail-fav-row.open + .coop-rail-following{
      max-height:240px; overflow-y:auto; opacity:1;
    }
    .coop-rail:not(.expanded) .coop-rail-following{
      max-height:0 !important; opacity:0 !important;
    }
    .coop-rail-following::-webkit-scrollbar{ width:5px; }
    .coop-rail-following::-webkit-scrollbar-track{ background:transparent; }
    .coop-rail-following::-webkit-scrollbar-thumb{ background:var(--text-faint, #5e6478); border-radius:3px; }

    .coop-rail-follow-item{
      display:flex; align-items:center; gap:10px;
      padding:7px 8px 7px 14px;
      margin:1px 0;
      border-radius:10px;
      color:var(--text-dim, #9aa0b8);
      text-decoration:none;
      font-size:12px;
      white-space:nowrap;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .coop-rail-follow-item:hover{ background:var(--surface-hover, #212639); color:var(--text, #eef1f7); }
    .coop-rail-follow-thumb{
      width:34px; height:22px; border-radius:6px;
      object-fit:cover; object-position:center; flex-shrink:0;
      background:var(--bg-alt, #151824);
      border:1px solid var(--border, #2a3044);
    }
    .coop-rail-follow-thumb-fallback{
      width:34px; height:22px; border-radius:6px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      background:var(--bg-alt, #151824);
      border:1px solid var(--border, #2a3044);
      font-family:'Press Start 2P', monospace; font-size:8px;
      color:var(--text-faint, #5e6478);
    }
    .coop-rail-follow-name{ overflow:hidden; text-overflow:ellipsis; }
    .coop-rail-empty{
      padding:8px 14px 14px; font-size:11px; line-height:1.5;
      color:var(--text-faint, #5e6478); white-space:normal;
    }

    @media (max-width:640px){
      body{ padding-left:24px !important; padding-bottom:78px !important; }
      .coop-rail{
        top:auto; bottom:0; left:0; right:0; height:64px; width:100% !important;
        flex-direction:row; align-items:center; justify-content:space-around;
        padding:0 6px; border:none; border-top:1px solid var(--border, #2a3044);
        border-radius:18px 18px 0 0;
        box-shadow:0 -8px 24px rgba(0,0,0,0.3);
      }
      .coop-rail-header, .coop-rail-following{ display:none; }
      nav.coop-rail-nav{ flex-direction:row; padding:0; gap:0; width:100%; justify-content:space-around; overflow:visible; }
      .coop-rail-item{
        flex-direction:column; gap:2px; width:auto; height:auto; padding:8px 12px;
        font-size:9.5px; text-align:center; border-radius:14px;
      }
      .coop-rail-item.active::before{ left:10px; right:10px; top:-1px; bottom:auto; height:3px; border-radius:0 0 4px 4px; }
      .coop-rail-badge{ display:flex; position:absolute; top:2px; right:4px; }
      .coop-rail-chevron-btn{ display:none !important; }
      .theme-panel{ top:auto !important; bottom:76px !important; left:16px !important; }
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
      <div class="coop-rail-header">
        <button type="button" class="coop-rail-menu-btn" id="coopRailMenuBtn" aria-label="Expand or collapse the sidebar" title="Expand or collapse the sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <a class="coop-rail-logo" href="coop-library.html" aria-label="Co-op Library home">
          <span class="coop-rail-logo-mark">CL</span>
          <span class="coop-rail-logo-label">Co-op Library</span>
        </a>
      </div>

      <nav class="coop-rail-nav">
        <a class="coop-rail-item${isHome ? " active" : ""}" href="coop-library.html" data-page="home">
          <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg></span>
          <span class="rail-label">Home</span>
          <span class="nav-label">Home</span>
        </a>

        <a class="coop-rail-item coop-rail-fav-row${isFav ? " active" : ""}" href="favorites.html" data-page="favorites" id="coopRailFavRow">
          <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></span>
          <span class="rail-label">Favorites</span>
          <span class="nav-label">Favorites</span>
          <span class="coop-rail-badge" id="coopRailBadge">0</span>
          <button type="button" class="coop-rail-chevron-btn" id="coopRailChevronBtn" aria-label="Show favorited games" title="Show favorited games">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </a>
        <div class="coop-rail-following" id="coopRailFollowing"></div>

        <button type="button" class="coop-rail-item" id="coopRailSettings">
          <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
          <span class="rail-label">Settings</span>
          <span class="nav-label">Settings</span>
        </button>
      </nav>
    `;
    document.body.appendChild(rail);

    const menuBtn = document.getElementById("coopRailMenuBtn");
    const favRow = document.getElementById("coopRailFavRow");
    const chevronBtn = document.getElementById("coopRailChevronBtn");

    function setExpanded(isExpanded) {
      rail.classList.toggle("expanded", isExpanded);
      saveExpanded(isExpanded);
    }

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setExpanded(!rail.classList.contains("expanded"));
    });

    // Favorites row is a real link to favorites.html — clicking the
    // row itself (icon or label) navigates there, same as Home. The
    // chevron is the one exception: it opens/closes the dropdown of
    // favorited games in place, without leaving the page.
    if (getSavedFavOpen()) favRow.classList.add("open");

    chevronBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // The dropdown only has room to show itself once the rail is
      // expanded, so opening it also expands the rail.
      if (!rail.classList.contains("expanded")) {
        setExpanded(true);
      }
      const isOpen = favRow.classList.toggle("open");
      saveFavOpen(isOpen);
    });

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
    injectStyle();
    build();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
