(function () {
  "use strict";

  var config = window.NAF_CMS_CONFIG || {};
  var AUTH_ENDPOINT = String(config.AUTH_URL || config.WEB_APP_URL || "").trim();
  var STORAGE_KEY = "naf-sunflowers-gate";
  var SESSION_HOURS = 1;

  var form = document.getElementById("sunflowers-login");
  var gate = document.getElementById("sunflowers-gate");
  var screen = document.getElementById("sunflowers-screen");
  var frame = document.getElementById("sunflowers-frame");
  var statusEl = document.getElementById("sunflowers-login-status");
  var submitBtn = form && form.querySelector('button[type="submit"]');
  var waiting = false;
  var waitTimer = 0;
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
      origin === "https://script.google.com" ||
      origin === "https://script.googleusercontent.com" ||
      /^(https:\/\/)[\w.-]*googleusercontent\.com$/.test(origin) ||
      /^(https:\/\/)[\w.-]*script\.google\.com$/.test(origin)
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

  if (!form) return;

  if (!AUTH_ENDPOINT) {
    setStatus("Login server is not connected.", true);
    return;
  }

  form.setAttribute("action", AUTH_ENDPOINT);
  form.setAttribute("method", "POST");
  form.setAttribute("target", "sunflowers-login-frame");

  var originInput = form.querySelector('input[name="origin"]');
  if (originInput) {
    originInput.value = location.origin;
  }

  var session = readSession();
  if (session) {
    showScreen(session.embedUrl, session.exp);
  }

  form.addEventListener("submit", function (event) {
    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && String(honeypot.value || "").trim()) {
      event.preventDefault();
      setStatus("ID or password is incorrect.", true);
      return;
    }

    waiting = true;
    setStatus("Entering…", false);
    if (submitBtn) submitBtn.disabled = true;
    if (waitTimer) window.clearTimeout(waitTimer);
    waitTimer = window.setTimeout(function () {
      if (!waiting) return;
      finishWait();
      setStatus("Login server did not respond. Deploy the latest Code.gs as a new web app version.", true);
    }, 12000);
  });

  window.addEventListener("message", function (event) {
    if (!waiting) return;
    if (!isAllowedOrigin(event.origin)) return;

    var data = event.data;
    if (!data || data.type !== "naf-sunflowers-auth") return;

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
})();
