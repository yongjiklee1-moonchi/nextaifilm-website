(function () {
  "use strict";

  var DATA_URL = "data/lab.json";

  var grid = document.getElementById("lab-grid");
  var player = document.getElementById("lab-player");
  var playerFrame = document.getElementById("lab-player-frame");
  var playerIdle = document.getElementById("lab-player-idle");

  if (!grid) return;

  var items = [];
  var activeId = "";

  function orderedItems() {
    return items.slice().sort(function (a, b) {
      return Number(a.sort) - Number(b.sort);
    });
  }

  function parseVideo(url) {
    var raw = String(url || "").trim();
    if (!raw) return null;

    var vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d{6,})/i) || raw.match(/^(\d{6,})$/);
    if (vimeo) {
      return {
        type: "vimeo",
        embed: "https://player.vimeo.com/video/" + vimeo[1] + "?autoplay=1&title=0&byline=0&portrait=0"
      };
    }

    var yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/i);
    if (yt) {
      var startMatch = raw.match(/[?&]t=(\d+)/i);
      var embed =
        "https://www.youtube-nocookie.com/embed/" +
        yt[1] +
        "?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0" +
        "&playsinline=1&controls=0&fs=0&disablekb=1&color=white";
      if (startMatch) embed += "&start=" + startMatch[1];
      return {
        type: "youtube",
        embed: embed
      };
    }

    if (/\.(mp4|webm|mov)(\?|$)/i.test(raw) || raw.indexOf("assets/") === 0) {
      return { type: "file", src: raw };
    }

    return { type: "link", href: raw };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cardHtml(item) {
    var linked = !!(item.video && String(item.video).trim());
    var active = item.id === activeId;
    return (
      '<button type="button" class="lab-card' +
      (linked ? " is-linked" : "") +
      (active ? " is-active" : "") +
      '" data-lab-id="' +
      escapeHtml(item.id) +
      '">' +
      '<div class="lab-card__media">' +
      '<img src="' +
      escapeHtml(item.thumb) +
      "?v=20260904a" +
      '" alt="' +
      escapeHtml(item.title) +
      '" width="640" height="360" loading="lazy" decoding="async" />' +
      '<span class="lab-card__play" aria-hidden="true"></span>' +
      '<span class="lab-card__caption">' +
      "<strong>" +
      escapeHtml(item.title) +
      "</strong>" +
      "<span>" +
      escapeHtml(item.description || item.category) +
      "</span>" +
      "</span>" +
      "</div>" +
      '<span class="lab-card__title">' +
      escapeHtml(item.title) +
      "</span>" +
      "</button>"
    );
  }

  function render() {
    grid.innerHTML = orderedItems().map(cardHtml).join("");
  }

  function latestItem() {
    var list = items.slice().sort(function (a, b) {
      var byDate = String(b.date || "").localeCompare(String(a.date || ""));
      if (byDate) return byDate;
      return Number(a.sort) - Number(b.sort);
    });
    return list[0] || null;
  }

  function playItem(item, options) {
    if (!player || !playerFrame || !item) return;

    var opts = options || {};
    activeId = item.id;
    render();
    player.classList.add("is-playing");
    if (playerIdle) playerIdle.hidden = true;
    playerFrame.innerHTML = "";

    var parsed = parseVideo(item.video);
    if (parsed && parsed.type === "file") {
      var video = document.createElement("video");
      video.src = parsed.src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("controlslist", "nodownload noplaybackrate noremoteplayback");
      playerFrame.appendChild(video);
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    } else if (parsed && (parsed.type === "vimeo" || parsed.type === "youtube")) {
      var iframe = document.createElement("iframe");
      iframe.src = parsed.embed;
      iframe.setAttribute("allow", "autoplay; fullscreen");
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      iframe.title = item.title;
      playerFrame.appendChild(iframe);
    } else if (parsed && parsed.type === "link") {
      window.open(parsed.href, "_blank", "noopener,noreferrer");
      player.classList.remove("is-playing");
      if (playerIdle) playerIdle.hidden = false;
    } else {
      var still = document.createElement("img");
      still.src = item.thumb + "?v=20260904a";
      still.alt = item.title;
      playerFrame.appendChild(still);
    }

    if (!opts.silent && window.matchMedia("(max-width: 980px)").matches) {
      player.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function findItem(id) {
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  grid.addEventListener("click", function (event) {
    var card = event.target.closest("[data-lab-id]");
    if (!card) return;
    var item = findItem(card.getAttribute("data-lab-id"));
    if (!item) return;
    playItem(item);
  });

  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("lab data missing");
      return res.json();
    })
    .then(function (data) {
      items = Array.isArray(data.items) ? data.items : [];
      render();
      var first = latestItem();
      if (first) playItem(first, { silent: true });
    })
    .catch(function () {
      grid.innerHTML = "<p class=\"lab-empty\">Lab experiments will appear here.</p>";
    });
})();
