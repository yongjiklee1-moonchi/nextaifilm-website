/**
 * Awards list renderer
 *
 * Primary: embedded AWARDS_DATA (works with file:// and static hosting)
 * Optional: fetch data/awards.json when available (for later Google Sheets swap)
 */

const AWARDS_DATA_URL = "data/awards.json";

const AWARDS_DATA = {
  updated: "June 2026",
  items: [
    {
      type: "award",
      year: "2026",
      film: "Sunflowers",
      festival: "17th New Media Film Festival®",
      category: "Best AI Winner",
      location: "Los Angeles, USA",
      date: "June 2026",
      summary: "Sunflowers received Best AI Winner at the 17th New Media Film Festival in Los Angeles.",
      icon: "trophy",
      laurel: "assets/awards/awards-badge-winner.png",
      laurelAlt: "Best AI Winner — 17th New Media Film Festival"
    },
    {
      type: "award",
      year: "2025",
      film: "Sunflowers",
      festival: "Cannes World Film Festival",
      category: "Best AI Film Nominee",
      location: "Cannes, France",
      date: "May 2025",
      summary: "Sunflowers was nominated for Best AI Film at the Cannes World Film Festival.",
      icon: "film",
      laurel: "assets/awards/awards-badge-nominee.png",
      laurelAlt: "Best AI Film Nominee — Cannes World Film Festival"
    }
  ]
};

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function renderMetaRow(icon, label) {
  return `
    <p class="award-card__meta-row">
      <span class="award-card__meta-icon" aria-hidden="true">${icon}</span>
      <span>${escapeHtml(label)}</span>
    </p>
  `;
}

function renderIconBadge(icon) {
  var svg = "";

  if (icon === "trophy") {
    svg = `
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 4h8v3a4 4 0 0 1-8 0V4z"></path>
        <path d="M8 5H5.5a2.5 2.5 0 0 0 0 5H8"></path>
        <path d="M16 5h2.5a2.5 2.5 0 0 1 0 5H16"></path>
        <path d="M12 11v3"></path>
        <path d="M9 20h6"></path>
        <path d="M10 17h4v3h-4z"></path>
      </svg>
    `;
  } else {
    svg = `
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2"></rect>
        <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"></path>
      </svg>
    `;
  }

  return `
    <span class="award-card__badge award-card__badge--icon award-card__badge--${escapeHtml(icon)}" aria-hidden="true">
      ${svg}
    </span>
  `;
}

function renderAwardCard(item) {
  const laurelBlock = item.laurel
    ? `<div class="award-card__laurel"><img src="${escapeHtml(item.laurel)}" alt="${escapeHtml(item.laurelAlt || "")}" width="200" height="200" loading="lazy" decoding="async" /></div>`
    : "";

  const metaParts = [];
  if (item.location) metaParts.push(renderMetaRow("📍", item.location));
  if (item.date) metaParts.push(renderMetaRow("📅", item.date));

  return `
    <li class="awards-list__item">
      <article class="award-item">
        <div class="award-item__year">
          <span>${escapeHtml(item.year)}</span>
        </div>
        <div class="award-card">
          ${renderIconBadge(item.icon || "film")}
          <div class="award-card__body">
            <h3 class="award-card__film">${escapeHtml(item.film || item.festival)}</h3>
            <p class="award-card__category">${escapeHtml(item.category)}</p>
            <p class="award-card__festival">${escapeHtml(item.festival)}</p>
            <div class="award-card__meta">
              ${metaParts.join("")}
            </div>
            ${item.summary ? `<p class="award-card__summary">${escapeHtml(item.summary)}</p>` : ""}
          </div>
          ${laurelBlock}
        </div>
      </article>
    </li>
  `;
}

function renderAwardsList(items) {
  return items
    .filter((item) => item.type !== "upcoming")
    .map((item) => renderAwardCard(item))
    .join("");
}

function applyAwardsData(data) {
  const listEl = document.getElementById("awards-list");
  if (!listEl) return;
  listEl.innerHTML = renderAwardsList((data && data.items) || []);
}

async function loadAwardsData() {
  try {
    const response = await fetch(AWARDS_DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load awards data: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Using embedded awards data:", error);
    return AWARDS_DATA;
  }
}

async function initAwardsList() {
  const listEl = document.getElementById("awards-list");
  if (!listEl) return;

  try {
    const data = await loadAwardsData();
    applyAwardsData(data && Array.isArray(data.items) ? data : AWARDS_DATA);
  } catch (error) {
    console.error(error);
    applyAwardsData(AWARDS_DATA);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAwardsList);
} else {
  initAwardsList();
}
