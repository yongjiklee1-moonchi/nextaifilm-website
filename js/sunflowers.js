(function () {
  "use strict";

  var AUTH_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzxflmPdifREqT7Ffrxg_KeofOTNsI_m3EPpuf3y2SvUgGOMQm8mGUvMh2YnDf-tLGdZw/exec";
  var STORAGE_KEY = "naf-sunflowers-gate";
  var SESSION_HOURS = 1;
  var FALLBACK_EMBED =
    "https://player.vimeo.com/video/1210535916?badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0";

  var form = document.getElementById("sunflowers-login");
  var gate = document.getElementById("sunflowers-gate");
  var screen = document.getElementById("sunflowers-screen");
  var frame = document.getElementById("sunflowers-frame");
  var statusEl = document.getElementById("sunflowers-login-status");
  var loginFrame = document.getElementById("sunflowers-login-frame");
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

  function currentCredentials() {
    if (!form) {
      return { user: "", password: "" };
    }
    var userInput = form.querySelector('input[name="username"]');
    var passInput = form.querySelector('input[name="password"]');
    return {
      user: String(userInput && userInput.value ? userInput.value : "").trim(),
      password: String(passInput && passInput.value ? passInput.value : "")
    };
  }

  function fallbackUnlocked() {
    var creds = currentCredentials();
    return creds.user === "sunflowers" && creds.password === "1234";
  }

  function openTheater(embedUrl, sessionHours) {
    var exp = saveSession(embedUrl || FALLBACK_EMBED, sessionHours);
    setStatus("", false);
    if (form) form.reset();
    if (originInput) originInput.value = location.origin;
    showScreen(embedUrl || FALLBACK_EMBED, exp);
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
      if (fallbackUnlocked()) {
        finishWait();
        openTheater(FALLBACK_EMBED, SESSION_HOURS);
        return;
      }
      finishWait();
      setStatus("ID or password is incorrect.", true);
    }, 2500);
  });

  if (loginFrame) {
    loginFrame.addEventListener("load", function () {
      if (!waiting) return;
      window.setTimeout(function () {
        if (!waiting) return;
        if (fallbackUnlocked()) {
          finishWait();
          openTheater(FALLBACK_EMBED, SESSION_HOURS);
        }
      }, 600);
    });
  }

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
