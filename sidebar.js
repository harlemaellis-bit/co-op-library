/**
 * sidebar.js
 * -----------------------------------------------------------------
 * Site-wide floating navigation dock, left side of the screen:
 *   - Home button  -> coop-library.html
 *   - Favorites button -> favorites.html (with a badge showing how
 *     many games are currently saved)
 *
 * Semi-transparent and theme-matched: it reads the same --surface /
 * --border / --text CSS variables theme.js writes to :root, so it
 * automatically follows the dark / light / custom wallpaper choice
 * and stays legible over any background.
 *
 * Fully self-contained — just include this on any page:
 *
 *   <script src="favorites.js"></script>
 *   <script src="sidebar.js"></script>
 *
 * (favorites.js first, so the badge count is available. It still
 * works without it, falling back to reading localStorage directly.)
 * -----------------------------------------------------------------
 */
(function () {
  const file = (window.location.pathname.split("/").pop() || "").toLowerCase();
  const isHome = file === "" || file === "coop-library.html" || file === "index.html";
  const isFav = file === "favorites.html";

  const STYLE = `
    .coop-sidebar{
      position:fixed;
      top:50%;
      left:16px;
      transform:translateY(-50%);
      z-index:900;
      display:flex;
      flex-direction:column;
      gap:8px;
      padding:8px;
      border-radius:16px;
      background: color-mix(in srgb, var(--surface, #1b1f2e) 55%, transparent);
      border:1px solid var(--border, #2a3044);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow:0 10px 30px rgba(0,0,0,0.25);
    }
    .coop-sidebar-btn{
      position:relative;
      width:42px; height:42px;
      display:flex; align-items:center; justify-content:center;
      border-radius:11px;
      background:transparent;
      border:1px solid transparent;
      color:var(--text, #eef1f7);
      font-size:18px;
      line-height:1;
      cursor:pointer;
      text-decoration:none;
      transition: all 0.15s ease;
    }
    .coop-sidebar-btn:hover{
      background: color-mix(in srgb, var(--surface-hover, #212639) 75%, transparent);
      border-color:var(--border, #2a3044);
    }
    .coop-sidebar-btn.active{
      background:var(--text, #eef1f7);
      color:var(--bg, #0e1016);
    }
    .coop-sidebar-badge{
      position:absolute; top:-4px; right:-4px;
      min-width:16px; height:16px; padding:0 4px;
      border-radius:8px;
      background:#ff6b81;
      color:#fff;
      font-family:'IBM Plex Mono', 'Space Mono', monospace;
      font-size:9.5px; font-weight:700;
      display:none;
      align-items:center; justify-content:center;
      line-height:1;
      box-shadow:0 0 0 2px var(--surface, #1b1f2e);
    }
    @media (max-width:640px){
      .coop-sidebar{
        top:auto; bottom:16px; left:50%;
        transform:translateX(-50%);
        flex-direction:row;
      }
    }
  `;

  function injectStyle() {
    const s = document.createElement("style");
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function favCount() {
    if (window.CoopFavorites) return window.CoopFavorites.count();
    try {
      const raw = localStorage.getItem("coopLibraryFavorites");
      return raw ? (JSON.parse(raw) || []).length : 0;
    } catch (e) {
      return 0;
    }
  }

  function updateBadge() {
    const badge = document.getElementById("coopSidebarFavBadge");
    if (!badge) return;
    const n = favCount();
    badge.textContent = n > 99 ? "99+" : String(n);
    badge.style.display = n > 0 ? "flex" : "none";
  }

  function build() {
    const dock = document.createElement("div");
    dock.className = "coop-sidebar";
    dock.innerHTML = `
      <a class="coop-sidebar-btn${isHome ? " active" : ""}" href="coop-library.html" aria-label="Home" title="Home">🏠</a>
      <a class="coop-sidebar-btn${isFav ? " active" : ""}" href="favorites.html" aria-label="Favorites" title="Favorites">
        ♥
        <span class="coop-sidebar-badge" id="coopSidebarFavBadge">0</span>
      </a>
    `;
    document.body.appendChild(dock);
    updateBadge();
  }

  window.addEventListener("coopFavoritesChanged", updateBadge);
  window.addEventListener("storage", (e) => {
    if (e.key === "coopLibraryFavorites") updateBadge();
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
