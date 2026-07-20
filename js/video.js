function updateSoundToggle(soundToggle, isMuted) {
  soundToggle.classList.toggle("is-unmuted", !isMuted);
  soundToggle.setAttribute("aria-pressed", String(isMuted));
  soundToggle.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
}

function updatePauseToggle(pauseToggle, isPaused) {
  pauseToggle.classList.toggle("is-paused", isPaused);
  pauseToggle.setAttribute("aria-pressed", String(isPaused));
  pauseToggle.setAttribute("aria-label", isPaused ? "Play" : "Pause");
}

function revealHeroVideo(hero) {
  if (!hero || hero.classList.contains("is-video-playing")) {
    return;
  }

  hero.classList.add("is-video-playing");
}

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isControlTarget(event) {
  return Boolean(event.target && event.target.closest(".hero__controls, .video-control"));
}

function bindControl(button, handler) {
  const run = (event) => {
    event.preventDefault();
    event.stopPropagation();
    handler();
  };

  button.addEventListener("touchstart", run, { passive: false });
  button.addEventListener("click", run);
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

  const player = new window.Vimeo.Player(iframe);
  const isIOS = isIOSDevice();
  let posterRevealed = false;
  let isMuted = true;
  let isPaused = true;
  let unlockBound = false;
  let userPaused = false;
  let iosRetryTimer = null;

  const stopIOSRetry = () => {
    if (iosRetryTimer) {
      window.clearInterval(iosRetryTimer);
      iosRetryTimer = null;
    }
  };

  const syncPlayerState = () => {
    return Promise.all([
      player.getPaused().catch(() => true),
      player.getMuted().catch(() => true),
    ]).then(([paused, muted]) => {
      isPaused = paused;
      isMuted = muted;
      updatePauseToggle(pauseToggle, paused);
      updateSoundToggle(soundToggle, muted);
      return { paused, muted };
    });
  };

  const showVideo = () => {
    if (posterRevealed) {
      return;
    }

    posterRevealed = true;
    revealHeroVideo(hero);
  };

  const tryPlay = (force) => {
    if (userPaused && !force) {
      return;
    }

    player.setMuted(true).catch(() => {});
    player
      .play()
      .then(() => {
        isPaused = false;
        userPaused = false;
        updatePauseToggle(pauseToggle, false);
        stopIOSRetry();
      })
      .catch(() => {
        syncPlayerState().catch(() => {});
      });
  };

  const bindIOSUnlock = () => {
    if (!isIOS || unlockBound) {
      return;
    }

    unlockBound = true;

    const unlock = (event) => {
      if (isControlTarget(event)) {
        return;
      }

      tryPlay();
    };

    hero.addEventListener("touchstart", unlock, { passive: true });
    hero.addEventListener("click", unlock);

    window.addEventListener("pageshow", () => {
      if (!userPaused) {
        tryPlay();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !userPaused) {
        tryPlay();
      }
    });

    let attempts = 0;
    iosRetryTimer = window.setInterval(() => {
      if (userPaused) {
        stopIOSRetry();
        return;
      }

      attempts += 1;
      tryPlay();
      if (attempts >= 24) {
        stopIOSRetry();
      }
    }, 500);
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
    stopIOSRetry();
    player
      .getCurrentTime()
      .then((t) => {
        if (t > 0.01) {
          showVideo();
        }
      })
      .catch(() => {
        showVideo();
      });
  });

  player.on("timeupdate", (data) => {
    if (data && data.seconds > 0.01) {
      showVideo();
    }
  });

  player.on("bufferend", () => {
    player
      .getPaused()
      .then((paused) => {
        if (!paused) {
          showVideo();
        }
      })
      .catch(() => {});
  });

  player.on("pause", () => {
    isPaused = true;
    updatePauseToggle(pauseToggle, true);
  });

  player.on("ended", () => {
    isPaused = true;
    updatePauseToggle(pauseToggle, true);
  });

  player.on("volumechange", (data) => {
    if (typeof data.muted === "boolean") {
      isMuted = data.muted;
      updateSoundToggle(soundToggle, isMuted);
    }
  });

  player.ready().then(() => {
    syncPlayerState().finally(() => {
      tryPlay();
      bindIOSUnlock();
    });
  });

  bindControl(soundToggle, () => {
    player
      .getMuted()
      .then((muted) => {
        const nextMuted = !muted;
        return player.setMuted(nextMuted).then(() => nextMuted);
      })
      .then((nextMuted) => {
        isMuted = nextMuted;
        updateSoundToggle(soundToggle, isMuted);
        if (!isMuted) {
          return player.setVolume(1).then(() => {
            if (isPaused) {
              userPaused = false;
              return player.play();
            }
            return undefined;
          });
        }
        return undefined;
      })
      .then(() => syncPlayerState())
      .catch(() => {});
  });

  bindControl(pauseToggle, () => {
    player
      .getPaused()
      .then((paused) => {
        if (paused) {
          userPaused = false;
          return player.play().then(() => {
            isPaused = false;
            updatePauseToggle(pauseToggle, false);
            showVideo();
          });
        }

        userPaused = true;
        stopIOSRetry();
        return player.pause().then(() => {
          isPaused = true;
          updatePauseToggle(pauseToggle, true);
        });
      })
      .catch(() => syncPlayerState());
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
