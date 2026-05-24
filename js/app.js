/* ============================================================
   UEH Study Space — app.js
   F1: Danh sách + card + popup chi tiết
   F2: Bộ lọc campus & tiêu chí (AND logic)
   F3: Hiển thị trạng thái động từ Apps Script
   F4: Báo trạng thái + đánh giá (POST thật)
   ============================================================ */

// ── APPS SCRIPT URL ──
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwrxb-x6ovUylifoRBVRChRuM6FBS3fO-gQAJNnP1zAO3m81Fo0k3l2xCwUlOENwmKvoQ/exec";

// ── IMAGE MAP (folder → best representative image) ──
const IMAGE_MAP = {
  "thu-vien-thong-minh":         "assets/images/Thư viện thông minh/Thư viện cơ sở B.png",
  "thu-vien-tri-thuc":           "assets/images/Thư viên tri thức/Thư viện cơ sở N.jpg",
  "phong-doc-sach-acb":          "assets/images/Phòng tự học đọc sách - B/Phòng tự học cơ sở B.jpg",
  "phong-tu-hoc-tich-hop":       "assets/images/Phòng tự học tích hợp - N/Phòng tự học cơ sở N.png",
  "english-zone":                "assets/images/English Zone/english zone.jpg",
  "trung-nguyen-e-coffee":       "assets/images/Trung Nguyên E-Coffee/emalth8.jpg",
  "spacep-study-working-space":  "assets/images/Space Study & Working Space/2026-03-05.jpg",
  "tim-say-cafe-banh":           "assets/images/Tim Say/Tim say.jpg",
  "gs25":                        "assets/images/GS 25 đối diện UEH - A/GS 25.jpg",
  "baba-coffee-tea":             "assets/images/Baba Cf/Khu ngồi lại của Baba Cf.png",
  "bibli-library-cafe":          "assets/images/Bibli Library Café/560056044_769920562743893_4163960850375013767_n.jpg",
  "highlands-coffee-ntp":        "assets/images/Highlands Coffee Nguyễn Tri Phương/Screenshot 2026-05-24 010114.png",
  "geek-hub":                    "assets/images/GEEKHUB/download.jpg",
  "south-ground-coworking-cafe": "assets/images/SOUTH GROUND Co.working & Cafe/img_9286_aaec21c560364473b50159a305c6b249_master.jpg",
  "the-workshop-coffee":         "assets/images/The Workshop Coffee/theworkshop-interior.jpg",
  "chon-rieng-cafe":             "assets/images/Chốn Riêng Café/chon-rieng-cafe_3.jpg",
};

// ── TYPE LABELS ──
const TYPE_LABELS = {
  "university":        "Trong trường",
  "cafe":              "Quán cà phê",
  "coworking":         "Coworking",
  "convenience_store": "Tiện lợi",
};

// ── OCCUPANCY CONFIG ──
const OCCUPANCY = {
  "trống": { label: "Còn trống",        cls: "badge-empty",    emoji: "🟢" },
  "vừa":   { label: "Vừa phải",         cls: "badge-moderate", emoji: "🟡" },
  "đông":  { label: "Đông",             cls: "badge-crowded",  emoji: "🔴" },
  null:    { label: "Chưa có cập nhật", cls: "badge-unknown",  emoji: "⚪" },
};

// ── STATE ──
let allLocations  = [];
let statusMap     = {};
let activeCampus  = null;
let activeFeatures = new Set();
let currentLocId  = null;
let reportOccupancy = null;
let reportRating    = 0;

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    await Promise.all([loadLocations(), loadStatus()]);
    renderCards();
    setupFilters();
    setupPopup();
    setupNavbarButtons();
  } catch (err) {
    console.error("Lỗi khởi tạo:", err);
    showToast("Không thể tải dữ liệu. Vui lòng thử lại.", "error");
  }
}

// ============================================================
// DATA LOADING
// ============================================================
async function loadLocations() {
  const res = await fetch("data/locations.json");
  const data = await res.json();
  allLocations = data.locations;
}

async function loadStatus() {
  try {
    const res = await fetch(APPS_SCRIPT_URL + "?action=getStatus");
    const data = await res.json();
    statusMap = data.data || {};
  } catch (err) {
    console.warn("Không thể tải trạng thái từ server — hiển thị 'Chưa cập nhật':", err.message);
    statusMap = {};
  }
}

// ============================================================
// HELPERS
// ============================================================
function generateTags(loc) {
  const tags = [];
  if (loc.ratings.wifi_speed  >= 4) tags.push("Wifi mạnh");
  if (loc.has_power)                tags.push("Có ổ điện");
  if (loc.ratings.quietness   >= 4) tags.push("Yên tĩnh");
  if (loc.group_friendly)           tags.push("Học nhóm được");
  if (loc.ratings.lighting_ac >= 4) tags.push("Sáng & mát");
  if (loc.near_class)               tags.push("Gần lớp");
  return tags.slice(0, 3);
}

function formatHours(hours) {
  if (!hours) return "Không rõ";
  if (hours.daily) return hours.daily;
  const parts = [];
  if (hours.mon_fri) parts.push(`T2–T6: ${hours.mon_fri}`);
  if (hours.mon_sat) parts.push(`T2–T7: ${hours.mon_sat}`);
  if (hours.sat)     parts.push(`T7: ${hours.sat}`);
  if (hours.sun)     parts.push(`CN: ${hours.sun}`);
  return parts.join("  |  ");
}

function formatCapacity(cap) {
  if (!cap) return "Không rõ";
  if (cap.max) return `${cap.min}–${cap.max} người`;
  return `${cap.min}+ người`;
}

function formatPrice(price) {
  if (!price || price.min === null) return "Miễn phí";
  const min = Math.round(price.min / 1000);
  const max = price.max ? `${Math.round(price.max / 1000)}k` : "+";
  return `${min}k – ${max}`;
}

function renderStars(rating, max = 5) {
  let html = "";
  for (let i = 1; i <= max; i++) {
    html += `<span class="star ${i <= rating ? "filled" : ""}" aria-hidden="true">${i <= rating ? "★" : "☆"}</span>`;
  }
  return `<span class="stars" title="${rating}/${max}">${html}</span>`;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1)   return "Vừa cập nhật";
  if (mins < 60)  return `Cập nhật ${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `Cập nhật ${hrs} giờ trước`;
  return `Cập nhật ${Math.floor(hrs / 24)} ngày trước`;
}

function generateSessionId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function canReport(locationId) {
  const raw = localStorage.getItem(`reported_${locationId}`);
  if (!raw) return true;
  return Date.now() - parseInt(raw) > 30 * 60 * 1000;
}

function markReported(locationId) {
  localStorage.setItem(`reported_${locationId}`, Date.now().toString());
}

function minutesSinceReport(locationId) {
  const raw = localStorage.getItem(`reported_${locationId}`);
  if (!raw) return null;
  return Math.ceil((Date.now() - parseInt(raw)) / 60_000);
}

function getBadgeHtml(occupancy) {
  const cfg = OCCUPANCY[occupancy] || OCCUPANCY[null];
  return `<span class="badge ${cfg.cls}">${cfg.emoji} ${cfg.label}</span>`;
}

function getCampusTags(campuses) {
  return campuses.map(c => `<span class="campus-tag">${c === "A" ? "Campus A" : c === "B" ? "Campus B" : c === "N" ? "Campus N" : c}</span>`).join("");
}

// ============================================================
// FILTERING
// ============================================================
function getFilteredLocations() {
  return allLocations.filter(loc => {
    // Campus filter
    if (activeCampus) {
      if (activeCampus === "ngoai") {
        if (loc.type === "university") return false;
      } else {
        if (!loc.campus.includes(activeCampus)) return false;
      }
    }
    // Feature filters (AND)
    for (const f of activeFeatures) {
      if (f === "has_power"      && !loc.has_power)                   return false;
      if (f === "wifi"           && loc.ratings.wifi_speed  < 4)      return false;
      if (f === "near_class"     && !loc.near_class)                  return false;
      if (f === "group_friendly" && !loc.group_friendly)              return false;
      if (f === "lighting_ac"    && loc.ratings.lighting_ac < 4)      return false;
      if (f === "quietness"      && loc.ratings.quietness   < 4)      return false;
    }
    return true;
  });
}

function sortLocations(locs) {
  return [...locs].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });
}

// ============================================================
// SETUP FILTERS
// ============================================================
function setupFilters() {
  // Campus chips (filter section)
  document.getElementById("campus-chips").addEventListener("click", e => {
    const btn = e.target.closest("[data-campus]");
    if (!btn) return;
    const val = btn.dataset.campus;
    activeCampus = activeCampus === val ? null : val;
    updateFilterUI();
    applyFilters();
  });

  // Feature chips
  document.getElementById("feature-chips").addEventListener("click", e => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    const val = btn.dataset.filter;
    if (activeFeatures.has(val)) activeFeatures.delete(val);
    else activeFeatures.add(val);
    updateFilterUI();
    applyFilters();
  });

  // Reset buttons
  document.getElementById("reset-filters").addEventListener("click", resetFilters);
  document.getElementById("reset-filters-empty").addEventListener("click", resetFilters);
}

function updateFilterUI() {
  // Sync campus chips
  document.querySelectorAll("#campus-chips .chip").forEach(btn => {
    const active = btn.dataset.campus === activeCampus;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
  // Sync navbar buttons
  document.querySelectorAll(".nav-campus-btn").forEach(btn => {
    const active = btn.dataset.campus === activeCampus;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
  // Sync feature chips
  document.querySelectorAll("#feature-chips .chip").forEach(btn => {
    const active = activeFeatures.has(btn.dataset.filter);
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
  // Reset button visibility
  const hasFilters = activeCampus || activeFeatures.size > 0;
  document.getElementById("reset-filters").classList.toggle("hidden", !hasFilters);
}

function resetFilters() {
  activeCampus = null;
  activeFeatures.clear();
  updateFilterUI();
  applyFilters();
}

function applyFilters() {
  const filtered = sortLocations(getFilteredLocations());
  const count = filtered.length;

  document.getElementById("result-count").textContent = `Tìm thấy ${count} địa điểm`;

  const grid     = document.getElementById("locations-grid");
  const empty    = document.getElementById("empty-state");

  if (count === 0) {
    grid.classList.add("hidden");
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");
    grid.classList.remove("hidden");
    renderCardList(filtered);
  }
}

// ============================================================
// RENDERING — F1 CARDS
// ============================================================
function renderCards() {
  document.getElementById("loading-state").classList.add("hidden");
  document.getElementById("locations-grid").classList.remove("hidden");
  const sorted = sortLocations(allLocations);
  renderCardList(sorted);
  document.getElementById("result-count").textContent =
    `Tìm thấy ${sorted.length} địa điểm`;
}

function renderCardList(locs) {
  const grid = document.getElementById("locations-grid");
  grid.innerHTML = locs.map(loc => createCardHTML(loc)).join("");

  // Attach click handlers + image error handlers
  grid.querySelectorAll(".location-card").forEach(card => {
    const id = card.dataset.id;
    card.addEventListener("click", () => openPopup(id));
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPopup(id); }
    });
  });
  grid.querySelectorAll(".card-img").forEach(img => {
    img.addEventListener("error", () => img.classList.add("img-error"), { once: true });
  });
}

function createCardHTML(loc) {
  const status   = statusMap[loc.id] || {};
  const occ      = status.occupancy || null;
  const badge    = getBadgeHtml(occ);
  const tags     = (loc.tags && loc.tags.length ? loc.tags : generateTags(loc));
  const imgPath  = IMAGE_MAP[loc.id] || "";
  const typeLabel = TYPE_LABELS[loc.type] || loc.type;
  const campusList = loc.campus.map(c =>
    c === "N" ? "Campus N" : c === "A" ? "Campus A" : c === "B" ? "Campus B" : c
  ).join(", ");

  const wifiStars     = renderStars(loc.ratings.wifi_speed);
  const lightingStars = renderStars(loc.ratings.lighting_ac);

  return `
<article class="location-card${loc.featured ? " featured" : ""}"
  data-id="${loc.id}"
  role="listitem"
  tabindex="0"
  aria-label="${loc.name} — ${typeLabel}, ${campusList}">

  <div class="card-img-wrap">
    <div class="card-img-placeholder">
      <span class="placeholder-icon" aria-hidden="true">📍</span>
      <span class="placeholder-text">${loc.name}</span>
    </div>
    ${imgPath ? `<img class="card-img" src="${imgPath}" alt="Ảnh ${loc.name}" loading="lazy">` : ""}
    <div class="card-overlay">
      ${badge}
      <span class="campus-tag" aria-label="Campus ${loc.campus.join(", ")}">${loc.campus.join(" · ")}</span>
    </div>
  </div>

  <div class="card-body">
    <h2 class="card-name">${loc.name}</h2>
    <div class="card-meta">
      <span>${typeLabel}</span>
      <span class="card-meta-dot" aria-hidden="true">·</span>
      <span>~${loc.capacity.min}–${loc.capacity.max || loc.capacity.min + "+"} người</span>
      <span class="card-meta-dot" aria-hidden="true">·</span>
      <span>⏰ ${formatHours(loc.hours)}</span>
    </div>

    <div class="card-quick-info" aria-label="Thông tin nhanh">
      <span class="quick-info-item ${loc.has_power ? "has" : "has-no"}"
        title="${loc.has_power ? "Có ổ điện" : "Không có ổ điện"}">
        🔌 ${loc.has_power ? "Có ổ điện" : "Không"}
      </span>
      <span class="quick-info-item" title="Wifi ${loc.ratings.wifi_speed}/5">
        📶 ${wifiStars}
      </span>
      <span class="quick-info-item" title="Ánh sáng & điều hòa ${loc.ratings.lighting_ac}/5">
        💡 ${lightingStars}
      </span>
    </div>

    <div class="card-tags" aria-label="Tags nổi bật">
      ${tags.map(t => `<span class="tag">${t}</span>`).join("")}
    </div>
  </div>
</article>`;
}

// Update badge on a single card (optimistic update after report)
function updateCardBadge(locationId, occupancy) {
  const card = document.querySelector(`.location-card[data-id="${locationId}"]`);
  if (!card) return;
  const overlay = card.querySelector(".card-overlay");
  if (!overlay) return;
  const existingBadge = overlay.querySelector(".badge");
  if (existingBadge) existingBadge.outerHTML = getBadgeHtml(occupancy);
  else overlay.insertAdjacentHTML("afterbegin", getBadgeHtml(occupancy));
}

// ============================================================
// POPUP — F1 DETAIL VIEW
// ============================================================
function setupPopup() {
  const overlay = document.getElementById("popup-overlay");
  const closeBtn = document.getElementById("popup-close");

  closeBtn.addEventListener("click", closePopup);
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closePopup();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) closePopup();
  });
}

function openPopup(locationId) {
  const loc = allLocations.find(l => l.id === locationId);
  if (!loc) return;
  currentLocId = locationId;

  const status  = statusMap[locationId] || {};
  const body    = document.getElementById("popup-body");
  body.innerHTML = createPopupHTML(loc, status);

  // Setup interactions inside popup
  setupPopupReport(locationId);
  setupPopupImages();

  const overlay = document.getElementById("popup-overlay");
  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Focus the popup sheet for a11y
  const sheet = document.getElementById("popup-sheet");
  sheet.focus();
}

function closePopup() {
  document.getElementById("popup-overlay").classList.add("hidden");
  document.body.style.overflow = "";
  currentLocId = null;
}

function setupPopupImages() {
  document.querySelectorAll(".popup-img").forEach(img => {
    img.addEventListener("error", () => img.classList.add("img-error"), { once: true });
  });
}

function createPopupHTML(loc, status) {
  const occ       = status.occupancy || null;
  const badge     = getBadgeHtml(occ);
  const updatedAt = status.updated_at ? formatTimeAgo(status.updated_at) : null;
  const imgPath   = IMAGE_MAP[loc.id] || "";
  const typeLabel = TYPE_LABELS[loc.type] || loc.type;
  const avgRating = status.avg_rating;
  const totalRatings = status.total_ratings || 0;

  const campusTagsHtml = loc.campus.map(c => {
    const label = c === "A" ? "Campus A" : c === "B" ? "Campus B" : c === "N" ? "Campus N" : c;
    return `<span class="popup-type-badge">${label}</span>`;
  }).join("");

  return `
  <!-- Image -->
  <div class="popup-img-wrap">
    <div class="popup-img-placeholder">
      <span class="placeholder-icon" aria-hidden="true" style="font-size:36px; opacity:0.7">📍</span>
      <span class="placeholder-text">${loc.name}</span>
    </div>
    ${imgPath ? `<img class="popup-img" src="${imgPath}" alt="Ảnh ${loc.name}">` : ""}
  </div>

  <!-- Header -->
  <div class="popup-header">
    <div class="popup-title-row">
      <h2 class="popup-name">${loc.name}</h2>
    </div>
    <div class="popup-type-row">
      <span class="popup-type-badge">${typeLabel}</span>
      ${campusTagsHtml}
    </div>
    <div class="popup-status-row">
      ${badge}
      ${updatedAt ? `<span class="popup-updated">${updatedAt}</span>` : ""}
    </div>
  </div>

  <!-- Info -->
  <div class="popup-info">
    <div class="popup-info-row">
      <span class="info-icon" aria-hidden="true">📍</span>
      <span class="info-label">Vị trí</span>
      <span class="info-value">${loc.address}</span>
    </div>
    <div class="popup-info-row">
      <span class="info-icon" aria-hidden="true">⏰</span>
      <span class="info-label">Giờ mở cửa</span>
      <span class="info-value">${formatHours(loc.hours)}</span>
    </div>
    <div class="popup-info-row">
      <span class="info-icon" aria-hidden="true">👥</span>
      <span class="info-label">Sức chứa</span>
      <span class="info-value">${formatCapacity(loc.capacity)}</span>
    </div>
    <div class="popup-info-row">
      <span class="info-icon" aria-hidden="true">🔌</span>
      <span class="info-label">Ổ cắm điện</span>
      <span class="info-value">${loc.outlets.min}–${loc.outlets.max ?? "∞"} ổ</span>
    </div>
    <div class="popup-info-row">
      <span class="info-icon" aria-hidden="true">💰</span>
      <span class="info-label">Chi phí</span>
      <span class="info-value">${formatPrice(loc.price_vnd)}</span>
    </div>
  </div>

  <!-- Ratings grid -->
  <div class="popup-ratings">
    <p class="popup-section-title">Đánh giá tiêu chí</p>
    <div class="ratings-grid">
      <div class="rating-item">
        <span class="rating-name">📶 Wifi</span>
        ${renderStars(loc.ratings.wifi_speed)}
        <span style="font-size:12px;color:var(--color-text-secondary)">${loc.ratings.wifi_speed}/5</span>
      </div>
      <div class="rating-item">
        <span class="rating-name">💡 Ánh sáng & Mát</span>
        ${renderStars(loc.ratings.lighting_ac)}
        <span style="font-size:12px;color:var(--color-text-secondary)">${loc.ratings.lighting_ac}/5</span>
      </div>
      <div class="rating-item">
        <span class="rating-name">🔇 Yên tĩnh</span>
        ${renderStars(loc.ratings.quietness)}
        <span style="font-size:12px;color:var(--color-text-secondary)">${loc.ratings.quietness}/5</span>
      </div>
    </div>
  </div>

  <!-- Booleans -->
  <div class="popup-booleans">
    <span class="bool-item ${loc.has_power ? "yes" : "no"}">
      🔌 ${loc.has_power ? "Có ổ điện" : "Không có ổ điện"}
    </span>
    <span class="bool-item ${loc.near_class ? "yes" : "no"}">
      📍 ${loc.near_class ? "Gần lớp học" : "Xa lớp học"}
    </span>
    <span class="bool-item ${loc.group_friendly ? "yes" : "no"}">
      👥 ${loc.group_friendly ? "Học nhóm được" : "Chỉ cá nhân"}
    </span>
  </div>

  <!-- Description -->
  <div class="popup-desc">
    <p>${loc.description}</p>
    ${loc.notes ? `<p class="popup-notes">💡 ${loc.notes}</p>` : ""}
  </div>

  <!-- Community stats -->
  ${(avgRating || totalRatings > 0) ? `
  <div class="popup-community">
    <p class="popup-section-title" style="margin-bottom:8px">Cộng đồng đánh giá</p>
    <div class="community-stats">
      ${avgRating ? `
      <div>
        <div class="community-stat-val">⭐ ${avgRating.toFixed(1)}</div>
        <div class="community-stat-label">Điểm trung bình</div>
      </div>` : ""}
      <div>
        <div class="community-stat-val">${totalRatings}</div>
        <div class="community-stat-label">Lượt đánh giá</div>
      </div>
    </div>
  </div>` : ""}

  <!-- Report button (F4) -->
  <div class="popup-report-wrap" id="report-btn-wrap">
    <button class="btn-report" id="btn-open-report" aria-controls="report-form-section">
      📣 Báo trạng thái
    </button>
  </div>

  <!-- Report form (hidden by default) -->
  <div id="report-form-section" class="report-form-wrap hidden" aria-label="Form báo trạng thái">
    <!-- Populated by setupPopupReport -->
  </div>
  `;
}

// ============================================================
// REPORT FORM — F4
// ============================================================
function setupPopupReport(locationId) {
  const openBtn = document.getElementById("btn-open-report");
  if (!openBtn) return;

  openBtn.addEventListener("click", () => {
    openBtn.closest("#report-btn-wrap").classList.add("hidden");
    renderReportForm(locationId);
  });
}

function renderReportForm(locationId) {
  const formSection = document.getElementById("report-form-section");
  formSection.classList.remove("hidden");

  const cooldownMins = minutesSinceReport(locationId);
  const onCooldown   = cooldownMins !== null && cooldownMins < 30;
  const remaining    = onCooldown ? 30 - cooldownMins : 0;

  reportOccupancy = null;
  reportRating    = 0;

  formSection.innerHTML = `
    <p class="report-form-title">Hiện tại chỗ này thế nào?</p>

    ${onCooldown ? `
    <div class="cooldown-warning">
      ⏱️ Bạn đã báo địa điểm này gần đây. Có thể báo lại sau <strong>${remaining} phút</strong> nữa.
    </div>` : ""}

    <div class="occupancy-btns" role="group" aria-label="Chọn trạng thái hiện tại">
      <button class="occ-btn" data-occ="trống" ${onCooldown ? "disabled" : ""}>
        <span class="occ-icon">🟢</span>Còn trống
      </button>
      <button class="occ-btn" data-occ="vừa" ${onCooldown ? "disabled" : ""}>
        <span class="occ-icon">🟡</span>Vừa phải
      </button>
      <button class="occ-btn" data-occ="đông" ${onCooldown ? "disabled" : ""}>
        <span class="occ-icon">🔴</span>Đông
      </button>
    </div>

    <p class="report-optional-label">Đánh giá tùy chọn</p>

    <div class="star-picker" id="star-picker" role="group" aria-label="Chọn điểm đánh giá từ 1 đến 5">
      ${[1,2,3,4,5].map(n =>
        `<span class="star-pick" data-value="${n}" role="button" tabindex="0" aria-label="${n} sao">★</span>`
      ).join("")}
    </div>

    <div class="report-comment-wrap">
      <textarea
        id="report-comment"
        class="report-comment"
        placeholder="Để lại nhận xét ngắn... (tùy chọn)"
        maxlength="100"
        ${onCooldown ? "disabled" : ""}
        aria-label="Nhận xét ngắn tối đa 100 ký tự"
      ></textarea>
      <div class="char-count" id="char-count">0/100</div>
    </div>

    <div class="report-actions">
      <button class="btn-submit" id="btn-submit-report" disabled>Gửi</button>
      <button class="btn-cancel" id="btn-cancel-report">Hủy</button>
    </div>
  `;

  // Occupancy buttons
  formSection.querySelectorAll(".occ-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      formSection.querySelectorAll(".occ-btn").forEach(b => b.className = "occ-btn");
      const occ = btn.dataset.occ;
      const clsMap = { "trống": "selected-empty", "vừa": "selected-moderate", "đông": "selected-crowded" };
      btn.classList.add(clsMap[occ]);
      reportOccupancy = occ;
      document.getElementById("btn-submit-report").disabled = false;
    });
  });

  // Star picker
  const starPicker = document.getElementById("star-picker");
  starPicker.addEventListener("click", e => {
    const star = e.target.closest("[data-value]");
    if (!star) return;
    reportRating = parseInt(star.dataset.value);
    starPicker.querySelectorAll(".star-pick").forEach((s, i) => {
      s.classList.toggle("lit", i < reportRating);
    });
  });
  starPicker.addEventListener("keydown", e => {
    const star = e.target.closest("[data-value]");
    if (!star) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); star.click(); }
  });

  // Char counter
  const textarea = document.getElementById("report-comment");
  const charCount = document.getElementById("char-count");
  textarea.addEventListener("input", () => {
    const len = textarea.value.length;
    charCount.textContent = `${len}/100`;
    charCount.classList.toggle("over", len > 100);
  });

  // Submit
  document.getElementById("btn-submit-report").addEventListener("click", () => {
    submitReport(locationId);
  });

  // Cancel
  document.getElementById("btn-cancel-report").addEventListener("click", () => {
    formSection.classList.add("hidden");
    document.getElementById("report-btn-wrap").classList.remove("hidden");
  });
}

async function submitReport(locationId) {
  if (!reportOccupancy) return;

  const submitBtn = document.getElementById("btn-submit-report");
  const comment   = (document.getElementById("report-comment")?.value || "").trim();

  submitBtn.disabled = true;
  submitBtn.textContent = "Đang gửi...";

  const payload = {
    action:      "checkin",
    location_id: locationId,
    occupancy:   reportOccupancy,
    rating:      reportRating > 0 ? reportRating : undefined,
    comment:     comment || undefined,
    session_id:  generateSessionId(),
  };

  // Remove undefined fields
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

  try {
    await postReport(payload);
  } catch (err) {
    // Post failed but we still do optimistic update
    console.warn("POST thất bại (optimistic update vẫn áp dụng):", err.message);
  }

  // Optimistic update
  statusMap[locationId] = {
    ...(statusMap[locationId] || {}),
    occupancy:  reportOccupancy,
    updated_at: new Date().toISOString(),
  };
  updateCardBadge(locationId, reportOccupancy);

  // Update badge in popup
  const popupBadge = document.querySelector(".popup-status-row .badge");
  if (popupBadge) {
    const cfg = OCCUPANCY[reportOccupancy];
    popupBadge.className  = `badge ${cfg.cls}`;
    popupBadge.textContent = `${cfg.emoji} ${cfg.label}`;
  }
  const updatedEl = document.querySelector(".popup-updated");
  if (updatedEl) updatedEl.textContent = "Vừa cập nhật";

  markReported(locationId);

  // Close form
  document.getElementById("report-form-section").classList.add("hidden");
  document.getElementById("report-btn-wrap").classList.remove("hidden");

  showToast("🙌 Cảm ơn bạn đã cập nhật!", "success");
}

async function postReport(payload) {
  // POST to Apps Script (no-cors to avoid CORS preflight issues)
  await fetch(APPS_SCRIPT_URL, {
    method:  "POST",
    mode:    "no-cors",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
}

// ============================================================
// NAVBAR CAMPUS BUTTONS (desktop quick-filter)
// ============================================================
function setupNavbarButtons() {
  document.querySelectorAll(".nav-campus-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.campus;
      activeCampus = activeCampus === val ? null : val;
      updateFilterUI();
      applyFilters();
      // Scroll to filters/locations on mobile
      document.getElementById("filters-section").scrollIntoView({ behavior: "smooth" });
    });
  });
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className   = `toast toast-${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.classList.remove("show"); }, 3000);
}
