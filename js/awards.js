/**
 * Awards list renderer
 *
 * 지금: data/awards.json 에서 읽음
 * 나중에 Google Sheets 연동 시 fetch URL만 교체하면 됩니다.
 *
 * 새 수상 추가: awards.json 의 items 배열에 객체 하나 추가 (연도당 카드 1개)
 */

const AWARDS_DATA_URL = "data/awards.json";

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
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

async function loadAwardsData() {
  const response = await fetch(AWARDS_DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to load awards data: ${response.status}`);
  }
  return response.json();
}

async function initAwardsList() {
  const listEl = document.getElementById("awards-list");
  const noteEl = document.getElementById("awards-list-note");

  if (!listEl) return;

  try {
    const data = await loadAwardsData();
    listEl.innerHTML = renderAwardsList(data.items || []);

    if (noteEl && data.updated) {
      noteEl.textContent = `* Information is updated as of ${data.updated}.`;
    }
  } catch (error) {
    console.error(error);
    listEl.innerHTML = `
      <li class="awards-list__item awards-list__item--error">
        <p>Awards list could not be loaded. Please try again later.</p>
      </li>
    `;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAwardsList);
} else {
  initAwardsList();
}
