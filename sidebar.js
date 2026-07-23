/**
 * sidebar.js
 * -----------------------------------------------------------------
 * Site-wide left nav rail — collapsed icon strip that expands into
 * a full panel on click (design supplied by user).
 *
 *   Logo      -> coop-library.html   (always, click anywhere on it)
 *   Home      -> coop-library.html
 *   Favorites -> favorites.html (clicking the row navigates there);
 *                the chevron on that row instead opens/closes a
 *                dropdown of every game you've favorited.
 *   Settings  -> opens the existing theme.js panel
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

  const RAIL_WIDTH = 80;
  const PANEL_WIDTH = 240;
  const EXPANDED_KEY = "coopRailExpanded";
  const FAV_OPEN_KEY = "coopRailFavOpen";

  const SIDEBAR_I18N = {
    en: {
      toggleMenu: "Toggle menu",
      brandHome: "Co-op Library home",
      home: "Home",
      settings: "Settings",
      favorites: "Favorites",
      showFavorites: "Show favorited games",
      favoritesEmpty: "Heart a game from its info page and it'll show up here."
    },
    fr: {
      toggleMenu: "Afficher/masquer le menu",
      brandHome: "Accueil de Co-op Library",
      home: "Accueil",
      settings: "Paramètres",
      favorites: "Favoris",
      showFavorites: "Afficher les jeux favoris",
      favoritesEmpty: "Ajoutez un jeu depuis sa fiche pour le voir apparaître ici."
    }
  };
  function sidebarLang() {
    return window.CoopLang ? window.CoopLang.get() : "en";
  }

  function getSaved(key) {
    try {
      return localStorage.getItem(key) === "1";
    } catch (e) {
      return false;
    }
  }
  function saveFlag(key, val) {
    try {
      localStorage.setItem(key, val ? "1" : "0");
    } catch (e) {
      /* ignore — e.g. storage disabled */
    }
  }

  const STYLE = `
    @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500&display=swap");

    /* Reclaim the space the old floating gear button used to reserve,
       and hide that button — the rail's own gear icon replaces it. */
    body{ padding-top:24px !important; padding-left:${RAIL_WIDTH + 16}px !important; }
    .theme-menu-btn{ display:none !important; }
    .theme-panel{ top:16px !important; left:${RAIL_WIDTH + 16}px !important; }

    .coop-sidebar{
      --bg: rgba(15,15,15,0.82);
      --panel: rgba(0,0,0,0.82);
      --hover: #272727;
      --active: #333333;
      --text: #ffffff;
      --text-dim: #aaaaaa;
      --accent: #3ea6ff;

      --rail-width: ${RAIL_WIDTH}px;
      --panel-width: ${PANEL_WIDTH}px;

      --t-fast: 0.15s ease;
      --t-panel: 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      --t-panel-delay: 0.08s;

      position: fixed;
      top: 0; left: 0; bottom: 0;
      width: var(--rail-width);
      z-index: 950;
      background-color: var(--bg);
      -webkit-backdrop-filter: blur(14px);
      backdrop-filter: blur(14px);
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow: hidden;
      font-family: "Roboto", sans-serif;
      box-shadow: 0 0 0 rgba(0,0,0,0);
      transition: width var(--t-panel), background-color var(--t-panel), box-shadow var(--t-panel);
    }
    .coop-sidebar *,
    .coop-sidebar *::before,
    .coop-sidebar *::after{
      margin: 0; padding: 0; box-sizing: border-box;
    }

    .coop-sidebar.expanded {
      width: var(--panel-width);
      padding: 12px 12px;
      background-color: var(--panel);
      box-shadow: 8px 0 24px rgba(0,0,0,0.4);
    }

    .coop-sidebar .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 40px;
      margin-bottom: 12px;
      flex-shrink: 0;
    }
    .coop-sidebar.expanded .sidebar-header {
      justify-content: flex-start;
    }

    .coop-sidebar .icon-btn {
      width: 40px;
      height: 40px;
      min-width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      background: none;
      color: var(--text);
      transition: background-color var(--t-fast);
    }
    .coop-sidebar .icon-btn:hover {
      background-color: var(--hover);
    }
    .coop-sidebar .icon-btn svg {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }

    .coop-sidebar .sidebar-brand{
      display: flex;
      align-items: center;
      text-decoration: none;
      cursor: pointer;
      overflow: hidden;
      min-width: 0;
      border-radius: 8px;
    }
    .coop-sidebar .sidebar-brand:hover .logo-mark{ filter: brightness(1.15); }

    .coop-sidebar .logo-mark {
      width: 28px;
      height: 28px;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-left: 4px;
      opacity: 0;
      overflow: hidden;
      transition: width var(--t-panel), opacity var(--t-panel), margin-left var(--t-panel);
    }
    .coop-sidebar .logo-mark svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .coop-sidebar.expanded .logo-mark {
      width: 28px;
      opacity: 1;
      transition-delay: var(--t-panel-delay);
    }
    .coop-sidebar:not(.expanded) .logo-mark {
      width: 0;
      margin-left: 0;
    }

    .coop-sidebar .brand-label {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      margin-left: 8px;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
      color: var(--text);
      transition: max-width var(--t-panel), opacity var(--t-panel);
    }
    .coop-sidebar.expanded .brand-label {
      max-width: 160px;
      opacity: 1;
      transition-delay: var(--t-panel-delay);
    }

    /* ---------- Nav items ---------- */

    .coop-sidebar .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .coop-sidebar .sidebar-nav::-webkit-scrollbar{ width: 5px; }
    .coop-sidebar .sidebar-nav::-webkit-scrollbar-track{ background: transparent; }
    .coop-sidebar .sidebar-nav::-webkit-scrollbar-thumb{ background: var(--hover); border-radius: 3px; }

    .coop-sidebar .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 56px;
      border-radius: 10px;
      cursor: pointer;
      color: var(--text);
      text-decoration: none;
      background: none;
      border: none;
      width: 100%;
      font-family: "Roboto", sans-serif;
      position: relative;
      flex-shrink: 0;
      transition: background-color var(--t-fast), flex-direction var(--t-fast);
    }
    .coop-sidebar.expanded .nav-item {
      flex-direction: row;
      justify-content: flex-start;
      height: 44px;
      padding: 0 4px;
    }

    .coop-sidebar .nav-item:hover {
      background-color: var(--hover);
    }
    .coop-sidebar .nav-item.active {
      background-color: var(--active);
    }

    .coop-sidebar .nav-icon {
      width: 40px;
      min-width: 40px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--text);
    }
    .coop-sidebar.expanded .nav-icon {
      width: 40px;
      height: 40px;
    }
    .coop-sidebar .nav-icon svg {
      width: 22px;
      height: 22px;
    }

    .coop-sidebar .rail-label {
      font-size: 10px;
      color: var(--text-dim);
      margin-top: 4px;
      white-space: nowrap;
      transition: opacity var(--t-fast);
    }
    .coop-sidebar.expanded .rail-label {
      display: none;
    }

    .coop-sidebar .nav-label {
      font-size: 14px;
      white-space: nowrap;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
      transition: max-width var(--t-panel), opacity var(--t-panel);
    }
    .coop-sidebar.expanded .nav-label {
      max-width: 160px;
      opacity: 1;
      margin-left: 4px;
      transition-delay: var(--t-panel-delay);
    }

    .coop-sidebar .nav-badge{
      margin-left: auto;
      margin-right: 8px;
      min-width: 17px; height: 17px; padding: 0 5px;
      border-radius: 9px;
      background: var(--accent);
      color: #06131f;
      font-size: 10px; font-weight: 700;
      display: none;
      align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .coop-sidebar.expanded .nav-badge{ display: flex; }

    .coop-sidebar .chevron-btn{
      display: none;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      margin-left: auto;
      margin-right: 4px;
      flex-shrink: 0;
      background: none;
      border: none;
      border-radius: 6px;
      color: var(--text-dim);
      cursor: pointer;
    }
    .coop-sidebar .chevron-btn:hover{ background: var(--active); color: var(--text); }
    .coop-sidebar.expanded .chevron-btn{ display: flex; }
    .coop-sidebar .chevron {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      transition: transform var(--t-fast);
    }
    .coop-sidebar #favoritesToggle.open .chevron {
      transform: rotate(180deg);
    }

    /* ---------- Favorites / subscriptions list ---------- */

    .coop-sidebar .favorites-list {
      overflow: hidden;
      max-height: 0;
      opacity: 0;
      flex-shrink: 0;
      transition: max-height var(--t-panel), opacity var(--t-panel);
    }
    .coop-sidebar .favorites-list.open {
      max-height: 280px;
      overflow-y: auto;
      opacity: 1;
    }
    .coop-sidebar:not(.expanded) .favorites-list {
      max-height: 0 !important;
      opacity: 0 !important;
    }
    .coop-sidebar .favorites-list::-webkit-scrollbar{ width: 5px; }
    .coop-sidebar .favorites-list::-webkit-scrollbar-track{ background: transparent; }
    .coop-sidebar .favorites-list::-webkit-scrollbar-thumb{ background: var(--hover); border-radius: 3px; }

    .coop-sidebar .favorite-row {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 40px;
      padding: 0 8px 0 12px;
      border-radius: 10px;
      cursor: pointer;
      text-decoration: none;
      font-size: 13px;
      color: var(--text-dim);
      transition: background-color var(--t-fast);
    }
    .coop-sidebar .favorite-row:hover {
      background-color: var(--hover);
      color: var(--text);
    }
    .coop-sidebar .favorite-row .avatar {
      position: relative;
      width: 38px;
      height: 18px;
      border-radius: 5px;
      background-color: #3f3f3f;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      flex-shrink: 0;
      overflow: hidden;
      color: var(--text);
    }
    .coop-sidebar .favorite-row .avatar img{
      width: 100%; height: 100%; object-fit: cover;
    }
    .coop-sidebar .favorite-row span.name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .coop-sidebar .favorites-empty{
      padding: 8px 12px 12px;
      font-size: 11.5px;
      line-height: 1.5;
      color: var(--text-dim);
      white-space: normal;
    }

    @media (max-width: 640px) {
      body{ padding-left: 16px !important; padding-bottom: 74px !important; }
      .coop-sidebar{
        top: auto; bottom: 0; left: 0; right: 0;
        width: 100% !important;
        height: 62px;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        padding: 0 4px;
        background-color: var(--bg);
      }
      .coop-sidebar .sidebar-header, .coop-sidebar .favorites-list { display: none; }
      .coop-sidebar .sidebar-nav{
        flex-direction: row;
        overflow: visible;
        width: 100%;
        justify-content: space-around;
        gap: 0;
      }
      .coop-sidebar .nav-item{
        width: auto;
        height: auto;
        padding: 8px 14px;
        flex-direction: column;
        gap: 3px;
      }
      .coop-sidebar .chevron-btn{ display: none !important; }
      .theme-panel{ top: auto !important; bottom: 74px !important; left: 16px !important; }
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

  function renderFavorites() {
    const list = document.getElementById("favoritesList");
    const badge = document.getElementById("favoritesBadge");
    if (!list) return;
    const favorites = getFavorites();

    if (badge) {
      badge.textContent = favorites.length > 99 ? "99+" : String(favorites.length);
      badge.style.display = favorites.length > 0 ? "flex" : "none";
    }

    if (favorites.length === 0) {
      list.innerHTML = `<div class="favorites-empty">${SIDEBAR_I18N[sidebarLang()].favoritesEmpty}</div>`;
      return;
    }

    list.innerHTML = favorites.map(g => {
      const name = (g.name || "Untitled").replace(/</g, "&lt;");
      const url = g.infoUrl || g.steamUrl || "favorites.html";
      const avatar = g.img
        ? `<img src="${g.img}" alt="" loading="lazy" onerror="this.parentElement.textContent='${name.charAt(0)}'">`
        : name.charAt(0);
      return `
        <a class="favorite-row" href="${url}">
          <span class="avatar">${avatar}</span>
          <span class="name">${name}</span>
        </a>`;
    }).join("");
  }

  function build() {
    const t = SIDEBAR_I18N[sidebarLang()];
    const sidebar = document.createElement("aside");
    sidebar.className = "coop-sidebar" + (getSaved(EXPANDED_KEY) ? " expanded" : "");
    sidebar.id = "sidebar";
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <button class="icon-btn" id="menuBtn" aria-label="${t.toggleMenu}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <a class="sidebar-brand" href="coop-library.html" aria-label="${t.brandHome}">
          <span class="logo-mark"><svg viewBox="0 0 3162 2105" xmlns="http://www.w3.org/2000/svg"><path d="M 1691,1122 L 1679,1125 L 1670,1138 L 1650,1147 L 1624,1172 L 1588,1194 L 1415,1332 L 1298,1417 L 1288,1430 L 1263,1444 L 1254,1457 L 1200,1493 L 1185,1511 L 1148,1534 L 1103,1575 L 943,1696 L 928,1714 L 836,1781 L 821,1799 L 746,1853 L 736,1869 L 1709,1841 Z M 1647,1214 L 1659,1777 L 1655,1796 L 1549,1795 L 1540,1799 L 1471,1797 L 1354,1803 L 1325,1800 L 1324,1804 L 1285,1801 L 1245,1806 L 1128,1805 L 1092,1810 L 1071,1807 L 906,1815 L 882,1811 L 953,1754 L 955,1748 L 971,1741 L 973,1735 L 1055,1673 L 1061,1664 L 1359,1434 L 1378,1414 L 1413,1392 L 1634,1218 Z M 739,231 L 740,237 L 760,247 L 912,369 L 919,369 L 999,436 L 1031,454 L 1127,533 L 1135,533 L 1149,550 L 1169,560 L 1260,633 L 1267,633 L 1277,646 L 1301,659 L 1306,668 L 1618,902 L 1625,902 L 1635,915 L 1677,945 L 1690,948 L 1691,249 Z M 887,286 L 1644,298 L 1643,857 L 1634,857 L 1624,845 L 1613,841 L 1341,632 L 1306,610 L 1087,440 L 1058,422 L 1031,397 L 993,372 L 965,346 L 941,332 L 926,316 L 893,296 Z M 57,96 L 42,2001 L 283,1780 L 294,1156 L 1371,1147 L 464,1848 L 462,2065 L 2649,1988 L 2880,1768 L 1869,1787 L 1858,1144 L 2978,1137 L 3133,934 L 1851,924 L 1853,302 L 2854,319 L 2644,105 L 472,39 L 474,252 L 1370,924 L 296,926 L 293,318 Z M 109,213 L 239,330 L 239,973 L 1503,974 L 525,233 L 522,94 L 2624,147 L 2741,268 L 1805,251 L 1804,974 L 3048,977 L 2959,1094 L 1805,1099 L 1822,1835 L 2771,1817 L 2637,1943 L 519,2012 L 522,1865 L 1504,1100 L 250,1108 L 229,1764 L 96,1883 Z" fill="#1E6EFF" fill-rule="evenodd"/></svg></span>
          <span class="brand-label">Co-op Library</span>
        </a>
      </div>

      <nav class="sidebar-nav">
        <a class="nav-item${isHome ? " active" : ""}" href="coop-library.html" data-page="home">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>
          </span>
          <span class="rail-label" data-sidebar-t="home">${t.home}</span>
          <span class="nav-label" data-sidebar-t="home">${t.home}</span>
        </a>

        <button type="button" class="nav-item" id="settingsBtn">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </span>
          <span class="rail-label" data-sidebar-t="settings">${t.settings}</span>
          <span class="nav-label" data-sidebar-t="settings">${t.settings}</span>
        </button>

        <a class="nav-item${isFav ? " active" : ""}" href="favorites.html" id="favoritesToggle" data-page="favorites">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          </span>
          <span class="rail-label" data-sidebar-t="favorites">${t.favorites}</span>
          <span class="nav-label" data-sidebar-t="favorites">${t.favorites}</span>
          <span class="nav-badge" id="favoritesBadge">0</span>
          <button type="button" class="chevron-btn" id="favoritesChevronBtn" aria-label="${t.showFavorites}" title="${t.showFavorites}">
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </a>

        <div class="favorites-list" id="favoritesList">
          <!-- populated below -->
        </div>
      </nav>
    `;
    document.body.appendChild(sidebar);

    const menuBtn = document.getElementById("menuBtn");
    const favoritesToggle = document.getElementById("favoritesToggle");
    const favoritesChevronBtn = document.getElementById("favoritesChevronBtn");
    const favoritesList = document.getElementById("favoritesList");

    function setExpanded(isExpanded) {
      sidebar.classList.toggle("expanded", isExpanded);
      saveFlag(EXPANDED_KEY, isExpanded);
    }

    menuBtn.addEventListener("click", function () {
      setExpanded(!sidebar.classList.contains("expanded"));
    });

    // The Favorites row is a real link to favorites.html — clicking the
    // icon or label navigates there, same as Home. The chevron is the
    // one exception: it opens/closes the dropdown of favorited games
    // in place, without leaving the page.
    if (getSaved(FAV_OPEN_KEY)) {
      favoritesToggle.classList.add("open");
      favoritesList.classList.add("open");
    }

    favoritesChevronBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      // Opening favorites should also expand the sidebar, since the
      // list only has room to show itself in the expanded layout.
      if (!sidebar.classList.contains("expanded")) {
        setExpanded(true);
      }
      const isOpen = favoritesToggle.classList.toggle("open");
      favoritesList.classList.toggle("open", isOpen);
      saveFlag(FAV_OPEN_KEY, isOpen);
    });

    const settingsBtn = document.getElementById("settingsBtn");
    settingsBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const originalBtn = document.querySelector(".theme-menu-btn");
      if (originalBtn) originalBtn.click();
    });

    // Mirror the real theme-panel's open/closed state onto Settings so
    // it lights up (active pill) exactly while the panel is visible,
    // then clears the moment it's dismissed. Only one item should ever
    // look "active" — Home/Favorites get their active state baked in
    // at build time based on the current page, so while Settings is
    // open we temporarily switch that page item's highlight off.
    const pageActiveItem = sidebar.querySelector(".nav-item.active:not(#settingsBtn)");
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

    renderFavorites();
  }

  function retranslateSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    const t = SIDEBAR_I18N[sidebarLang()];
    const menuBtn = document.getElementById("menuBtn");
    if (menuBtn) menuBtn.setAttribute("aria-label", t.toggleMenu);
    const brand = sidebar.querySelector(".sidebar-brand");
    if (brand) brand.setAttribute("aria-label", t.brandHome);
    sidebar.querySelectorAll('[data-sidebar-t]').forEach(el => {
      el.textContent = t[el.dataset.sidebarT];
    });
    const chevronBtn = document.getElementById("favoritesChevronBtn");
    if (chevronBtn) {
      chevronBtn.setAttribute("aria-label", t.showFavorites);
      chevronBtn.setAttribute("title", t.showFavorites);
    }
    renderFavorites();
  }

  window.addEventListener("coopFavoritesChanged", renderFavorites);
  window.addEventListener("coopLangChanged", retranslateSidebar);
  window.addEventListener("storage", (e) => {
    if (e.key === "coopLibraryFavorites") renderFavorites();
    if (e.key === "coopLibraryLang") retranslateSidebar();
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
