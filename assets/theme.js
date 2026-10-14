/* Day / night. Runs in <head> before first paint so there is no flash. Default = visitor's system setting; the choice is remembered in this browser only. No tracking, no network. */
(function () {
  var root = document.documentElement, mode = null;
  try { var s = localStorage.getItem("pfs-mode"); if (s === "light" || s === "dark") mode = s; } catch (e) {}
  if (!mode) { mode = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light"; }
  root.setAttribute("data-mode", mode);
})();
