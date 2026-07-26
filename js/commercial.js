(function () {
  "use strict";

  var items = Array.prototype.slice.call(
    document.querySelectorAll(".commercial-item")
  );

  if (!items.length) return;

  function clearPlayer(player) {
    if (!player) return;
    var iframe = player.querySelector("iframe");
    if (iframe) iframe.remove();
    player.classList.remove("is-playing");
  }

  function loadVimeo(player) {
    if (!player || player.querySelector("iframe")) return;

    var id = (player.getAttribute("data-vimeo-id") || "").trim();
    if (!id) return;

    var iframe = document.createElement("iframe");
    iframe.src =
      "https://player.vimeo.com/video/" +
      encodeURIComponent(id) +
      "?autoplay=1&title=0&byline=0&portrait=0";
    iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "");
    iframe.title = "Commercial film";
    iframe.loading = "lazy";
    player.appendChild(iframe);
    player.classList.add("is-playing");
  }

  items.forEach(function (item) {
    var player = item.querySelector(".commercial-item__player");
    if (player) {
      var poster = player.getAttribute("data-poster");
      if (poster) {
        player.style.setProperty("--commercial-poster", 'url("' + poster + '")');
      }
    }

    item.addEventListener("toggle", function () {
      if (!item.open) {
        clearPlayer(item.querySelector(".commercial-item__player"));
        return;
      }

      items.forEach(function (other) {
        if (other !== item && other.open) {
          other.open = false;
          clearPlayer(other.querySelector(".commercial-item__player"));
        }
      });
    });

    var playBtn = item.querySelector(".commercial-item__play");
    if (playBtn) {
      playBtn.addEventListener("click", function (event) {
        event.preventDefault();
        var player = item.querySelector(".commercial-item__player");
        var id = player && (player.getAttribute("data-vimeo-id") || "").trim();
        if (!id) return;
        loadVimeo(player);
      });
    }
  });
})();
