/**
 * sidebar.js
 * -----------------------------------------------------------------
 * Site-wide collapsible left nav rail, YouTube-guide style:
 *
 *   ☰  — pull tab, expands/collapses the rail
 *   🏠 — Home        -> coop-library.html
 *   ♥  — Favorites   -> favorites.html
 *   ⚙  — Settings    -> opens the existing theme.js panel
 *   ────────────────
 *   FOLLOWING
 *   [icon] Game name  -> one row per saved favorite, click to open it
 *
 * Collapsed = icon-only strip pinned to the left edge. Clicking the
 * ☰ pull tab slides it out wider (as a translucent overlay over the
 * page, matching the site's glass/blur look) to reveal labels and
 * the full list of followed games, the same way YouTube's sidebar
 * reveals your subscriptions when expanded.
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

  const STYLE = `
    /* Reclaim the space the old floating gear button used to reserve,
       and hide that button — the rail's own gear icon replaces it. */
    body{ padding-top:32px !important; padding-left:68px !important; }
    .theme-menu-btn{ display:none !important; }
    .theme-panel{ top:16px !important; left:76px !important; }

    .coop-rail{
      position:fixed; top:0; left:0; bottom:0;
      width:60px;
      z-index:950;
      display:flex;
      flex-direction:column;
      background: color-mix(in srgb, var(--surface, #1b1f2e) 60%, transparent);
      border-right:1px solid var(--border, #2a3044);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      transition: width 0.22s ease;
      overflow:hidden;
    }
    .coop-rail.expanded{
      width:248px;
      box-shadow:10px 0 34px rgba(0,0,0,0.35);
    }

    .coop-rail-toggle, .coop-rail-item{
      display:flex; align-items:center; gap:14px;
      width:100%;
      padding:13px 18px;
      background:none; border:none;
      cursor:pointer; text-decoration:none;
      font-family:'Space Grotesk', sans-serif;
      font-weight:600; font-size:13.5px;
      color:var(--text-dim, #9aa0b8);
      white-space:nowrap;
      flex-shrink:0;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .coop-rail-toggle{ color:var(--text, #eef1f7); font-size:17px; padding:18px; margin-bottom:4px; }
    .coop-rail-item .icon, .coop-rail-toggle .icon{ width:22px; text-align:center; flex-shrink:0; font-size:17px; line-height:1; }
    .coop-rail-item .label, .coop-rail-toggle .label{
      opacity:0; transition:opacity 0.15s ease; font-size:13.5px;
    }
    .coop-rail.expanded .coop-rail-item .label,
    .coop-rail.expanded .coop-rail-toggle .label{ opacity:1; }

    .coop-rail-item:hover{ background:color-mix(in srgb, var(--surface-hover, #212639) 70%, transparent); color:var(--text, #eef1f7); }
    .coop-rail-toggle:hover{ background:color-mix(in srgb, var(--surface-hover, #212639) 70%, transparent); }
    .coop-rail-item.active{
      color:var(--text, #eef1f7);
      background:color-mix(in srgb, var(--surface-hover, #212639) 55%, transparent);
      border-left:3px solid var(--heart-accent, #ff6b81);
      padding-left:15px;
    }

    .coop-rail-badge{
      margin-left:auto;
      min-width:18px; height:18px; padding:0 5px;
      border-radius:9px;
      background:var(--heart-accent, #ff6b81);
      color:#fff;
      font-family:'IBM Plex Mono', monospace;
      font-size:10px; font-weight:700;
      display:none;
      align-items:center; justify-content:center;
      opacity:0;
      transition:opacity 0.15s ease;
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
    .coop-rail.expanded .coop-rail-section-label{ opacity:1; }

    .coop-rail-following{ overflow-y:auto; display:none; }
    .coop-rail.expanded .coop-rail-following{ display:block; }

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
      width:26px; height:26px; border-radius:50%;
      object-fit:cover; flex-shrink:0;
      background:var(--bg-alt, #151824);
      border:1px solid var(--border, #2a3044);
    }
    .coop-rail-follow-thumb-fallback{
      width:26px; height:26px; border-radius:50%; flex-shrink:0;
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

    @media (max-width:640px){
      body{ padding-left:24px !important; padding-bottom:78px !important; }
      .coop-rail{
        top:auto; bottom:0; left:0; right:0; height:60px; width:100% !important;
        flex-direction:row; align-items:center; justify-content:space-around;
        border-right:none; border-top:1px solid var(--border, #2a3044);
        box-shadow:0 -8px 24px rgba(0,0,0,0.3);
      }
      .coop-rail-toggle, .coop-rail-divider, .coop-rail-section-label, .coop-rail-following{ display:none; }
      .coop-rail-item{
        flex-direction:column; gap:2px; width:auto; padding:6px 14px;
        font-size:9.5px; text-align:center;
      }
      .coop-rail-item .label{ opacity:1; }
      .coop-rail-item.active{ border-left:none; border-top:3px solid var(--heart-accent, #ff6b81); padding-left:14px; }
      .coop-rail-badge{ opacity:1; position:absolute; top:2px; right:6px; }
      .theme-panel{ top:auto !important; bottom:72px !important; left:16px !important; }
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
    rail.className = "coop-rail";
    rail.innerHTML = `
      <button type="button" class="coop-rail-toggle" id="coopRailToggle" aria-label="Expand menu" title="Menu">
        <span class="icon">☰</span><span class="label">Menu</span>
      </button>
      <a class="coop-rail-item${isHome ? " active" : ""}" href="coop-library.html">
        <span class="icon">🏠</span><span class="label">Home</span>
      </a>
      <a class="coop-rail-item${isFav ? " active" : ""}" href="favorites.html">
        <span class="icon">♥</span><span class="label">Favorites</span>
        <span class="coop-rail-badge" id="coopRailBadge">0</span>
      </a>
      <button type="button" class="coop-rail-item" id="coopRailSettings" title="Settings">
        <span class="icon">⚙</span><span class="label">Settings</span>
      </button>
      <div class="coop-rail-divider"></div>
      <div class="coop-rail-section-label">Following</div>
      <div class="coop-rail-following" id="coopRailFollowing"></div>
    `;
    document.body.appendChild(rail);

    const toggle = document.getElementById("coopRailToggle");
    toggle.addEventListener("click", () => {
      rail.classList.toggle("expanded");
    });

    document.addEventListener("click", (e) => {
      if (rail.classList.contains("expanded") && !rail.contains(e.target)) {
        rail.classList.remove("expanded");
      }
    });

    document.getElementById("coopRailSettings").addEventListener("click", (e) => {
      e.stopPropagation();
      const originalBtn = document.querySelector(".theme-menu-btn");
      if (originalBtn) originalBtn.click();
    });

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
