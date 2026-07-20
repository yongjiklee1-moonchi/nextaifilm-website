const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

function menuLabel(isOpen) {
  if (window.NAF_I18N && typeof window.NAF_I18N.t === "function") {
    return window.NAF_I18N.t(isOpen ? "nav.close" : "nav.open");
  }
  return isOpen ? "메뉴 닫기" : "메뉴 열기";
}

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute("aria-label", menuLabel(isOpen));
  });

  document.querySelectorAll(".nav__list a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", menuLabel(false));
    });
  });
}

const currentPage = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".nav__list a").forEach((link) => {
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#")) return;

  const linkPage = href.split("/").pop();
  if (linkPage === currentPage) {
    link.classList.add("active");
  }
});

if (!document.getElementById("hero-player")) {
  const logo = document.querySelector(".logo");
  const prefetchHome = () => {
    if (!document.querySelector('link[rel="prefetch"][href="index.html"]')) {
      const prefetch = document.createElement("link");
      prefetch.rel = "prefetch";
      prefetch.href = "index.html";
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
