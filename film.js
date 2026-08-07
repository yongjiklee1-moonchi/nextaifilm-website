function initFilmCarousel(root) {
  const track = root.querySelector(".film-carousel__track");
  const slides = Array.from(root.querySelectorAll(".film-carousel__slide"));
  const prevBtn = root.querySelector(".film-carousel__btn--prev");
  const nextBtn = root.querySelector(".film-carousel__btn--next");
  const dotsWrap = root.querySelector(".film-carousel__dots");

  if (!track || slides.length === 0) {
    return;
  }

  let index = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "film-carousel__dot";
    dot.setAttribute("aria-label", `Go to image ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.querySelectorAll(".film-carousel__dot"));

  function goTo(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;

    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  prevBtn?.addEventListener("click", () => goTo(index - 1));
  nextBtn?.addEventListener("click", () => goTo(index + 1));

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      goTo(index - 1);
    }
    if (event.key === "ArrowRight") {
      goTo(index + 1);
    }
  });

  goTo(0);
}

function initFilmTabs() {
  const tabs = Array.from(document.querySelectorAll(".film-tab[data-film]:not([disabled])"));
  const panels = Array.from(document.querySelectorAll("[data-film-panel]"));

  if (tabs.length === 0 || panels.length === 0) {
    return;
  }

  function activate(filmId) {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.film === filmId;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.filmPanel === filmId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activate(tab.dataset.film);
    });

    tab.addEventListener("keydown", (event) => {
      const currentIndex = tabs.indexOf(tab);
      let nextIndex = currentIndex;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      tabs[nextIndex].focus();
      activate(tabs[nextIndex].dataset.film);
    });
  });
}

document.querySelectorAll("[data-carousel]").forEach(initFilmCarousel);
initFilmTabs();

function playFilmPlayer(player, options) {
  if (!player) return;
  options = options || {};

  var existing = player.querySelector("video");
  if (existing) {
    if (options.autoplay) {
      existing.muted = true;
      existing.setAttribute("muted", "");
      var resume = existing.play();
      if (resume && typeof resume.catch === "function") resume.catch(function () {});
    }
    return;
  }

  var src = (player.getAttribute("data-video-src") || "").trim();
  if (!src) return;

  var muted = options.muted !== false && (options.autoplay || player.hasAttribute("data-autoplay"));
  var video = document.createElement("video");
  video.src = src;
  video.controls = true;
  video.controlsList = "nodownload noremoteplayback";
  video.disablePictureInPicture = true;
  video.autoplay = !!options.autoplay || player.hasAttribute("data-autoplay");
  video.muted = muted;
  video.loop = player.hasAttribute("data-loop");
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("playsinline", "");
  video.setAttribute("controlslist", "nodownload noremoteplayback");
  video.setAttribute("disablepictureinpicture", "");
  if (muted) video.setAttribute("muted", "");
  video.title = "Sunflowers trailer";
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
      // Autoplay blocked: keep poster/play UI available by removing empty playing state
      if (!options.autoplay) return;
      player.classList.remove("is-playing");
      video.remove();
    });
  }
}

function initFilmPlayers() {
  document.querySelectorAll(".film-player").forEach(function (player) {
    var playBtn = player.querySelector(".film-player__play");
    if (playBtn) {
      playBtn.addEventListener("click", function () {
        playFilmPlayer(player, { autoplay: true, muted: false });
      });
    }

    if (player.hasAttribute("data-autoplay")) {
      playFilmPlayer(player, { autoplay: true, muted: true });
    }
  });

  document.querySelectorAll("[data-film-play]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      var id = link.getAttribute("data-film-play");
      var player = id ? document.getElementById(id) : null;
      if (!player) return;
      event.preventDefault();
      player.scrollIntoView({ behavior: "smooth", block: "center" });
      playFilmPlayer(player, { autoplay: true, muted: false });
    });
  });
}

initFilmPlayers();
