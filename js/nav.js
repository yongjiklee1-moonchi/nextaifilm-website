const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const MOBILE_NAV_MAX = 1100;

function menuLabel(isOpen) {
  if (window.NAF_I18N && typeof window.NAF_I18N.t === "function") {
    return window.NAF_I18N.t(isOpen ? "nav.close" : "nav.open");
  }
  return isOpen ? "메뉴 닫기" : "메뉴 열기";
}

function isMobileNav() {
  return window.matchMedia("(max-width: " + MOBILE_NAV_MAX + "px)").matches;
}

function setMobileMenuOpen(isOpen) {
  if (!menuToggle || !nav) return;
  isOpen = !!isOpen && isMobileNav();
  nav.classList.toggle("open", isOpen);
  menuToggle.classList.toggle("open", isOpen);
  document.body.classList.toggle("nav-open", isOpen);
  menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  menuToggle.setAttribute("aria-label", menuLabel(isOpen));
}

function closeMobileMenu() {
  setMobileMenuOpen(false);
}

if (menuToggle && nav) {
  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setMobileMenuOpen(!nav.classList.contains("open"));
  });

  document.querySelectorAll(".nav__list a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("open")) return;
    if (nav.contains(event.target) || menuToggle.contains(event.target)) return;
    closeMobileMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMobileMenu();
  });

  window.addEventListener("resize", () => {
    if (!isMobileNav()) closeMobileMenu();
  });
}

function pageKey(path) {
  const end = (path || "").split("/").filter(Boolean).pop() || "";
  if (!end || end === "index.html" || end === "index") return "home";
  return end.replace(/\.html$/i, "");
}

const currentPage = pageKey(window.location.pathname);

document.querySelectorAll(".nav__list a").forEach((link) => {
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href === "/") return;

  if (pageKey(href) === currentPage) {
    link.classList.add("active");
    const worksItem = link.closest(".nav__item--works");
    if (worksItem) {
      const toggle = worksItem.querySelector(".nav__works-toggle");
      if (toggle) toggle.classList.add("active");
    }
  }
});

document.querySelectorAll(".nav__item--works").forEach((item) => {
  const toggle = item.querySelector(".nav__works-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const isOpen = item.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

    document.querySelectorAll(".nav__item--works").forEach((other) => {
      if (other === item) return;
      other.classList.remove("is-open");
      const otherToggle = other.querySelector(".nav__works-toggle");
      if (otherToggle) otherToggle.setAttribute("aria-expanded", "false");
    });
  });
});

document.addEventListener("click", (event) => {
  document.querySelectorAll(".nav__item--works.is-open").forEach((item) => {
    if (item.contains(event.target)) return;
    item.classList.remove("is-open");
    const toggle = item.querySelector(".nav__works-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  });
});

function clearBrowserTranslateCookies() {
  const expire = "Thu, 01 Jan 1970 00:00:00 GMT";
  const host = location.hostname;
  ["googtrans", "googtransopt"].forEach((name) => {
    document.cookie = `${name}=; expires=${expire}; path=/`;
    document.cookie = `${name}=; expires=${expire}; path=/; domain=${host}`;
    if (host.includes(".")) {
      document.cookie = `${name}=; expires=${expire}; path=/; domain=.${host}`;
    }
  });
}

(function initLogoHomeEnglish() {
  const logo = document.querySelector("a.logo");
  if (!logo) return;

  logo.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();

    try {
      sessionStorage.setItem("naf-lang", "en");
      sessionStorage.setItem("naf-home-en", "1");
    } catch (e) {}

    clearBrowserTranslateCookies();

    const href = logo.getAttribute("href") || "/";
    window.location.assign(href);
  });
})();

if (!document.getElementById("hero-player")) {
  const logo = document.querySelector(".logo");
  const prefetchHome = () => {
    if (!document.querySelector('link[rel="prefetch"][href="/"]')) {
      const prefetch = document.createElement("link");
      prefetch.rel = "prefetch";
      prefetch.href = "/";
      document.head.appendChild(prefetch);
    }
  };

  if (logo) {
    logo.addEventListener("mouseenter", prefetchHome, { once: true });
  }

  if ("requestIdleCallback" in window) {
    requestIdleCallback(prefetchHome, { timeout: 2000 });
  } else {
    window.setTimeout(prefetchHome, 1500);
  }
}

(function initBackToTop() {
  const btn = document.querySelector(".back-to-top");
  if (!btn) return;

  const toggle = () => {
    btn.classList.toggle("is-visible", window.scrollY > 200);
  };

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", toggle, { passive: true });
  toggle();
})();
