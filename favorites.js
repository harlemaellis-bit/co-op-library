/**
 * favorites.js
 * -----------------------------------------------------------------
 * Site-wide wishlist/favorites storage. Fully self-contained — just
 * include this on any page BEFORE sidebar.js or any page-specific
 * script that wants to read/write favorites:
 *
 *   <script src="favorites.js"></script>
 *
 * Exposes window.CoopFavorites with:
 *   getAll()          -> array of saved game objects
 *   isFavorite(id)     -> bool
 *   add(game)          -> adds { id, name, tagline, img, steamUrl, infoUrl }
 *   remove(id)         -> removes by id
 *   toggle(game)       -> adds if missing / removes if present, returns new bool state
 *   count()            -> number of saved favorites
 *
 * Saved in localStorage under "coopLibraryFavorites", so it persists
 * across pages and future visits. Fires a "coopFavoritesChanged"
 * window event on every change so other UI (like the sidebar badge)
 * can react without a page reload.
 * -----------------------------------------------------------------
 */
(function () {
  const KEY = "coopLibraryFavorites";

  function getAll() {
    try {
      const raw = localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveAll(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      // storage full or unavailable — fail silently, nothing to persist
    }
    window.dispatchEvent(new CustomEvent("coopFavoritesChanged", { detail: { favorites: list } }));
  }

  function isFavorite(id) {
    return getAll().some(g => String(g.id) === String(id));
  }

  function add(game) {
    if (!game || game.id === undefined || game.id === null) return;
    const list = getAll();
    if (!list.some(g => String(g.id) === String(game.id))) {
      list.push(game);
      saveAll(list);
    }
  }

  function remove(id) {
    const list = getAll().filter(g => String(g.id) !== String(id));
    saveAll(list);
  }

  function toggle(game) {
    if (isFavorite(game.id)) {
      remove(game.id);
      return false;
    }
    add(game);
    return true;
  }

  function count() {
    return getAll().length;
  }

  window.CoopFavorites = { getAll, add, remove, toggle, isFavorite, count };
})();
