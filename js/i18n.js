(function () {
  "use strict";

  var STORAGE_KEY = "naf-lang";
  var DEFAULT_LANG = "en";
  var storage = window.sessionStorage;
  var translations = null;
  var currentLang = DEFAULT_LANG;

  function getSavedLang() {
    try {
      var saved = storage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "ko") {
        return saved;
      }
    } catch (e) {}
    return DEFAULT_LANG;
  }

  function saveLang(lang) {
    try {
      storage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  function t(key) {
    if (!translations || !translations[currentLang]) {
      return key;
    }
    return translations[currentLang][key] || (translations.en && translations.en[key]) || key;
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang === "ko" ? "ko" : "en";

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      var value = t(key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.setAttribute("placeholder", value);
      } else {
        el.textContent = value;
      }
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (!key) return;
      el.setAttribute("aria-label", t(key));
    });

    document.querySelectorAll(".lang-switch__btn").forEach(function (btn) {
      var lang = btn.getAttribute("data-lang");
      var active = lang === currentLang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    var menuToggle = document.querySelector(".menu-toggle");
    if (menuToggle) {
      var nav = document.querySelector(".nav");
      var isOpen = nav && nav.classList.contains("open");
      menuToggle.setAttribute("aria-label", t(isOpen ? "nav.close" : "nav.open"));
    }
  }

  function setLang(lang) {
    if (lang !== "en" && lang !== "ko") return;
    currentLang = lang;
    saveLang(lang);
    applyTranslations();
    document.dispatchEvent(
      new CustomEvent("naf:langchange", { detail: { lang: currentLang } })
    );
  }

  function bindSwitch() {
    document.querySelectorAll(".lang-switch__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
      });
    });
  }

  function boot(data) {
    translations = data;
    currentLang = getSavedLang();
    bindSwitch();
    applyTranslations();
  }

  function load() {
    fetch("data/translations.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("translations missing");
        return res.json();
      })
      .then(boot)
      .catch(function () {
        boot({
          en: {
            "nav.commercial": "Commercial",
            "nav.film": "Film",
            "nav.awards": "Awards",
            "nav.about": "About",
            "nav.contact": "Contact",
            "nav.open": "Open menu",
            "nav.close": "Close menu",
            "lang.label": "Language",
            "logo.text": "Next AI Film Studio"
          },
          ko: {
            "nav.commercial": "광고제작",
            "nav.film": "영화",
            "nav.awards": "수상&성과",
            "nav.about": "소개",
            "nav.contact": "문의",
            "nav.open": "메뉴 열기",
            "nav.close": "메뉴 닫기",
            "lang.label": "언어",
            "logo.text": "넥스트 에이아이 필름 스튜디오"
          }
        });
      });
  }

  window.NAF_I18N = {
    t: t,
    setLang: setLang,
    getLang: function () {
      return currentLang;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
