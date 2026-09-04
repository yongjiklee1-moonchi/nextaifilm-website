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

    if (/\.(mp4|webm|mov)(\?|$)/i.test(raw) || raw.indexOf("assets/") === 0) {
      return { type: "file", src: raw };
    }

    return null;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cardHtml(item) {
    var linked = !!(item.video && String(item.video).trim() && parseVideo(item.video));
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

  function showStill(item) {
    var still = document.createElement("img");
    still.src = item.thumb + "?v=20260904a";
    still.alt = item.title;
    still.draggable = false;
    playerFrame.appendChild(still);
  }

  function playFile(item, src, autoplay) {
    var video = document.createElement("video");
    video.src = src;
    video.poster = item.thumb;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("playsinline", "");
    video.setAttribute("controlslist", "nodownload noplaybackrate noremoteplayback");
    video.disablePictureInPicture = true;
    video.draggable = false;
    video.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
    playerFrame.appendChild(video);
    if (autoplay) {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }
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
      playFile(item, parsed.src, !opts.silent);
    } else {
      showStill(item);
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

  if (player) {
    player.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
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
