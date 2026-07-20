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
      festival: "17th New Media Film Festival®",
      category: "Best AI Winner",
      location: "Los Angeles, USA",
      date: "June 2026",
      summary: "Sunflowers received Best AI Winner at the 17th New Media Film Festival in Los Angeles.",
      film: "Sunflowers",
      country: "South Korea",
      premiere: "World",
      director: "YongJik Lee",
      icon: "trophy",
      thumb: ""
    },
    {
      type: "award",
      year: "2025",
      festival: "Cannes World Film Festival",
      category: "Best AI Film Nominee",
      location: "Cannes, France",
      date: "May 2025",
      summary: "Sunflowers was nominated for Best AI Film at the Cannes World Film Festival.",
      icon: "film",
      thumb: ""
    },
    {
      type: "upcoming",
      year: "Upcoming",
      title: "More Festivals & Screenings",
      summary: "We are continuing our journey and will update upcoming selections.",
      icon: "camera",
      buttonLabel: "View All Updates",
      buttonHref: "#"
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
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 4h8v3a4 4 0 0 1-8 0V4z"></path>
        <path d="M8 5H5.5a2.5 2.5 0 0 0 0 5H8"></path>
        <path d="M16 5h2.5a2.5 2.5 0 0 1 0 5H16"></path>
        <path d="M12 11v3"></path>
        <path d="M9 20h6"></path>
        <path d="M10 17h4v3h-4z"></path>
      </svg>
    `;
  } else if (icon === "film") {
    svg = `
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2"></rect>
        <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"></path>
      </svg>
    `;
  } else {
    svg = `
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="14" height="11" rx="2"></rect>
        <path d="M16 10l6-3v11l-6-3z"></path>
        <circle cx="7.5" cy="12.5" r="1.6"></circle>
      </svg>
    `;
  }

  return `
    <span class="award-card__badge award-card__badge--icon award-card__badge--${escapeHtml(icon)}" aria-hidden="true">
      ${svg}
    </span>
  `;
}

function renderBadge(item, variant) {
  if (variant === "upcoming" || item.icon === "camera") {
    return renderIconBadge("camera");
  }
  if (item.icon === "trophy" || item.icon === "film") {
    return renderIconBadge(item.icon);
  }
  if (item.badge) {
    return `<img class="award-card__badge" src="${escapeHtml(item.badge)}" alt="" />`;
  }
  return renderIconBadge("film");
}

function renderAwardCard(item) {
  const thumbBlock = item.thumb
    ? `<div class="award-card__thumb"><img src="${escapeHtml(item.thumb)}" alt="" /></div>`
    : item.film
      ? `
        <div class="award-card__thumb award-card__thumb--text">
          <p class="award-card__thumb-title">BEST AI – ${escapeHtml(item.film)}</p>
          ${item.country ? `<p>Country ${escapeHtml(item.country)}</p>` : ""}
          ${item.premiere ? `<p>Premiere ${escapeHtml(item.premiere)}</p>` : ""}
          ${item.director ? `<p>Director ${escapeHtml(item.director)}</p>` : ""}
        </div>
      `
      : "";

  return `
    <li class="awards-list__item">
      <article class="award-item">
        <div class="award-item__year">
          <span>${escapeHtml(item.year)}</span>
        </div>
        <div class="award-card">
          ${renderBadge(item)}
          <div class="award-card__body">
            <h3 class="award-card__festival">${escapeHtml(item.festival)}</h3>
            <p class="award-card__category">${escapeHtml(item.category)}</p>
            ${renderMetaRow("📍", item.location)}
            ${renderMetaRow("📅", item.date)}
            ${item.summary ? `<p class="award-card__summary">${escapeHtml(item.summary)}</p>` : ""}
          </div>
          ${thumbBlock}
        </div>
      </article>
    </li>
  `;
}

function renderUpcomingCard(item) {
  const button = item.buttonHref
    ? `<a class="award-card__btn" href="${escapeHtml(item.buttonHref)}">${escapeHtml(item.buttonLabel || "View All Updates")}</a>`
    : "";

  return `
    <li class="awards-list__item">
      <article class="award-item award-item--upcoming">
        <div class="award-item__year">
          <span>${escapeHtml(item.year)}</span>
        </div>
        <div class="award-card award-card--upcoming">
          ${renderBadge(item, "upcoming")}
          <div class="award-card__body">
            <h3 class="award-card__festival">${escapeHtml(item.title)}</h3>
            <p class="award-card__summary">${escapeHtml(item.summary)}</p>
          </div>
          ${button}
        </div>
      </article>
    </li>
  `;
}

function renderAwardsList(items) {
  return items
    .map((item) => (item.type === "upcoming" ? renderUpcomingCard(item) : renderAwardCard(item)))
    .join("");
}

function applyAwardsData(data) {
  const listEl = document.getElementById("awards-list");
  const noteEl = document.getElementById("awards-list-note");
  if (!listEl) return;

  listEl.innerHTML = renderAwardsList((data && data.items) || []);

  if (noteEl && data && data.updated) {
    noteEl.textContent = `* Information is updated as of ${data.updated}.`;
  }
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
