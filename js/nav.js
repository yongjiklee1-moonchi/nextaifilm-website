const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
  });

  document.querySelectorAll(".nav__list a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "메뉴 열기");
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

if (!document.getElementById("vimeo-player")) {
  ["https://player.vimeo.com", "https://i.vimeocdn.com", "https://f.vimeocdn.com"].forEach((href) => {
    if (!document.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }
  });

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
