(function () {
  // Only rewrite URLs on a real web server (not local file double-click).
  if (location.protocol !== "http:" && location.protocol !== "https:") return;

  var path = location.pathname;
  if (!/\.html$/i.test(path)) return;

  var clean = path.replace(/\/index\.html$/i, "/").replace(/\.html$/i, "");
  if (clean === path) return;
  location.replace(clean + location.search + location.hash);
})();
