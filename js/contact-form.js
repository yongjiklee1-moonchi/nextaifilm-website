(function () {
  "use strict";

  var MIN_FILL_MS = 1500;
  var FORM_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzxflmPdifREqT7Ffrxg_KeofOTNsI_m3EPpuf3y2SvUgGOMQm8mGUvMh2YnDf-tLGdZw/exec";

  var form = document.getElementById("consult-form");
  if (!form) return;

  var statusEl = document.getElementById("consult-form-status");
  var submitBtn = form.querySelector('button[type="submit"]');
  var iframe = document.getElementById("consult-form-frame");
  var startedAt = Date.now();
  var waiting = false;

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.classList.toggle("is-success", !!message && !isError);
  }

  function setStarted() {
    startedAt = Date.now();
    var startedInput = form.querySelector('input[name="formStarted"]');
    if (startedInput) startedInput.value = String(startedAt);
  }

  form.setAttribute("action", FORM_ENDPOINT);
  form.setAttribute("method", "POST");
  form.setAttribute("target", "consult-form-frame");
  setStarted();

  var agentInput = form.querySelector('input[name="userAgent"]');
  if (agentInput) {
    agentInput.value = navigator.userAgent || "";
  }

  form.addEventListener("submit", function (event) {
    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && String(honeypot.value || "").trim()) {
      event.preventDefault();
      form.reset();
      setStarted();
      setStatus("Thank you. We will get back to you soon.", false);
      return;
    }

    if (Date.now() - startedAt < MIN_FILL_MS) {
      event.preventDefault();
      setStatus("Please take a moment to complete the form, then send again.", true);
      return;
    }

    waiting = true;
    setStatus("Sending…", false);
    if (submitBtn) submitBtn.disabled = true;
  });

  if (iframe) {
    iframe.addEventListener("load", function () {
      if (!waiting) return;
      waiting = false;
      if (submitBtn) submitBtn.disabled = false;
      form.reset();
      setStarted();
      if (agentInput) agentInput.value = navigator.userAgent || "";
      setStatus("Thank you. We will get back to you soon.", false);
    });
  }
})();
