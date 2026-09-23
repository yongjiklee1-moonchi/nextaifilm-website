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
  var START_NEAR_SECONDS = 3;
  var PROGRESS_INTERVAL_MS = 12000;
  var playStartCount = 0;
  var replayCount = 0;
  var completedViewCount = 0;
  var lastPosition = 0;
  var lastDuration = 0;
  var nearStartArmed = true;
  var lastProgressSentAt = 0;
  var lastPauseSentAt = 0;
  var progressTimer = 0;
  var exitSent = false;
  var replayBtn = document.getElementById("sunflowers-replay");
  var eventForm = document.getElementById("sunflowers-event");
  var linkedinBtn = document.getElementById("sunflowers-linkedin");
  var currentSessionId = "";
  var eventWaitTimer = 0;
  var eventWaitDone = null;
  var endFadeTimer = 0;

  function clearEndFadeTimer() {
    if (endFadeTimer) {
      window.clearTimeout(endFadeTimer);
      endFadeTimer = 0;
    }
  }

  function unloadPlayer() {
    if (progressTimer) {
      window.clearInterval(progressTimer);
      progressTimer = 0;
    }
    if (vimeoPlayer) {
      try {
        vimeoPlayer.off("ended");
        vimeoPlayer.off("timeupdate");
        vimeoPlayer.off("play");
        vimeoPlayer.off("pause");
        vimeoPlayer.off("seeked");
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
    lastPosition = FILM_END_SECONDS;
    completedViewCount += 1;
    nearStartArmed = true;
    persistAnalytics();
    sendGaScreeningEvent("film_complete");
    trackScreeningEvent("film_complete");
    if (vimeoPlayer) {
      try {
        vimeoPlayer.pause();
      } catch (err) {}
    }
    if (screen) screen.classList.add("is-ended");
    clearEndFadeTimer();
    endFadeTimer = window.setTimeout(function () {
      endFadeTimer = 0;
      unloadPlayer();
    }, 1600);
    if (screen && screen.scrollIntoView) {
      screen.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function persistAnalytics() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : {};
      if (!data || !data.embedUrl) return;
      data.sessionId = currentSessionId || data.sessionId || "";
      data.playStartCount = playStartCount;
      data.replayCount = replayCount;
      data.completedViewCount = completedViewCount;
      data.lastPosition = lastPosition;
      data.lastDuration = lastDuration;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {}
  }

  function resetAnalyticsCounts() {
    playStartCount = 0;
    replayCount = 0;
    completedViewCount = 0;
    lastPosition = 0;
    lastDuration = 0;
    nearStartArmed = true;
    lastProgressSentAt = 0;
    lastPauseSentAt = 0;
    exitSent = false;
  }

  function loadAnalyticsFromSession(data) {
    if (!data) return;
    playStartCount = Number(data.playStartCount || 0);
    replayCount = Number(data.replayCount || 0);
    completedViewCount = Number(data.completedViewCount || 0);
    lastPosition = Number(data.lastPosition || 0);
    lastDuration = Number(data.lastDuration || 0);
    nearStartArmed = true;
  }

  function analyticsStats() {
    return {
      position: Math.max(0, Math.round(lastPosition * 10) / 10),
      duration: Math.max(0, Math.round(lastDuration * 10) / 10),
      playStartCount: playStartCount,
      completedViewCount: completedViewCount,
      replayCount: replayCount
    };
  }

  function notePlaybackTime(seconds, duration) {
    if (typeof seconds === "number" && !isNaN(seconds)) lastPosition = seconds;
    if (typeof duration === "number" && duration > 0) lastDuration = duration;
    persistAnalytics();
  }

  function maybeGenuineStart(seconds) {
    if (seconds > START_NEAR_SECONDS) {
      nearStartArmed = false;
      return;
    }
    if (!nearStartArmed) return;
    nearStartArmed = false;
    playStartCount += 1;
    if (playStartCount > 1) replayCount += 1;
    persistAnalytics();
    exitSent = false;
    trackScreeningEvent("video_start");
  }

  function flushProgress(force) {
    var now = Date.now();
    if (!force && lastProgressSentAt && now - lastProgressSentAt < PROGRESS_INTERVAL_MS) return;
    lastProgressSentAt = now;
    persistAnalytics();
    trackScreeningEvent("video_progress");
  }

  function attachPlayer() {
    if (!frame || typeof window.Vimeo === "undefined" || !window.Vimeo.Player) return;
    if (vimeoPlayer) {
      try {
        vimeoPlayer.off("ended");
        vimeoPlayer.off("timeupdate");
        vimeoPlayer.off("play");
        vimeoPlayer.off("pause");
        vimeoPlayer.off("seeked");
      } catch (err) {}
      vimeoPlayer = null;
    }
    vimeoPlayer = new window.Vimeo.Player(frame);
    if (progressTimer) window.clearInterval(progressTimer);
    progressTimer = window.setInterval(function () {
      if (filmEnded || !vimeoPlayer) return;
      flushProgress(false);
    }, PROGRESS_INTERVAL_MS);

    vimeoPlayer.on("ended", finishFilm);
    vimeoPlayer.on("play", function () {
      if (filmEnded || !vimeoPlayer) return;
      vimeoPlayer.getCurrentTime().then(function (t) {
        vimeoPlayer.getDuration().then(function (d) {
          notePlaybackTime(Number(t || 0), Number(d || 0));
          maybeGenuineStart(Number(t || 0));
        });
      }).catch(function () {});
    });
    vimeoPlayer.on("pause", function () {
      if (filmEnded || !vimeoPlayer) return;
      vimeoPlayer.getCurrentTime().then(function (t) {
        vimeoPlayer.getDuration().then(function (d) {
          notePlaybackTime(Number(t || 0), Number(d || 0));
          var now = Date.now();
          if (!lastPauseSentAt || now - lastPauseSentAt > 8000) {
            lastPauseSentAt = now;
            trackScreeningEvent("video_pause");
          } else {
            flushProgress(true);
          }
        });
      }).catch(function () {});
    });
    vimeoPlayer.on("seeked", function (data) {
      if (filmEnded) return;
      var t = data && typeof data.seconds === "number" ? data.seconds : lastPosition;
      if (t <= START_NEAR_SECONDS && lastPosition > START_NEAR_SECONDS + 2) {
        nearStartArmed = true;
      } else if (t > START_NEAR_SECONDS) {
        nearStartArmed = false;
      }
      notePlaybackTime(t, lastDuration);
      flushProgress(true);
    });
    vimeoPlayer.on("timeupdate", function (data) {
      if (!data || filmEnded) return;
      notePlaybackTime(data.seconds, data.duration);
      if (data.seconds > START_NEAR_SECONDS) nearStartArmed = false;
      if (data.seconds >= FILM_END_SECONDS) finishFilm();
    });
  }

  function replayFilm() {
    if (!lastEmbedUrl) return;
    clearEndFadeTimer();
    filmEnded = false;
    nearStartArmed = true;
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
    clearEndFadeTimer();
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
    clearEndFadeTimer();
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
    sendExitIfNeeded();
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

  function saveSession(embedUrl, sessionHours, sessionId) {
    var hours = Number(sessionHours);
    if (!hours || hours <= 0) hours = SESSION_HOURS;
    var exp = Date.now() + hours * 60 * 60 * 1000;
    if (sessionId) currentSessionId = String(sessionId);
    resetAnalyticsCounts();
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          embedUrl: embedUrl,
          exp: exp,
          sessionId: currentSessionId || "",
          playStartCount: 0,
          replayCount: 0,
          completedViewCount: 0,
          lastPosition: 0,
          lastDuration: 0
        })
      );
    } catch (err) {}
    return exp;
  }

  function clearSession() {
    currentSessionId = "";
    resetAnalyticsCounts();
    filmEnded = false;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
  }

  function authErrorMessage(error) {
    if (error === "too_many") return "Too many attempts. Please wait a few minutes.";
    if (error === "name") return "Please enter your LinkedIn name.";
    return "Password is incorrect.";
  }

  function finishEventWait() {
    if (eventWaitTimer) {
      window.clearTimeout(eventWaitTimer);
      eventWaitTimer = 0;
    }
    var cb = eventWaitDone;
    eventWaitDone = null;
    if (cb) cb();
  }

  function sendGaScreeningEvent(eventName) {
    if (typeof window.gtag !== "function") return;
    if (
      eventName !== "screening_login" &&
      eventName !== "film_complete" &&
      eventName !== "linkedin_click"
    ) {
      return;
    }
    window.gtag("event", eventName, { film: "SUNFLOWERS" });
  }

  function sendExitIfNeeded() {
    if (!currentSessionId || exitSent) return;
    if (playStartCount < 1 && lastPosition <= 0) return;
    exitSent = true;
    trackScreeningEvent("video_exit");
  }

  function trackScreeningEvent(eventName, done) {
    if (typeof done !== "function") done = null;
    if (!AUTH_ENDPOINT || !eventForm || !currentSessionId) {
      if (done) done();
      return;
    }
    if (eventName === "video_progress" && eventWaitTimer) {
      if (done) done();
      return;
    }

    var stats = analyticsStats();
    var originField = eventForm.querySelector('input[name="origin"]');
    var sessionField = eventForm.querySelector('input[name="sessionId"]');
    var eventField = eventForm.querySelector('input[name="event"]');
    var positionField = eventForm.querySelector('input[name="position"]');
    var durationField = eventForm.querySelector('input[name="duration"]');
    var startField = eventForm.querySelector('input[name="playStartCount"]');
    var completeField = eventForm.querySelector('input[name="completedViewCount"]');
    var replayField = eventForm.querySelector('input[name="replayCount"]');
    if (originField) originField.value = location.origin;
    if (sessionField) sessionField.value = currentSessionId;
    if (eventField) eventField.value = eventName;
    if (positionField) positionField.value = String(stats.position);
    if (durationField) durationField.value = String(stats.duration);
    if (startField) startField.value = String(stats.playStartCount);
    if (completeField) completeField.value = String(stats.completedViewCount);
    if (replayField) replayField.value = String(stats.replayCount);
    eventForm.setAttribute("action", AUTH_ENDPOINT);

    if (eventWaitTimer) {
      window.clearTimeout(eventWaitTimer);
      eventWaitTimer = 0;
    }
    eventWaitDone = done;
    eventWaitTimer = window.setTimeout(finishEventWait, done ? 1800 : 2500);

    try {
      eventForm.submit();
    } catch (err) {
      finishEventWait();
    }
  }

  function openLinkedIn(href) {
    if (!href) return;
    var opened = window.open(href, "_blank", "noopener,noreferrer");
    if (!opened) window.location.href = href;
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

  function openTheater(embedUrl, sessionHours, sessionId) {
    if (!embedUrl) return;
    var exp = saveSession(embedUrl, sessionHours, sessionId);
    sendGaScreeningEvent("screening_login");
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
      setStatus(authErrorMessage("invalid"), true);
      return true;
    }

    if (data && data.ok && data.embedUrl) {
      openTheater(data.embedUrl, data.sessionHours, data.sessionId);
      return true;
    }

    setStatus(authErrorMessage(data && data.error), true);
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

  if (eventForm) {
    eventForm.setAttribute("action", AUTH_ENDPOINT);
    eventForm.setAttribute("method", "POST");
    eventForm.setAttribute("target", "sunflowers-event-frame");
  }

  if (originInput) {
    originInput.value = location.origin;
  }

  if (!consumeAuthHash()) {
    var session = readSession();
    if (session) {
      currentSessionId = String(session.sessionId || "");
      loadAnalyticsFromSession(session);
      showScreen(session.embedUrl, session.exp);
    }
  }

  form.addEventListener("submit", function (event) {
    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && String(honeypot.value || "").trim()) {
      event.preventDefault();
      setStatus(authErrorMessage("invalid"), true);
      return;
    }

    var nameInput = form.querySelector('input[name="linkedinName"]');
    var linkedinName = nameInput ? String(nameInput.value || "").replace(/\s+/g, " ").trim() : "";
    if (linkedinName.length < 2) {
      event.preventDefault();
      setStatus(authErrorMessage("name"), true);
      return;
    }
    if (nameInput) nameInput.value = linkedinName;

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
    var data = event.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (err) {
        return;
      }
    }
    if (!data || !data.type) return;
    if (event.origin && !isAllowedOrigin(event.origin)) return;

    if (data.type === "naf-sunflowers-event") {
      finishEventWait();
      return;
    }

    if (!waiting) return;
    if (data.type !== "naf-sunflowers-auth") return;

    finishWait();

    if (data.ok && data.embedUrl) {
      openTheater(data.embedUrl, data.sessionHours, data.sessionId);
      return;
    }

    setStatus(authErrorMessage(data && data.error), true);
  });

  var logout = document.getElementById("sunflowers-logout");
  if (logout) {
    logout.addEventListener("click", function () {
      sendExitIfNeeded();
      clearSession();
      hideScreen();
      setStatus("", false);
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener("click", replayFilm);
  }

  if (linkedinBtn) {
    linkedinBtn.addEventListener("click", function (event) {
      event.preventDefault();
      var href = linkedinBtn.getAttribute("href");
      sendGaScreeningEvent("linkedin_click");
      trackScreeningEvent("linkedin_click", function () {
        openLinkedIn(href);
      });
    });
  }

  window.addEventListener("pagehide", sendExitIfNeeded);
})();
