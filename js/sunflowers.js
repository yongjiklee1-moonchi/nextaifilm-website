(function () {
  "use strict";

  var config = window.NAF_CMS_CONFIG || {};
  var AUTH_ENDPOINT = String(config.AUTH_URL || config.WEB_APP_URL || "").trim();
  var STORAGE_KEY = "naf-sunflowers-gate";
  var SESSION_HOURS = 1;

  var FILM_END_SECONDS = 7 * 60 + 23;

  var form = document.getElementById("sunflowers-login");
  var gate = document.getElementById("sunflowers-gate");
  var screen = document.getElementById("sunflowers-screen");
  var frame = document.getElementById("sunflowers-frame");
  var statusEl = document.getElementById("sunflowers-login-status");
  var submitBtn = form && form.querySelector('button[type="submit"]');
  var originInput = form && form.querySelector('input[name="origin"]');
  var waiting = false;
  var waitTimer = 0;
  var logoutTimer = 0;
  var vimeoPlayer = null;
  var lastEmbedUrl = "";
  var filmEnded = false;
  var replayBtn = document.getElementById("sunflowers-replay");

  function unloadPlayer() {
    if (vimeoPlayer) {
      try {
        vimeoPlayer.off("ended");
        vimeoPlayer.off("timeupdate");
      } catch (err) {}
      vimeoPlayer = null;
    }
    if (frame) {
      frame.removeAttribute("src");
    }
  }

  function finishFilm() {
    if (filmEnded) return;
    filmEnded = true;
    if (screen) screen.classList.add("is-ended");
    unloadPlayer();
    if (screen && screen.scrollIntoView) {
      screen.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function attachPlayer() {
    if (!frame || typeof window.Vimeo === "undefined" || !window.Vimeo.Player) return;
    if (vimeoPlayer) {
      try {
        vimeoPlayer.off("ended");
        vimeoPlayer.off("timeupdate");
      } catch (err) {}
      vimeoPlayer = null;
    }
    vimeoPlayer = new window.Vimeo.Player(frame);
    vimeoPlayer.on("ended", finishFilm);
    vimeoPlayer.on("timeupdate", function (data) {
      if (!data) return;
      if (data.seconds >= FILM_END_SECONDS) {
        finishFilm();
        return;
      }
      if (data.duration && data.duration - data.seconds <= 0.4) finishFilm();
    });
  }

  function replayFilm() {
    if (!lastEmbedUrl) return;
    filmEnded = false;
    if (screen) screen.classList.remove("is-ended");
    var url = lastEmbedUrl;
    url += url.indexOf("?") >= 0 ? "&autoplay=1" : "?autoplay=1";
    frame.src = url;
    window.setTimeout(attachPlayer, 400);
    if (screen && screen.scrollIntoView) {
      screen.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.classList.toggle("is-success", !!message && !isError);
  }

  function showScreen(embedUrl, exp) {
    if (!embedUrl || !frame || !screen || !gate) return;
    lastEmbedUrl = embedUrl;
    filmEnded = false;
    screen.classList.remove("is-ended");
    frame.src = embedUrl;
    gate.hidden = true;
    screen.hidden = false;
    document.body.classList.add("is-screening");
    window.setTimeout(attachPlayer, 400);
    scheduleLogout(exp);
  }

  function hideScreen() {
    if (logoutTimer) {
      window.clearTimeout(logoutTimer);
      logoutTimer = 0;
    }
    filmEnded = false;
    if (screen) screen.classList.remove("is-ended");
    unloadPlayer();
    if (screen) screen.hidden = true;
    if (gate) gate.hidden = false;
    document.body.classList.remove("is-screening");
  }

  function scheduleLogout(exp) {
    if (logoutTimer) {
      window.clearTimeout(logoutTimer);
      logoutTimer = 0;
    }
    var wait = Number(exp) - Date.now();
    if (!exp || wait <= 0) {
      expireSession();
      return;
    }
    logoutTimer = window.setTimeout(expireSession, wait);
  }

  function expireSession() {
    clearSession();
    hideScreen();
    setStatus("Session expired. Please sign in again.", true);
  }

  function readSession() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.embedUrl || !data.exp || Date.now() > data.exp) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  function saveSession(embedUrl, sessionHours) {
    var hours = Number(sessionHours);
    if (!hours || hours <= 0) hours = SESSION_HOURS;
    var exp = Date.now() + hours * 60 * 60 * 1000;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          embedUrl: embedUrl,
          exp: exp
        })
      );
    } catch (err) {}
    return exp;
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
  }

  function isAllowedOrigin(origin) {
    return (
      !origin ||
      origin === "https://script.google.com" ||
      origin === "https://script.googleusercontent.com" ||
      /googleusercontent\.com$/.test(origin) ||
      /script\.google\.com$/.test(origin)
    );
  }

  function openTheater(embedUrl, sessionHours) {
    if (!embedUrl) return;
    var exp = saveSession(embedUrl, sessionHours);
    setStatus("", false);
    if (form) form.reset();
    if (originInput) originInput.value = location.origin;
    showScreen(embedUrl, exp);
  }

  function finishWait() {
    waiting = false;
    if (waitTimer) {
      window.clearTimeout(waitTimer);
      waitTimer = 0;
    }
    if (submitBtn) submitBtn.disabled = false;
  }

  function consumeAuthHash() {
    var hash = location.hash || "";
    var prefix = "#naf-auth=";
    if (hash.indexOf(prefix) !== 0) return false;

    var raw = hash.slice(prefix.length);
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (err) {
      location.hash = "";
    }

    var data;
    try {
      data = JSON.parse(decodeURIComponent(raw));
    } catch (err) {
      setStatus("ID or password is incorrect.", true);
      return true;
    }

    if (data && data.ok && data.embedUrl) {
      openTheater(data.embedUrl, data.sessionHours);
      return true;
    }

    var message = "ID or password is incorrect.";
    if (data && data.error === "too_many") {
      message = "Too many attempts. Please wait a few minutes.";
    }
    setStatus(message, true);
    return true;
  }

  if (!form) return;

  if (!AUTH_ENDPOINT) {
    setStatus("Login server is not connected.", true);
    return;
  }

  form.setAttribute("action", AUTH_ENDPOINT);
  form.setAttribute("method", "POST");
  form.setAttribute("target", "sunflowers-login-frame");

  if (originInput) {
    originInput.value = location.origin;
  }

  if (!consumeAuthHash()) {
    var session = readSession();
    if (session) {
      showScreen(session.embedUrl, session.exp);
    }
  }

  form.addEventListener("submit", function (event) {
    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && String(honeypot.value || "").trim()) {
      event.preventDefault();
      setStatus("ID or password is incorrect.", true);
      return;
    }

    if (originInput) originInput.value = location.origin;
    waiting = true;
    setStatus("Entering…", false);
    if (submitBtn) submitBtn.disabled = true;
    if (waitTimer) window.clearTimeout(waitTimer);
    waitTimer = window.setTimeout(function () {
      if (!waiting) return;
      finishWait();
      setStatus("Could not complete login. Please try again.", true);
    }, 12000);
  });

  window.addEventListener("message", function (event) {
    if (!waiting) return;

    var data = event.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (err) {
        return;
      }
    }
    if (!data || data.type !== "naf-sunflowers-auth") return;
    if (event.origin && !isAllowedOrigin(event.origin)) return;

    finishWait();

    if (data.ok && data.embedUrl) {
      openTheater(data.embedUrl, data.sessionHours);
      return;
    }

    var message = "ID or password is incorrect.";
    if (data && data.error === "too_many") {
      message = "Too many attempts. Please wait a few minutes.";
    }
    setStatus(message, true);
  });

  var logout = document.getElementById("sunflowers-logout");
  if (logout) {
    logout.addEventListener("click", function () {
      clearSession();
      hideScreen();
      setStatus("", false);
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener("click", replayFilm);
  }
})();
