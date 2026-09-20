(function () {
  "use strict";

  var AUTH_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzxflmPdifREqT7Ffrxg_KeofOTNsI_m3EPpuf3y2SvUgGOMQm8mGUvMh2YnDf-tLGdZw/exec";
  var STORAGE_KEY = "naf-sunflowers-gate";

  var form = document.getElementById("sunflowers-login");
  var gate = document.getElementById("sunflowers-gate");
  var screen = document.getElementById("sunflowers-screen");
  var frame = document.getElementById("sunflowers-frame");
  var statusEl = document.getElementById("sunflowers-login-status");
  var submitBtn = form && form.querySelector('button[type="submit"]');
  var waiting = false;
  var waitTimer = 0;

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.classList.toggle("is-success", !!message && !isError);
  }

  function showScreen(embedUrl) {
    if (!embedUrl || !frame || !screen || !gate) return;
    frame.src = embedUrl;
    gate.hidden = true;
    screen.hidden = false;
  }

  function hideScreen() {
    if (frame) frame.removeAttribute("src");
    if (screen) screen.hidden = true;
    if (gate) gate.hidden = false;
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
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          embedUrl: embedUrl,
          exp: Date.now() + 12 * 60 * 60 * 1000
        })
      );
    } catch (err) {}
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
    showScreen(session.embedUrl);
  }

  function finishWait() {
    waiting = false;
    if (waitTimer) {
      window.clearTimeout(waitTimer);
      waitTimer = 0;
    }
    if (submitBtn) submitBtn.disabled = false;
  }

  form.addEventListener("submit", function (event) {
    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && String(honeypot.value || "").trim()) {
      event.preventDefault();
      setStatus("ID or password is incorrect.", true);
      return;
    }

    waiting = true;
    setStatus("Checking…", false);
    if (submitBtn) submitBtn.disabled = true;
    if (waitTimer) window.clearTimeout(waitTimer);
    waitTimer = window.setTimeout(function () {
      finishWait();
      setStatus("Could not reach the login server. Please try again.", true);
    }, 15000);
  });

  window.addEventListener("message", function (event) {
    if (!waiting) return;
    if (!isAllowedOrigin(event.origin)) return;

    var data = event.data;
    if (!data || data.type !== "naf-sunflowers-auth") return;

    finishWait();

    if (data.ok && data.embedUrl) {
      saveSession(data.embedUrl);
      setStatus("", false);
      form.reset();
      if (originInput) originInput.value = location.origin;
      showScreen(data.embedUrl);
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
