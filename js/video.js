function updateSoundToggle(soundToggle, isMuted) {
  soundToggle.classList.toggle("is-unmuted", !isMuted);
  soundToggle.setAttribute("aria-pressed", String(isMuted));
  soundToggle.setAttribute("aria-label", isMuted ? "소리 켜기" : "소리 끄기");
}

function updatePauseToggle(pauseToggle, isPaused) {
  pauseToggle.classList.toggle("is-paused", isPaused);
  pauseToggle.setAttribute("aria-pressed", String(isPaused));
  pauseToggle.setAttribute("aria-label", isPaused ? "재생" : "일시정지");
}

function revealHeroVideo(hero) {
  if (!hero || hero.classList.contains("is-video-playing")) {
    return;
  }

  hero.classList.add("is-video-playing");
}

function initHeroVideo() {
  const hero = document.querySelector(".hero");
  const soundToggle = document.querySelector(".sound-toggle");
  const pauseToggle = document.querySelector(".pause-toggle");
  const player = document.getElementById("hero-player");

  if (!hero || !soundToggle || !pauseToggle || !player) {
    return false;
  }

  if (player.dataset.bound === "true") {
    return true;
  }

  player.dataset.bound = "true";

  let posterRevealed = false;

  const showVideo = () => {
    if (posterRevealed) {
      return;
    }

    posterRevealed = true;
    revealHeroVideo(hero);
  };

  const tryPlay = () => {
    player.muted = true;
    player.defaultMuted = true;
    player.setAttribute("muted", "");

    const playPromise = player.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          showVideo();
        })
        .catch((error) => {
          console.warn("Hero video autoplay blocked or failed:", error);
          updatePauseToggle(pauseToggle, true);
        });
    }
  };

  player.muted = true;
  player.defaultMuted = true;
  player.playsInline = true;
  player.loop = true;
  updateSoundToggle(soundToggle, true);
  updatePauseToggle(pauseToggle, true);

  player.addEventListener("playing", () => {
    showVideo();
    updatePauseToggle(pauseToggle, false);
  });

  player.addEventListener("timeupdate", () => {
    if (player.currentTime > 0.05) {
      showVideo();
    }
  });

  player.addEventListener("canplay", tryPlay, { once: true });
  player.addEventListener("loadeddata", tryPlay, { once: true });

  if (player.readyState >= 2) {
    tryPlay();
  } else {
    player.load();
  }

  soundToggle.addEventListener("click", () => {
    player.muted = !player.muted;
    if (!player.muted) {
      player.volume = 1;
      tryPlay();
    }
    updateSoundToggle(soundToggle, player.muted);
  });

  pauseToggle.addEventListener("click", () => {
    if (player.paused) {
      tryPlay();
    } else {
      player.pause();
      updatePauseToggle(pauseToggle, true);
    }
  });

  player.addEventListener("pause", () => {
    if (!player.ended) {
      updatePauseToggle(pauseToggle, true);
    }
  });

  player.addEventListener("play", () => {
    updatePauseToggle(pauseToggle, false);
  });

  player.addEventListener("ended", () => {
    updatePauseToggle(pauseToggle, true);
  });

  player.addEventListener("error", () => {
    console.error("Hero video error:", player.error);
  });

  return true;
}

function bootHeroVideo() {
  if (initHeroVideo()) return;

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (initHeroVideo() || attempts >= 40) {
      window.clearInterval(timer);
    }
  }, 50);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootHeroVideo);
} else {
  bootHeroVideo();
}
