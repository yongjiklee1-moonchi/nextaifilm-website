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

function initHeroVideo() {
  const soundToggle = document.querySelector(".sound-toggle");
  const pauseToggle = document.querySelector(".pause-toggle");
  const vimeoIframe = document.getElementById("vimeo-player");

  if (!soundToggle || !pauseToggle || !vimeoIframe || typeof Vimeo === "undefined") {
    return false;
  }

  const player = new Vimeo.Player(vimeoIframe);

  player.setMuted(true);
  updateSoundToggle(soundToggle, true);
  updatePauseToggle(pauseToggle, false);

  player.ready().then(() => player.play()).catch(() => {});

  soundToggle.addEventListener("click", async () => {
    try {
      const isMuted = await player.getMuted();
      const nextMuted = !isMuted;
      await player.setMuted(nextMuted);
      if (!nextMuted) {
        await player.setVolume(1);
      }
      updateSoundToggle(soundToggle, nextMuted);
    } catch (error) {
      console.error("Vimeo sound toggle failed:", error);
    }
  });

  pauseToggle.addEventListener("click", async () => {
    try {
      const isPaused = await player.getPaused();
      if (isPaused) {
        await player.play();
        updatePauseToggle(pauseToggle, false);
      } else {
        await player.pause();
        updatePauseToggle(pauseToggle, true);
      }
    } catch (error) {
      console.error("Vimeo pause toggle failed:", error);
    }
  });

  player.on("ended", () => {
    updatePauseToggle(pauseToggle, true);
  });

  player.on("pause", () => {
    updatePauseToggle(pauseToggle, true);
  });

  player.on("play", () => {
    updatePauseToggle(pauseToggle, false);
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
