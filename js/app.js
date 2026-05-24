/* ============================================================
   UEH Study Space — app.js  v2
   F1  Danh sách + card + popup chi tiết
   F2  Bộ lọc campus & tiêu chí (AND logic)
   F3  Trạng thái động từ Apps Script
   F4  Báo trạng thái + đánh giá (POST thật)
   F5  Smart Finder — gợi ý chỗ phù hợp nhất
   ============================================================ */

// ── APPS SCRIPT URL ──
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwrxb-x6ovUylifoRBVRChRuM6FBS3fO-gQAJNnP1zAO3m81Fo0k3l2xCwUlOENwmKvoQ/exec";

// ── IMAGE MAP ──
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

const TYPE_LABELS = {
  "university":        "Trong trường",
  "cafe":              "Quán cà phê",
  "coworking":         "Coworking",
  "convenience_store": "Tiện lợi",
};

const OCCUPANCY = {
  "trống": { label: "Còn trống",        cls: "badge-empty",    emoji: "🟢" },
  "vừa":   { label: "Vừa phải",         cls: "badge-moderate", emoji: "🟡" },
  "đông":  { label: "Đông",             cls: "badge-crowded",  emoji: "🔴" },
  null:    { label: "Chưa có cập nhật", cls: "badge-unknown",  emoji: "⚪" },
};

// ── APP STATE ──
let allLocations   = [];
let statusMap      = {};
let activeCampus   = null;
let activeFeatures = new Set();
let currentLocId   = null;
let reportOccupancy = null;
let reportRating    = 0;

// ── SMART FINDER STATE ──
let finderCampus   = "any";
let finderFeatures = new Set();

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
    setupSmartFinder();
  } catch (err) {
    console.error("Lỗi khởi tạo:", err);
    showToast("Không thể tải dữ liệu. Vui lòng thử lại.", "error");
  }
}

// ============================================================
// DATA
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
    console.warn("Không thể tải trạng thái:", err.message);
    statusMap = {};
  }
}

// ============================================================
// HELPERS
// ============================================================
function generateTags(loc) {
  const t = [];
  if (loc.ratings.wifi_speed  >= 4) t.push("Wifi mạnh");
  if (loc.has_power)                t.push("Có ổ điện");
  if (loc.ratings.quietness   >= 4) t.push("Yên tĩnh");
  if (loc.group_friendly)           t.push("Học nhóm được");
  if (loc.ratings.lighting_ac >= 4) t.push("Sáng & mát");
  if (loc.near_class)               t.push("Gần lớp");
  return t.slice(0, 3);
}

function formatHours(h) {
  if (!h) return "Không rõ";
  if (h.daily) return h.daily;
  const p = [];
  if (h.mon_fri) p.push(`T2–T6: ${h.mon_fri}`);
  if (h.mon_sat) p.push(`T2–T7: ${h.mon_sat}`);
  if (h.sat)     p.push(`T7: ${h.sat}`);
  if (h.sun)     p.push(`CN: ${h.sun}`);
  return p.join(" | ");
}

function formatCapacity(c) {
  if (!c) return "Không rõ";
  return c.max ? `${c.min}–${c.max} người` : `${c.min}+ người`;
}

function formatPrice(p) {
  if (!p || p.min === null) return "Miễn phí";
  const lo = Math.round(p.min / 1000);
  const hi = p.max ? `${Math.round(p.max / 1000)}k` : "+";
  return `${lo}k – ${hi}`;
}

function renderStars(rating, max = 5) {
  let h = "";
  for (let i = 1; i <= max; i++) {
    h += `<span class="star ${i <= rating ? "filled" : ""}" aria-hidden="true">${i <= rating ? "★" : "☆"}</span>`;
  }
  return `<span class="stars" title="${rating}/${max}">${h}</span>`;
}

function formatTimeAgo(d) {
  if (!d) return null;
  const m = Math.floor((Date.now() - new Date(d)) / 60_000);
  if (m < 1)   return "Vừa cập nhật";
  if (m < 60)  return `Cập nhật ${m} phút trước`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `Cập nhật ${hr} giờ trước`;
  return `Cập nhật ${Math.floor(hr / 24)} ngày trước`;
}

function generateSessionId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function canReport(id) {
  const raw = localStorage.getItem(`reported_${id}`);
  return !raw || Date.now() - parseInt(raw) > 30 * 60_000;
}
function markReported(id) { localStorage.setItem(`reported_${id}`, Date.now().toString()); }
function minutesSinceReport(id) {
  const raw = localStorage.getItem(`reported_${id}`);
  return raw ? Math.ceil((Date.now() - parseInt(raw)) / 60_000) : null;
}

function getBadgeHtml(occ) {
  const cfg = OCCUPANCY[occ] || OCCUPANCY[null];
  return `<span class="badge ${cfg.cls}">${cfg.emoji} ${cfg.label}</span>`;
}

// ============================================================
// FILTERING (F2)
// ============================================================
function passesFilters(loc) {
  if (activeCampus) {
    if (activeCampus === "ngoai") { if (loc.type === "university") return false; }
    else { if (!loc.campus.includes(activeCampus)) return false; }
  }
  for (const f of activeFeatures) {
    if (f === "has_power"      && !loc.has_power)                return false;
    if (f === "wifi"           && loc.ratings.wifi_speed  < 4)   return false;
    if (f === "near_class"     && !loc.near_class)               return false;
    if (f === "group_friendly" && !loc.group_friendly)           return false;
    if (f === "lighting_ac"    && loc.ratings.lighting_ac < 4)   return false;
    if (f === "quietness"      && loc.ratings.quietness   < 4)   return false;
  }
  return true;
}

function getFilteredSorted() {
  const filtered = allLocations.filter(passesFilters);
  return [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
}

function setupFilters() {
  document.getElementById("campus-chips").addEventListener("click", e => {
    const btn = e.target.closest("[data-campus]");
    if (!btn) return;
    const val = btn.dataset.campus;
    activeCampus = activeCampus === val ? null : val;
    syncFilterUI(); applyFilters();
  });

  document.getElementById("feature-chips").addEventListener("click", e => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    const val = btn.dataset.filter;
    activeFeatures.has(val) ? activeFeatures.delete(val) : activeFeatures.add(val);
    syncFilterUI(); applyFilters();
  });

  document.getElementById("reset-filters").addEventListener("click", resetFilters);
  document.getElementById("reset-filters-empty").addEventListener("click", resetFilters);
}

function syncFilterUI() {
  document.querySelectorAll("#campus-chips .chip").forEach(b => {
    const on = b.dataset.campus === activeCampus;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  document.querySelectorAll(".nav-campus-btn").forEach(b => {
    const on = b.dataset.campus === activeCampus;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  document.querySelectorAll("#feature-chips .chip").forEach(b => {
    const on = activeFeatures.has(b.dataset.filter);
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const hasAny = activeCampus || activeFeatures.size > 0;
  document.getElementById("reset-filters").classList.toggle("hidden", !hasAny);
}

function resetFilters() {
  activeCampus = null; activeFeatures.clear();
  syncFilterUI(); applyFilters();
}

function applyFilters() {
  const locs = getFilteredSorted();
  const grid  = document.getElementById("locations-grid");
  const empty = document.getElementById("empty-state");
  document.getElementById("result-count").textContent = `${locs.length} địa điểm`;
  if (locs.length === 0) {
    grid.classList.add("hidden"); empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden"); grid.classList.remove("hidden");
    renderCardList(locs);
  }
}

// ============================================================
// RENDER CARDS (F1)
// ============================================================
function renderCards() {
  document.getElementById("loading-state").classList.add("hidden");
  const sorted = [...allLocations].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  renderCardList(sorted);
  document.getElementById("locations-grid").classList.remove("hidden");
  document.getElementById("result-count").textContent = `${sorted.length} địa điểm`;
}

function renderCardList(locs) {
  const grid = document.getElementById("locations-grid");
  grid.innerHTML = locs.map(createCardHTML).join("");

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
  const tags     = loc.tags?.length ? loc.tags : generateTags(loc);
  const imgPath  = IMAGE_MAP[loc.id] || "";
  const type     = TYPE_LABELS[loc.type] || loc.type;
  const campus   = loc.campus.join(" · ");
  const hours    = formatHours(loc.hours);

  return `
<article class="location-card${loc.featured ? " featured" : ""}"
  data-id="${loc.id}" role="listitem" tabindex="0"
  aria-label="${loc.name}, ${type}, Campus ${loc.campus.join(", ")}">

  <div class="card-img-wrap">
    <div class="card-img-placeholder">
      <span class="placeholder-icon" aria-hidden="true">📍</span>
      <span class="placeholder-text">${loc.name}</span>
    </div>
    ${imgPath ? `<img class="card-img" src="${imgPath}" alt="Ảnh ${loc.name}" loading="lazy">` : ""}
    <div class="card-overlay">
      ${getBadgeHtml(occ)}
      <span class="campus-tag">${campus}</span>
    </div>
  </div>

  <div class="card-body">
    <h2 class="card-name">${loc.name}</h2>
    <div class="card-meta">
      <span>${type}</span>
      <span class="card-meta-dot">·</span>
      <span>⏰ ${hours}</span>
    </div>
    <div class="card-quick-info">
      <span class="quick-info-item ${loc.has_power ? "has" : "has-no"}" title="${loc.has_power ? "Có ổ điện" : "Không có ổ điện"}">
        🔌 ${loc.has_power ? "Có ổ điện" : "Không có"}
      </span>
      <span class="quick-info-item" title="Wifi ${loc.ratings.wifi_speed}/5">
        📶 ${renderStars(loc.ratings.wifi_speed)}
      </span>
      <span class="quick-info-item" title="Ánh sáng ${loc.ratings.lighting_ac}/5">
        💡 ${renderStars(loc.ratings.lighting_ac)}
      </span>
    </div>
    <div class="card-tags">
      ${tags.map(t => `<span class="tag">${t}</span>`).join("")}
    </div>
  </div>
</article>`;
}

function updateCardBadge(locationId, occ) {
  const overlay = document.querySelector(`.location-card[data-id="${locationId}"] .card-overlay`);
  if (!overlay) return;
  const old = overlay.querySelector(".badge");
  overlay.insertAdjacentHTML("afterbegin", getBadgeHtml(occ));
  if (old) old.remove();
}

// ============================================================
// POPUP (F1 detail + F3 status + F4 report)
// ============================================================
function setupPopup() {
  document.getElementById("popup-close").addEventListener("click", closePopup);
  document.getElementById("popup-overlay").addEventListener("click", e => {
    if (e.target.id === "popup-overlay") closePopup();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !document.getElementById("popup-overlay").classList.contains("hidden"))
      closePopup();
  });
}

function openPopup(locationId) {
  const loc = allLocations.find(l => l.id === locationId);
  if (!loc) return;
  currentLocId = locationId;
  const status = statusMap[locationId] || {};
  const body   = document.getElementById("popup-body");
  body.innerHTML = createPopupHTML(loc, status);
  setupPopupReport(locationId);
  body.querySelectorAll(".popup-img").forEach(img => {
    img.addEventListener("error", () => img.classList.add("img-error"), { once: true });
  });
  document.getElementById("popup-overlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  document.getElementById("popup-sheet").focus();
}

function closePopup() {
  document.getElementById("popup-overlay").classList.add("hidden");
  document.body.style.overflow = "";
  currentLocId = null;
}

function createPopupHTML(loc, status) {
  const occ      = status.occupancy || null;
  const updTime  = status.updated_at ? formatTimeAgo(status.updated_at) : null;
  const imgPath  = IMAGE_MAP[loc.id] || "";
  const type     = TYPE_LABELS[loc.type] || loc.type;
  const campusBadges = loc.campus.map(c =>
    `<span class="popup-type-badge">Campus ${c}</span>`
  ).join("");
  const avg      = status.avg_rating;
  const total    = status.total_ratings || 0;

  return `
  <div class="popup-img-wrap">
    <div class="popup-img-placeholder">
      <span class="placeholder-icon" style="font-size:36px;opacity:.65" aria-hidden="true">📍</span>
      <span class="placeholder-text">${loc.name}</span>
    </div>
    ${imgPath ? `<img class="popup-img" src="${imgPath}" alt="Ảnh ${loc.name}">` : ""}
  </div>

  <div class="popup-header">
    <h2 class="popup-name">${loc.name}</h2>
    <div class="popup-type-row">
      <span class="popup-type-badge">${type}</span>
      ${campusBadges}
    </div>
    <div class="popup-status-row">
      ${getBadgeHtml(occ)}
      ${updTime ? `<span class="popup-updated">${updTime}</span>` : ""}
    </div>
  </div>

  <div class="popup-info">
    <div class="popup-info-row">
      <span class="info-icon">📍</span>
      <span class="info-label">Vị trí</span>
      <span class="info-value">${loc.address}</span>
    </div>
    <div class="popup-info-row">
      <span class="info-icon">⏰</span>
      <span class="info-label">Giờ mở cửa</span>
      <span class="info-value">${formatHours(loc.hours)}</span>
    </div>
    <div class="popup-info-row">
      <span class="info-icon">👥</span>
      <span class="info-label">Sức chứa</span>
      <span class="info-value">${formatCapacity(loc.capacity)}</span>
    </div>
    <div class="popup-info-row">
      <span class="info-icon">🔌</span>
      <span class="info-label">Ổ cắm điện</span>
      <span class="info-value">${loc.outlets.min}–${loc.outlets.max ?? "∞"} ổ</span>
    </div>
    <div class="popup-info-row">
      <span class="info-icon">💰</span>
      <span class="info-label">Chi phí</span>
      <span class="info-value">${formatPrice(loc.price_vnd)}</span>
    </div>
  </div>

  <div class="popup-ratings">
    <p class="popup-section-title">Đánh giá tiêu chí</p>
    <div class="ratings-grid">
      <div class="rating-item">
        <span class="rating-name">📶 Wifi</span>
        ${renderStars(loc.ratings.wifi_speed)}
        <span style="font-size:11px;color:var(--color-text-secondary)">${loc.ratings.wifi_speed}/5</span>
      </div>
      <div class="rating-item">
        <span class="rating-name">💡 Ánh sáng & Mát</span>
        ${renderStars(loc.ratings.lighting_ac)}
        <span style="font-size:11px;color:var(--color-text-secondary)">${loc.ratings.lighting_ac}/5</span>
      </div>
      <div class="rating-item">
        <span class="rating-name">🔇 Yên tĩnh</span>
        ${renderStars(loc.ratings.quietness)}
        <span style="font-size:11px;color:var(--color-text-secondary)">${loc.ratings.quietness}/5</span>
      </div>
    </div>
  </div>

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

  <div class="popup-desc">
    <p>${loc.description}</p>
    ${loc.notes ? `<p class="popup-notes">💡 ${loc.notes}</p>` : ""}
  </div>

  ${(avg || total > 0) ? `
  <div class="popup-community">
    <p class="popup-section-title" style="margin-bottom:10px">Cộng đồng đánh giá</p>
    <div class="community-stats">
      ${avg ? `<div>
        <div class="community-stat-val">⭐ ${avg.toFixed(1)}</div>
        <div class="community-stat-label">Điểm trung bình</div>
      </div>` : ""}
      <div>
        <div class="community-stat-val">${total}</div>
        <div class="community-stat-label">Lượt đánh giá</div>
      </div>
    </div>
  </div>` : ""}

  <div class="popup-report-wrap" id="report-btn-wrap">
    <button class="btn-report" id="btn-open-report">📣 Báo trạng thái hiện tại</button>
  </div>

  <div id="report-form-section" class="report-form-wrap hidden"></div>
  `;
}

// ============================================================
// REPORT FORM (F4)
// ============================================================
function setupPopupReport(locationId) {
  document.getElementById("btn-open-report")?.addEventListener("click", () => {
    document.getElementById("report-btn-wrap").classList.add("hidden");
    renderReportForm(locationId);
  });
}

function renderReportForm(locationId) {
  const section = document.getElementById("report-form-section");
  section.classList.remove("hidden");
  reportOccupancy = null;
  reportRating    = 0;

  const mins   = minutesSinceReport(locationId);
  const onCD   = mins !== null && mins < 30;
  const remain = onCD ? 30 - mins : 0;

  section.innerHTML = `
    <p class="report-form-title">Hiện tại chỗ này thế nào?</p>
    ${onCD ? `<div class="cooldown-warning">⏱️ Bạn đã báo gần đây. Có thể báo lại sau <strong>${remain} phút</strong> nữa.</div>` : ""}

    <div class="occupancy-btns" role="group" aria-label="Chọn trạng thái">
      <button class="occ-btn" data-occ="trống" ${onCD ? "disabled" : ""}>
        <span class="occ-icon">🟢</span>Còn trống
      </button>
      <button class="occ-btn" data-occ="vừa" ${onCD ? "disabled" : ""}>
        <span class="occ-icon">🟡</span>Vừa phải
      </button>
      <button class="occ-btn" data-occ="đông" ${onCD ? "disabled" : ""}>
        <span class="occ-icon">🔴</span>Đông
      </button>
    </div>

    <p class="report-optional-label">Đánh giá tùy chọn</p>
    <div class="star-picker" id="star-picker" role="group" aria-label="Chọn sao 1–5">
      ${[1,2,3,4,5].map(n =>
        `<span class="star-pick" data-value="${n}" role="button" tabindex="0" aria-label="${n} sao">★</span>`
      ).join("")}
    </div>
    <div class="report-comment-wrap">
      <textarea id="report-comment" class="report-comment"
        placeholder="Để lại nhận xét ngắn... (tùy chọn)"
        maxlength="100" ${onCD ? "disabled" : ""}
        aria-label="Nhận xét ngắn tối đa 100 ký tự"></textarea>
      <div class="char-count" id="char-count">0/100</div>
    </div>
    <div class="report-actions">
      <button class="btn-submit" id="btn-submit-report" disabled>Gửi</button>
      <button class="btn-cancel" id="btn-cancel-report">Hủy</button>
    </div>
  `;

  // Occupancy buttons
  section.querySelectorAll(".occ-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      section.querySelectorAll(".occ-btn").forEach(b => b.className = "occ-btn");
      const clsMap = { "trống": "selected-empty", "vừa": "selected-moderate", "đông": "selected-crowded" };
      btn.classList.add(clsMap[btn.dataset.occ]);
      reportOccupancy = btn.dataset.occ;
      document.getElementById("btn-submit-report").disabled = false;
    });
  });

  // Star picker
  const picker = document.getElementById("star-picker");
  picker.addEventListener("click", e => {
    const s = e.target.closest("[data-value]");
    if (!s) return;
    reportRating = parseInt(s.dataset.value);
    picker.querySelectorAll(".star-pick").forEach((p, i) => p.classList.toggle("lit", i < reportRating));
  });
  picker.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.target.click(); }
  });

  // Char counter
  document.getElementById("report-comment").addEventListener("input", e => {
    const n = e.target.value.length;
    const el = document.getElementById("char-count");
    el.textContent = `${n}/100`;
    el.classList.toggle("over", n > 100);
  });

  document.getElementById("btn-submit-report").addEventListener("click", () => submitReport(locationId));
  document.getElementById("btn-cancel-report").addEventListener("click", () => {
    section.classList.add("hidden");
    document.getElementById("report-btn-wrap").classList.remove("hidden");
  });
}

async function submitReport(locationId) {
  if (!reportOccupancy) return;
  const btn     = document.getElementById("btn-submit-report");
  const comment = document.getElementById("report-comment")?.value.trim();
  btn.disabled = true;
  btn.textContent = "Đang gửi...";

  const payload = { action: "checkin", location_id: locationId, occupancy: reportOccupancy, session_id: generateSessionId() };
  if (reportRating > 0) payload.rating  = reportRating;
  if (comment)          payload.comment = comment;

  try { await postReport(payload); }
  catch (e) { console.warn("POST warning (optimistic update vẫn chạy):", e.message); }

  // Optimistic update
  statusMap[locationId] = { ...(statusMap[locationId] || {}), occupancy: reportOccupancy, updated_at: new Date().toISOString() };
  updateCardBadge(locationId, reportOccupancy);

  const popupBadge = document.querySelector(".popup-status-row .badge");
  if (popupBadge) {
    const cfg = OCCUPANCY[reportOccupancy];
    popupBadge.className = `badge ${cfg.cls}`;
    popupBadge.textContent = `${cfg.emoji} ${cfg.label}`;
  }
  const updEl = document.querySelector(".popup-updated");
  if (updEl) updEl.textContent = "Vừa cập nhật";

  markReported(locationId);
  document.getElementById("report-form-section").classList.add("hidden");
  document.getElementById("report-btn-wrap").classList.remove("hidden");
  showToast("🙌 Cảm ơn bạn đã cập nhật!", "success");
}

async function postReport(payload) {
  await fetch(APPS_SCRIPT_URL, {
    method: "POST", mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ============================================================
// NAVBAR CAMPUS BUTTONS
// ============================================================
function setupNavbarButtons() {
  document.querySelectorAll(".nav-campus-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.campus;
      activeCampus = activeCampus === val ? null : val;
      syncFilterUI(); applyFilters();
      document.getElementById("filters-section").scrollIntoView({ behavior: "smooth" });
    });
  });
}

// ============================================================
// SMART FINDER (F5)
// ============================================================
function setupSmartFinder() {
  document.getElementById("btn-smart-finder").addEventListener("click", openSmartFinder);
}

function openSmartFinder() {
  if (document.getElementById("finder-overlay")) return;
  finderCampus   = "any";
  finderFeatures = new Set();

  const overlay = document.createElement("div");
  overlay.id        = "finder-overlay";
  overlay.className = "finder-overlay";
  overlay.innerHTML = `
    <div class="finder-modal" role="dialog" aria-modal="true" aria-label="Tìm chỗ học phù hợp">
      <div class="finder-drag-handle" aria-hidden="true"></div>
      <button class="finder-close" id="finder-close" aria-label="Đóng">✕</button>
      <div class="finder-content" id="finder-content">
        ${renderFinderStep1()}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add("visible"));
  });

  document.getElementById("finder-close").addEventListener("click", closeSmartFinder);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeSmartFinder(); });
  document.addEventListener("keydown", onFinderEsc);
  attachFinderStep1Events();
}

function onFinderEsc(e) {
  if (e.key === "Escape" && document.getElementById("finder-overlay")) closeSmartFinder();
}

function closeSmartFinder() {
  const overlay = document.getElementById("finder-overlay");
  if (!overlay) return;
  overlay.classList.remove("visible");
  overlay.classList.add("closing");
  document.removeEventListener("keydown", onFinderEsc);
  setTimeout(() => {
    overlay.remove();
    document.body.style.overflow = "";
  }, 320);
}

// ── Step 1 HTML ──
function renderFinderStep1() {
  return `
    <div class="finder-step-indicator">
      <span class="step-dot active">1</span>
      <span class="step-line"></span>
      <span class="step-dot">2</span>
    </div>
    <div class="finder-header">
      <h2 class="finder-title">🎯 Bạn cần chỗ như thế nào?</h2>
      <p class="finder-subtitle">Chọn tiêu chí quan trọng với bạn — tôi sẽ gợi ý chỗ phù hợp nhất</p>
    </div>

    <div class="finder-section">
      <p class="finder-section-label">📍 Gần campus nào?</p>
      <div class="finder-campus-grid">
        <button class="finder-campus-btn active" data-campus="any">Bất kỳ</button>
        <button class="finder-campus-btn" data-campus="A">Campus A</button>
        <button class="finder-campus-btn" data-campus="B">Campus B</button>
        <button class="finder-campus-btn" data-campus="N">Campus N</button>
      </div>
    </div>

    <div class="finder-section">
      <p class="finder-section-label">✅ Bạn cần gì?
        <span class="finder-hint">(chọn tất cả tiêu chí cần thiết)</span>
      </p>
      <div class="finder-criteria-grid">
        <button class="finder-criteria-btn" data-feature="has_power">
          <span class="criteria-icon">🔌</span>
          <span class="criteria-label">Có ổ điện</span>
        </button>
        <button class="finder-criteria-btn" data-feature="wifi">
          <span class="criteria-icon">📶</span>
          <span class="criteria-label">Wifi mạnh</span>
        </button>
        <button class="finder-criteria-btn" data-feature="near_class">
          <span class="criteria-icon">📍</span>
          <span class="criteria-label">Gần lớp học</span>
        </button>
        <button class="finder-criteria-btn" data-feature="group_friendly">
          <span class="criteria-icon">👥</span>
          <span class="criteria-label">Học nhóm</span>
        </button>
        <button class="finder-criteria-btn" data-feature="lighting_ac">
          <span class="criteria-icon">💡</span>
          <span class="criteria-label">Sáng & mát</span>
        </button>
        <button class="finder-criteria-btn" data-feature="quietness">
          <span class="criteria-icon">🔇</span>
          <span class="criteria-label">Yên tĩnh</span>
        </button>
      </div>
    </div>

    <button class="finder-submit-btn" id="finder-submit">
      Tìm cho tôi →
    </button>
  `;
}

function attachFinderStep1Events() {
  // Campus
  document.querySelectorAll(".finder-campus-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".finder-campus-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      finderCampus = btn.dataset.campus;
    });
  });
  // Criteria
  document.querySelectorAll(".finder-criteria-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.feature;
      btn.classList.toggle("active");
      finderFeatures.has(f) ? finderFeatures.delete(f) : finderFeatures.add(f);
    });
  });
  // Submit
  document.getElementById("finder-submit").addEventListener("click", runFinder);
}

// ── Scoring Algorithm ──
function scoreLocation(loc) {
  // Campus hard filter
  if (finderCampus !== "any") {
    if (finderCampus === "ngoai" && loc.type === "university") return null;
    if (finderCampus !== "ngoai" && !loc.campus.includes(finderCampus)) return null;
  }

  const features  = [...finderFeatures];
  const total     = features.length;
  let   matchCount = 0;

  const checks = {
    has_power:      loc.has_power,
    wifi:           loc.ratings.wifi_speed  >= 4,
    near_class:     loc.near_class,
    group_friendly: loc.group_friendly,
    lighting_ac:    loc.ratings.lighting_ac >= 4,
    quietness:      loc.ratings.quietness   >= 4,
  };
  for (const f of features) if (checks[f]) matchCount++;

  // Base score: ratio of matched criteria (0–100)
  let score = total > 0 ? (matchCount / total) * 100 : 70;

  // Status bonus / penalty
  const occ = statusMap[loc.id]?.occupancy || null;
  if (occ === "trống") score += 25;
  else if (occ === "vừa") score += 10;
  else if (occ === "đông") score -= 15;

  // Featured bonus
  if (loc.featured) score += 5;

  return { loc, score: Math.max(0, score), matchCount, total, occ };
}

function runFinder() {
  const results = allLocations
    .map(scoreLocation)
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  showFinderResults(results);
}

// ── Step 2: Results ──
function showFinderResults(results) {
  const content = document.getElementById("finder-content");
  const rankLabels = ["🥇 Gợi ý tốt nhất", "🥈 Lựa chọn khác", "🥉 Cũng phù hợp"];

  if (results.length === 0) {
    content.innerHTML = `
      <div class="finder-step-indicator">
        <span class="step-dot done">✓</span>
        <span class="step-line active"></span>
        <span class="step-dot active">2</span>
      </div>
      <div class="finder-no-result">
        <div class="finder-no-result-icon">😔</div>
        <p class="finder-no-result-title">Không tìm thấy kết quả phù hợp</p>
        <p class="finder-no-result-desc">Thử bỏ bớt tiêu chí hoặc chọn "Bất kỳ" cho campus.</p>
      </div>
      <button class="finder-back-btn" id="finder-back">← Tìm lại</button>
    `;
    document.getElementById("finder-back").addEventListener("click", goBackToStep1);
    return;
  }

  const cards = results.map((r, i) => {
    const cfg       = OCCUPANCY[r.occ] || OCCUPANCY[null];
    const matchPct  = r.total > 0 ? Math.round((r.matchCount / r.total) * 100) : 100;
    const campusStr = r.loc.campus.map(c => `Campus ${c}`).join(", ");
    const hasMatch  = r.total > 0;

    return `
    <div class="finder-result-card${i === 0 ? " top-result" : ""}" data-locid="${r.loc.id}">
      <div class="finder-result-rank">${rankLabels[i]}</div>
      <div class="finder-result-name">${r.loc.name}</div>
      <div class="finder-result-meta">
        <span class="badge ${cfg.cls}">${cfg.emoji} ${cfg.label}</span>
        <span class="finder-campus-badge">📍 ${campusStr}</span>
      </div>
      ${hasMatch ? `
      <div class="finder-match-wrap">
        <div class="finder-match-bar">
          <div class="finder-match-fill" data-pct="${matchPct}"></div>
        </div>
        <div class="finder-match-label">Khớp <strong>${r.matchCount}/${r.total}</strong> tiêu chí</div>
      </div>` : `
      <div class="finder-match-wrap">
        <div class="finder-match-label">Địa điểm phổ biến phù hợp với bạn</div>
      </div>`}
      <button class="finder-view-btn" data-id="${r.loc.id}">Xem chi tiết →</button>
    </div>`;
  }).join("");

  content.innerHTML = `
    <div class="finder-step-indicator">
      <span class="step-dot done">✓</span>
      <span class="step-line active"></span>
      <span class="step-dot active">2</span>
    </div>
    <div class="finder-header">
      <h2 class="finder-title">✨ Gợi ý cho bạn</h2>
      <p class="finder-subtitle">Dựa trên tiêu chí bạn chọn + trạng thái hiện tại</p>
    </div>
    <div class="finder-results">${cards}</div>
    <button class="finder-back-btn" id="finder-back">← Tìm lại với tiêu chí khác</button>
  `;

  // Animate match bars after render
  requestAnimationFrame(() => {
    document.querySelectorAll(".finder-match-fill[data-pct]").forEach(bar => {
      const pct = parseInt(bar.dataset.pct);
      // Trigger reflow then animate
      bar.style.width = "0%";
      requestAnimationFrame(() => {
        bar.style.width = pct + "%";
      });
    });
  });

  // View detail buttons
  document.querySelectorAll(".finder-view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      closeSmartFinder();
      setTimeout(() => openPopup(id), 320);
    });
  });

  document.getElementById("finder-back").addEventListener("click", goBackToStep1);
}

function goBackToStep1() {
  const content = document.getElementById("finder-content");
  content.innerHTML = renderFinderStep1();
  // Restore previous selections
  document.querySelectorAll(".finder-campus-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.campus === finderCampus);
  });
  document.querySelectorAll(".finder-criteria-btn").forEach(b => {
    b.classList.toggle("active", finderFeatures.has(b.dataset.feature));
  });
  attachFinderStep1Events();
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = "info") {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.className   = `toast toast-${type} show`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3200);
}
