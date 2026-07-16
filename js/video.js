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
  const iframe = document.getElementById("hero-player");

  if (!hero || !soundToggle || !pauseToggle || !iframe) {
    return false;
  }

  if (typeof window.Vimeo === "undefined" || !window.Vimeo.Player) {
    return false;
  }

  if (iframe.dataset.bound === "true") {
    return true;
  }

  iframe.dataset.bound = "true";

  // Tiny hold only — prefer fastest visible start over hiding black frames.
  const POSTER_HOLD_SECONDS = 0.12;

  const player = new window.Vimeo.Player(iframe);
  let posterRevealed = false;
  let isMuted = true;
  let isPaused = true;

  const showVideo = () => {
    if (posterRevealed) {
      return;
    }

    posterRevealed = true;
    revealHeroVideo(hero);
  };

  const tryPlay = () => {
    player.setMuted(true).catch(() => {});
    player
      .play()
      .then(() => {
        isPaused = false;
        updatePauseToggle(pauseToggle, false);
      })
      .catch(() => {
        isPaused = true;
        updatePauseToggle(pauseToggle, true);
      });
  };

  updateSoundToggle(soundToggle, true);
  updatePauseToggle(pauseToggle, true);

  player.on("play", () => {
    isPaused = false;
    updatePauseToggle(pauseToggle, false);
  });

  player.on("playing", () => {
    isPaused = false;
    updatePauseToggle(pauseToggle, false);
    showVideo();
  });

  player.on("pause", () => {
    isPaused = true;
    updatePauseToggle(pauseToggle, true);
  });

  player.on("ended", () => {
    isPaused = true;
    updatePauseToggle(pauseToggle, true);
  });

  player.on("timeupdate", (data) => {
    if (data && data.seconds >= POSTER_HOLD_SECONDS) {
      showVideo();
    }
  });

  player.on("volumechange", (data) => {
    if (typeof data.muted === "boolean") {
      isMuted = data.muted;
      updateSoundToggle(soundToggle, isMuted);
    }
  });

  // Kick playback as soon as the API is ready; iframe already has autoplay=1.
  player.ready().then(() => {
    tryPlay();
  });

  // Also try immediately — ready() may already be resolved.
  tryPlay();

  soundToggle.addEventListener("click", () => {
    const nextMuted = !isMuted;
    player
      .setMuted(nextMuted)
      .then(() => {
        isMuted = nextMuted;
        if (!nextMuted) {
          return player.setVolume(1);
        }
        return undefined;
      })
      .then(() => {
        updateSoundToggle(soundToggle, isMuted);
        if (!isMuted && isPaused) {
          tryPlay();
        }
      })
      .catch(() => {});
  });

  pauseToggle.addEventListener("click", () => {
    if (isPaused) {
      player
        .play()
        .then(() => {
          isPaused = false;
          updatePauseToggle(pauseToggle, false);
        })
        .catch(() => {});
    } else {
      player
        .pause()
        .then(() => {
          isPaused = true;
          updatePauseToggle(pauseToggle, true);
        })
        .catch(() => {});
    }
  });

  return true;
}

function bootHeroVideo() {
  if (initHeroVideo()) return;

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (initHeroVideo() || attempts >= 80) {
      window.clearInterval(timer);
    }
  }, 25);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootHeroVideo);
} else {
  bootHeroVideo();
}
