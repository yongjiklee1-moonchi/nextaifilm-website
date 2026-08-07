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
    var video = player.querySelector("video");
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
    }
    player.classList.remove("is-playing");
  }

  function loadVimeo(player) {
    if (!player || player.querySelector("iframe") || player.querySelector("video")) {
      return;
    }

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

  function loadLocalVideo(player, options) {
    if (!player || player.querySelector("iframe") || player.querySelector("video")) {
      return;
    }

    var src = (player.getAttribute("data-video-src") || "").trim();
    if (!src) return;
    options = options || {};

    var video = document.createElement("video");
    video.src = src;
    video.controls = true;
    video.controlsList = "nodownload noplaybackrate noremoteplayback";
    video.disablePictureInPicture = true;
    video.autoplay = true;
    video.muted = !!options.muted;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("controlslist", "nodownload noplaybackrate noremoteplayback");
    video.setAttribute("disablepictureinpicture", "");
    if (options.muted) video.setAttribute("muted", "");
    video.title = "Commercial film";
    video.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });

    var poster = player.getAttribute("data-poster");
    if (poster) video.poster = poster;

    player.appendChild(video);
    player.classList.add("is-playing");

    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        // Browser blocked unmuted autoplay — retry muted
        if (!options.muted) {
          video.muted = true;
          video.setAttribute("muted", "");
          var retry = video.play();
          if (retry && typeof retry.catch === "function") {
            retry.catch(function () {
              player.classList.remove("is-playing");
              video.remove();
            });
          }
        } else {
          player.classList.remove("is-playing");
          video.remove();
        }
      });
    }
  }

  function playMedia(player, options) {
    if (!player) return;
    var localSrc = (player.getAttribute("data-video-src") || "").trim();
    var vimeoId = (player.getAttribute("data-vimeo-id") || "").trim();
    if (localSrc) {
      loadLocalVideo(player, options);
      return;
    }
    if (vimeoId) loadVimeo(player);
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

      playMedia(item.querySelector(".commercial-item__player"), { muted: true });
    });

    var playBtn = item.querySelector(".commercial-item__play");
    if (playBtn) {
      playBtn.addEventListener("click", function (event) {
        event.preventDefault();
        playMedia(item.querySelector(".commercial-item__player"), { muted: true });
      });
    }

    // Page enter: autoplay open items (Automotive is open by default)
    if (item.open) {
      playMedia(player, { muted: true });
    }
  });
})();
