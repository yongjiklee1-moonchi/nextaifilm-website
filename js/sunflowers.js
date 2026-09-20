(function () {
  "use strict";

  var STORAGE_KEY = "naf-sunflowers-gate";
  var gateConfig = window.NAF_SUNFLOWERS || {};
  var SESSION_HOURS = Number(gateConfig.sessionHours) || 1;
  var EMBED_URL = gateConfig.embedUrl || "";
  var EXPECTED_USER = String(gateConfig.user || "sunflowers");
  var EXPECTED_PASSWORD = String(gateConfig.password || "");

  var form = document.getElementById("sunflowers-login");
  var gate = document.getElementById("sunflowers-gate");
  var screen = document.getElementById("sunflowers-screen");
  var frame = document.getElementById("sunflowers-frame");
  var statusEl = document.getElementById("sunflowers-login-status");
  var submitBtn = form && form.querySelector('button[type="submit"]');
  var logoutTimer = 0;

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.classList.toggle("is-success", !!message && !isError);
  }

  function showScreen(embedUrl, exp) {
    if (!embedUrl || !frame || !screen || !gate) return;
    frame.src = embedUrl;
    gate.hidden = true;
    screen.hidden = false;
    scheduleLogout(exp);
  }

  function hideScreen() {
    if (logoutTimer) {
      window.clearTimeout(logoutTimer);
      logoutTimer = 0;
    }
    if (frame) frame.removeAttribute("src");
    if (screen) screen.hidden = true;
    if (gate) gate.hidden = false;
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

  function saveSession(embedUrl) {
    var exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
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

  function openTheater() {
    var exp = saveSession(EMBED_URL);
    setStatus("", false);
    if (form) form.reset();
    showScreen(EMBED_URL, exp);
  }

  if (!form) return;

  form.removeAttribute("action");
  form.removeAttribute("target");

  var session = readSession();
  if (session) {
    showScreen(session.embedUrl, session.exp);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && String(honeypot.value || "").trim()) {
      setStatus("ID or password is incorrect.", true);
      return;
    }

    var userInput = form.querySelector('input[name="username"]');
    var passInput = form.querySelector('input[name="password"]');
    var user = String(userInput && userInput.value ? userInput.value : "").trim();
    var password = String(passInput && passInput.value ? passInput.value : "");

    if (submitBtn) submitBtn.disabled = true;
    setStatus("Entering…", false);

    window.setTimeout(function () {
      if (submitBtn) submitBtn.disabled = false;
      if (user === EXPECTED_USER && password === EXPECTED_PASSWORD && EMBED_URL) {
        openTheater();
        return;
      }
      setStatus("ID or password is incorrect.", true);
    }, 200);
  });

  var logout = document.getElementById("sunflowers-logout");
  if (logout) {
    logout.addEventListener("click", function () {
      clearSession();
      hideScreen();
      setStatus("", false);
    });
  }
})();
