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

function renderBadge(item, variant) {
  if (variant === "upcoming") {
    return `
      <span class="award-card__badge award-card__badge--icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#333" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="6" width="18" height="14" rx="2"></rect>
          <path d="M8 6V4M16 6V4M3 11h18"></path>
          <circle cx="12" cy="15" r="2.2"></circle>
        </svg>
      </span>
    `;
  }

  if (item.badge) {
    return `<img class="award-card__badge" src="${escapeHtml(item.badge)}" alt="" />`;
  }

  return `<div class="award-card__badge award-card__badge--empty" aria-hidden="true"></div>`;
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
