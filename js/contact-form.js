(function () {
  "use strict";

  var openBtn = document.getElementById("consult-open");
  var closeBtn = document.getElementById("consult-close");
  var wrap = document.getElementById("consult-form-wrap");
  var form = document.getElementById("consult-form");
  if (!form || !wrap) return;

  var statusEl = document.getElementById("consult-form-status");
  var submitBtn = form.querySelector('button[type="submit"]');
  var iframe = document.getElementById("consult-form-frame");
  var config = window.NAF_CMS_CONFIG || {};
  var endpoint = (config.WEB_APP_URL || "").trim();
  var titleInput = form.querySelector('input[name="title"]');

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.classList.toggle("is-success", !!message && !isError);
  }

  function openForm() {
    wrap.hidden = false;
    if (openBtn) openBtn.setAttribute("aria-expanded", "true");
    if (titleInput) titleInput.focus();
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closeForm() {
    wrap.hidden = true;
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    setStatus("", false);
  }

  if (openBtn) {
    openBtn.addEventListener("click", function () {
      if (wrap.hidden) openForm();
      else closeForm();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeForm);
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
