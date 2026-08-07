(function () {
  "use strict";

  var form = document.getElementById("consult-form");
  if (!form) return;

  var statusEl = document.getElementById("consult-form-status");
  var submitBtn = form.querySelector('button[type="submit"]');
  var iframe = document.getElementById("consult-form-frame");
  var config = window.NAF_CMS_CONFIG || {};
  var endpoint = (config.WEB_APP_URL || "").trim();

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.classList.toggle("is-success", !!message && !isError);
  }

  if (!endpoint) {
    setStatus("Form is not connected yet. Please email hello@nextaifilm.com.", true);
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  form.setAttribute("action", endpoint);

  var agentInput = form.querySelector('input[name="userAgent"]');
  if (agentInput) {
    agentInput.value = navigator.userAgent || "";
  }

  var waiting = false;

  form.addEventListener("submit", function () {
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
      if (agentInput) agentInput.value = navigator.userAgent || "";
      setStatus("Thank you. We will get back to you soon.", false);
    });
  }
})();
