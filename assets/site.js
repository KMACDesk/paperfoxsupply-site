/* Paper Fox Supply mall: day/night, atrium loop, floor map, filters, search. No third-party code. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---- day / night switch */
  var btn = $("#modebtn");
  function isNight() { return root.getAttribute("data-mode") === "dark"; }
  function paint() {
    if (!btn) return;
    btn.setAttribute("aria-checked", isNight() ? "true" : "false");
    var l = $(".lbl", btn); if (l) l.textContent = isNight() ? "Night" : "Day";
  }
  /* ---- atrium hero loop: only the active mode's video is fetched; skipped for reduced motion or data saver */
  var conn = navigator.connection || {};
  var canPlay = !reduce && !conn.saveData;
  function playAtrium() {
    $$("video.am").forEach(function (v) {
      var active = v.classList.contains(isNight() ? "night" : "day");
      if (!active) { try { v.pause(); } catch (e) {} return; }
      if (!canPlay) return;
      if (!v.getAttribute("data-ready")) {
        [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (t) {
          var s = document.createElement("source"); s.src = v.getAttribute("data-" + t[0]); s.type = t[1]; v.appendChild(s);
        });
        v.setAttribute("data-ready", "1"); v.load();
      }
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
  }
  if (btn) {
    paint();
    btn.addEventListener("click", function () {
      var n = isNight() ? "light" : "dark";
      root.setAttribute("data-mode", n);
      try { localStorage.setItem("pfs-mode", n); } catch (e) {}
      paint(); playAtrium();
    });
  }
  playAtrium();

  /* ---- floor map dialog */
  var dlg = $("#map");
  $$("[data-map]").forEach(function (b) {
    b.addEventListener("click", function (ev) {
      if (!dlg) return;
      ev.preventDefault();
      if (dlg.showModal) { dlg.showModal(); } else { dlg.setAttribute("open", ""); }
    });
  });
  if (dlg) dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });

  /* ---- store filter chips + search */
  $$("[data-filter]").forEach(function (bar) {
    bar.hidden = false;
    var scope = bar.closest(".wrap"), input = $("input", bar), items = $$(".item", scope), none = $(".nores", bar), f = "all";
    function run() {
      var q = (input.value || "").toLowerCase().trim(), shown = 0;
      items.forEach(function (it) {
        var ok = true;
        if (f.indexOf("g:") === 0) ok = it.getAttribute("data-group") === f.slice(2);
        if (f.indexOf("s:") === 0) ok = it.getAttribute("data-status") === f.slice(2);
        if (ok && q) ok = it.getAttribute("data-name").indexOf(q) > -1;
        it.hidden = !ok; if (ok) shown++;
      });
      $$(".shelfrow", scope).forEach(function (r) { r.hidden = !$$(".item:not([hidden])", r).length; });
      if (none) none.hidden = shown > 0;
    }
    input.addEventListener("input", run);
    $$(".chip", bar).forEach(function (c) {
      c.addEventListener("click", function () {
        $$(".chip", bar).forEach(function (o) { o.classList.remove("on"); });
        c.classList.add("on"); f = c.getAttribute("data-f"); run();
      });
    });
  });

  /* ---- mall-wide search (front stores only) */
  var index = null;
  function load(cb) {
    if (index) return cb();
    fetch("/assets/search.json").then(function (r) { return r.json(); }).then(function (j) { index = j; cb(); }).catch(function () { index = []; cb(); });
  }
  $$("[data-search]").forEach(function (form) {
    var input = $("input", form), list = $(".results", form);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function run() {
      var q = input.value.toLowerCase().trim();
      if (!q) { list.innerHTML = ""; return; }
      load(function () {
        var words = q.split(/\s+/), hits = index.filter(function (p) {
          var h = (p.n + " " + p.t + " " + p.s + " " + p.x).toLowerCase();
          return words.every(function (w) { return h.indexOf(w) > -1; });
        }).slice(0, 6);
        list.innerHTML = hits.length ? hits.map(function (p) {
          return '<li><a href="' + p.u + '"><b>' + esc(p.n) + '</b><span>' + esc(p.s) + (p.k === "soon" ? " / Coming soon" : "") + "</span></a></li>";
        }).join("") : '<li class="none">Nothing found. Try another word.</li>';
      });
    }
    input.addEventListener("input", run);
  });
})();
