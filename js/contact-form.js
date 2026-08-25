(function () {
  "use strict";

  var MIN_FILL_MS = 2500;
  var MAIL_TO = "hello@nextaifilm.com";
  var form = document.getElementById("consult-form");
  if (!form) return;

  var statusEl = document.getElementById("consult-form-status");
  var submitBtn = form.querySelector('button[type="submit"]');
  var startedAt = Date.now();

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

  setStarted();

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && String(honeypot.value || "").trim()) {
      form.reset();
      setStarted();
      setStatus("Thank you. We will get back to you soon.", false);
      return;
    }

    if (Date.now() - startedAt < MIN_FILL_MS) {
      setStatus("Please take a moment to complete the form, then send again.", true);
      return;
    }

    var title = String((form.elements.title && form.elements.title.value) || "").trim();
    var email = String((form.elements.email && form.elements.email.value) || "").trim();
    var message = String((form.elements.message && form.elements.message.value) || "").trim();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus("Please enter a valid email address.", true);
      return;
    }
    if (message.length < 5) {
      setStatus("Please write a short message.", true);
      return;
    }

    var body = "From: " + email + "\n\n" + message;
    var href =
      "mailto:" +
      MAIL_TO +
      "?subject=" +
      encodeURIComponent(title || "Inquiry") +
      "&body=" +
      encodeURIComponent(body);

    window.location.href = href;
    setStatus("Your email app should open with the message ready to send.", false);
    if (submitBtn) submitBtn.disabled = false;
  });
})();
