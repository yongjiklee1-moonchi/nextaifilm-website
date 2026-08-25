(function () {
  "use strict";

  var DATA_URL = "data/lab.json";
  var LINK_KEY = "naf-lab-links";
  var SORT_KEY = "naf-lab-sort";

  var grid = document.getElementById("lab-grid");
  var exploring = document.getElementById("lab-exploring");
  var sortSelect = document.getElementById("lab-sort");
  var connectBtn = document.getElementById("lab-connect-btn");
  var dialog = document.getElementById("lab-connect-dialog");
  var form = document.getElementById("lab-connect-form");
  var itemSelect = document.getElementById("lab-connect-item");
  var urlInput = document.getElementById("lab-connect-url");
  var statusEl = document.getElementById("lab-connect-status");
  var lightbox = document.getElementById("lab-lightbox");
  var lightboxFrame = document.getElementById("lab-lightbox-frame");
  var lightboxClose = document.getElementById("lab-lightbox-close");

  if (!grid) return;

  var items = [];

  function readLinks() {
    try {
      var raw = localStorage.getItem(LINK_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeLinks(map) {
    try {
      localStorage.setItem(LINK_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  function readSort() {
    try {
      return localStorage.getItem(SORT_KEY) || "newest";
    } catch (e) {
      return "newest";
    }
  }

  function writeSort(value) {
    try {
      localStorage.setItem(SORT_KEY, value);
    } catch (e) {}
  }

  function mergeLinks(list) {
    var saved = readLinks();
    return list.map(function (item) {
      var next = Object.assign({}, item);
      if (saved[item.id]) next.video = saved[item.id];
      return next;
    });
  }

  function sortedItems() {
    var mode = (sortSelect && sortSelect.value) || readSort();
    var copy = items.slice();
    if (mode === "oldest") {
      copy.sort(function (a, b) {
        return String(a.date).localeCompare(String(b.date)) || a.sort - b.sort;
      });
    } else if (mode === "title") {
      copy.sort(function (a, b) {
        return String(a.title).localeCompare(String(b.title));
      });
    } else if (mode === "manual") {
      copy.sort(function (a, b) {
        return Number(a.sort) - Number(b.sort);
      });
    } else {
      copy.sort(function (a, b) {
        return String(b.date).localeCompare(String(a.date)) || a.sort - b.sort;
      });
    }
    return copy;
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
      return {
        type: "youtube",
        embed: "https://www.youtube.com/embed/" + yt[1] + "?autoplay=1&rel=0"
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
    var tag = linked ? "a" : "article";
    var href = linked ? ' href="#"' : "";
    return (
      "<" +
      tag +
      ' class="lab-card' +
      (linked ? " is-linked" : "") +
      '" data-lab-id="' +
      escapeHtml(item.id) +
      '"' +
      href +
      ">" +
      '<div class="lab-card__media">' +
      '<img src="' +
      escapeHtml(item.thumb) +
      '" alt="' +
      escapeHtml(item.title) +
      '" width="640" height="360" loading="lazy" decoding="async" />' +
      '<span class="lab-card__play" aria-hidden="true"></span>' +
      '<span class="lab-card__tag">' +
      escapeHtml(item.category) +
      "</span>" +
      "</div>" +
      '<div class="lab-card__meta">' +
      '<div class="lab-card__row">' +
      '<h2 class="lab-card__title">' +
      escapeHtml(item.title) +
      "</h2>" +
      '<span class="lab-card__date">' +
      escapeHtml(item.dateLabel) +
      "</span>" +
      "</div>" +
      '<p class="lab-card__desc">' +
      escapeHtml(item.description) +
      "</p>" +
      "</div>" +
      "</" +
      tag +
      ">"
    );
  }

  function exploringHtml(item) {
    return (
      '<li class="lab-exploring__item">' +
      '<img src="' +
      escapeHtml(item.thumb) +
      '" alt="" width="56" height="40" loading="lazy" decoding="async" />' +
      "<div>" +
      "<strong>" +
      escapeHtml(item.title) +
      "</strong>" +
      "<span>" +
      escapeHtml(item.exploringNote || item.category) +
      "</span>" +
      "</div>" +
      "</li>"
    );
  }

  function fillConnectSelect() {
    if (!itemSelect) return;
    itemSelect.innerHTML = items
      .map(function (item) {
        return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.title) + "</option>";
      })
      .join("");
  }

  function render() {
    var list = sortedItems();
    grid.innerHTML = list.map(cardHtml).join("");
    if (exploring) {
      var side = list.filter(function (item) {
        return item.exploring;
      });
      if (!side.length) side = list.slice(0, 3);
      exploring.innerHTML = side.slice(0, 3).map(exploringHtml).join("");
    }
  }

  function openLightbox(item) {
    var parsed = parseVideo(item.video);
    if (!parsed) return;
    if (parsed.type === "link") {
      window.open(parsed.href, "_blank", "noopener,noreferrer");
      return;
    }
    if (!lightbox || !lightboxFrame) {
      window.open(item.video, "_blank", "noopener,noreferrer");
      return;
    }

    lightboxFrame.innerHTML = "";
    if (parsed.type === "file") {
      var video = document.createElement("video");
      video.src = parsed.src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      lightboxFrame.appendChild(video);
    } else {
      var iframe = document.createElement("iframe");
      iframe.src = parsed.embed;
      iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.title = item.title;
      lightboxFrame.appendChild(iframe);
    }
    lightbox.hidden = false;
    document.body.classList.add("lab-lightbox-open");
  }

  function closeLightbox() {
    if (!lightbox || !lightboxFrame) return;
    lightbox.hidden = true;
    lightboxFrame.innerHTML = "";
    document.body.classList.remove("lab-lightbox-open");
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
    if (!item || !item.video) return;
    event.preventDefault();
    openLightbox(item);
  });

  if (sortSelect) {
    sortSelect.value = readSort();
    sortSelect.addEventListener("change", function () {
      writeSort(sortSelect.value);
      render();
    });
  }

  if (connectBtn && dialog) {
    connectBtn.addEventListener("click", function () {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      if (statusEl) statusEl.textContent = "";
      var current = itemSelect && itemSelect.value;
      var item = findItem(current);
      if (urlInput) urlInput.value = (item && item.video) || "";
    });
  }

  if (itemSelect) {
    itemSelect.addEventListener("change", function () {
      var item = findItem(itemSelect.value);
      if (urlInput) urlInput.value = (item && item.video) || "";
    });
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var id = itemSelect && itemSelect.value;
      var url = urlInput ? urlInput.value.trim() : "";
      if (!id) return;
      var map = readLinks();
      if (url) map[id] = url;
      else delete map[id];
      writeLinks(map);
      items = mergeLinks(items);
      render();
      if (statusEl) {
        statusEl.textContent = url ? "Video linked. Saved in this browser." : "Link removed.";
      }
    });
  }

  var clearBtn = document.getElementById("lab-connect-clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (urlInput) urlInput.value = "";
    });
  }

  document.querySelectorAll("[data-lab-dialog-close]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (dialog && typeof dialog.close === "function") dialog.close();
      else if (dialog) dialog.removeAttribute("open");
    });
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeLightbox();
  });

  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("lab data missing");
      return res.json();
    })
    .then(function (data) {
      items = mergeLinks(Array.isArray(data.items) ? data.items : []);
      fillConnectSelect();
      render();
    })
    .catch(function () {
      grid.innerHTML = "<p class=\"lab-empty\">Lab experiments will appear here.</p>";
    });
})();
