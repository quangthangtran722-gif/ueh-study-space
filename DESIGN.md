# DESIGN.md — Hướng dẫn thiết kế

> Claude Code đọc file này để quyết định màu sắc, font, layout, component. Mỗi quyết định thiết kế đều có lý do — đừng tự ý thay đổi.

---

## 1. Bảng màu

```css
/* Màu chủ đạo */
--color-primary:      #0d5c63;   /* Teal đậm — nền header, button chính, badge */
--color-primary-light:#1a8a94;   /* Teal sáng — hover state */
--color-accent:       #e8590c;   /* Cam nhấn — CTA, tag nổi bật, số liệu hero */

/* Trạng thái địa điểm */
--color-empty:        #22c55e;   /* Xanh lá — Còn trống */
--color-moderate:     #f59e0b;   /* Vàng cam — Vừa phải */
--color-crowded:      #ef4444;   /* Đỏ — Đông */
--color-unknown:      #9ca3af;   /* Xám — Chưa có cập nhật */

/* Nền & text */
--color-bg:           #f8f9fa;   /* Nền trang */
--color-surface:      #ffffff;   /* Nền card */
--color-text-primary: #1a2a2c;   /* Chữ chính */
--color-text-secondary:#5b7073;  /* Chữ phụ, mô tả */
--color-border:       #e2e8f0;   /* Viền card */
```

**Quy tắc dùng màu:**
- Background trang: `--color-bg` (không dùng trắng thuần `#fff` cho nền trang).
- Header / navbar: `--color-primary`.
- Button chính (CTA): `--color-accent`.
- Button phụ / outline: viền `--color-primary`, chữ `--color-primary`, nền trong suốt.
- Badge trạng thái: đúng 3 màu trong bảng — không dùng màu khác.
- Rating stars: `#f59e0b`.

---

## 2. Typography

**Font chính:** `Be Vietnam Pro` — import từ Google Fonts.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
body { font-family: 'Be Vietnam Pro', sans-serif; }
```

**Scale:**

| Dùng cho | Size | Weight |
|---|---|---|
| Tên trang (H1 hero) | 28px / 1.75rem | 700 |
| Tên địa điểm trên card | 17px / 1.0625rem | 600 |
| Body text, mô tả | 15px / 0.9375rem | 400 |
| Tag, badge, label nhỏ | 12px / 0.75rem | 500 |
| Số liệu hero stat | 36px / 2.25rem | 700 |

> ⚠️ Chữ tối thiểu **14px** mọi chỗ. Không dùng font-size nhỏ hơn.

---

## 3. Layout — Mobile First

**Breakpoints:**

```css
/* Mobile default — không cần media query */
/* Tablet */
@media (min-width: 640px) { ... }
/* Desktop */
@media (min-width: 1024px) { ... }
```

**Grid danh sách địa điểm:**
- Mobile: 1 cột (full width).
- Tablet 640px+: 2 cột.
- Desktop 1024px+: 3 cột.

**Container:**
```css
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px;
}
```

**Navbar:**
- Height 56px, sticky top, `background: var(--color-primary)`, chữ trắng.
- Mobile: chỉ logo + tên "UEH Study Space".
- Desktop: thêm link Campus A / B / N (quick filter).

---

## 4. Component Guide

### 4.1 · Location Card

```
┌─────────────────────────────┐
│ [ẢNH 16:9]                  │
│ 🟢 Còn trống   [CAMPUS: B]  │
├─────────────────────────────┤
│ Tên địa điểm (600, 17px)    │
│ Loại · Sức chứa ~120 người  │
│ ⏰ 07:00–21:00              │
│ ─────────────────────────── │
│ [wifi mạnh] [có ổ điện] ... │
└─────────────────────────────┘
```

- Border-radius: `12px`.
- Box-shadow: `0 1px 4px rgba(0,0,0,0.08)`.
- Hover: `box-shadow: 0 4px 16px rgba(0,0,0,0.12)`, `transform: translateY(-2px)`.
- Toàn bộ card bấm được (cursor pointer) → mở popup chi tiết.

### 4.2 · Badge trạng thái

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.badge-empty    { background: #dcfce7; color: #15803d; }
.badge-moderate { background: #fef9c3; color: #a16207; }
.badge-crowded  { background: #fee2e2; color: #b91c1c; }
.badge-unknown  { background: #f1f5f9; color: #64748b; }
```

### 4.3 · Filter Chips

```css
.chip {
  padding: 7px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--color-border);
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.chip.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
```

### 4.4 · Rating Stars

Hiển thị bằng ký tự ★ (filled) / ☆ (empty). Màu `#f59e0b` cho sao đầy.

### 4.5 · Popup / Bottom Sheet chi tiết

- **Mobile:** slide lên từ dưới (bottom sheet), chiếm 85% chiều cao màn hình, có drag handle.
- **Desktop:** modal giữa màn hình, max-width 520px.
- Overlay backdrop: `rgba(0,0,0,0.4)`.
- Nội dung: ảnh full-width → tên + badge trạng thái → rating grid (5 tiêu chí) → mô tả → bình luận gần nhất → nút "Báo trạng thái".

### 4.6 · Hero Section (trang chủ)

```
┌─────────────────────────────────┐
│  [nền teal #0d5c63]             │
│  UEH Study Space                │
│  Tìm chỗ học — không cần đi mò  │
│                                 │
│  [  31%  ]  SV mất >10 phút     │
│  [ 4.3/5 ]  Nhu cầu dùng app    │
│  [  16   ]  Địa điểm khảo sát  │
│                                 │
│  [Tìm chỗ ngay →] (cam)        │
└─────────────────────────────────┘
```

---

## 5. Tông & vibe

- **Trẻ trung, gọn gàng, thực dụng** — không cần fancy animation.
- Ưu tiên **thông tin rõ ràng** hơn decoration.
- Không dùng gradient phức tạp — chỉ solid color hoặc gradient đơn giản 2 tông teal.
- Icon: dùng emoji Unicode (🟢 🔴 ⏰ 📍 👥) hoặc SVG inline đơn giản — không import icon library nặng.

---

## 6. Accessibility

- Contrast ratio tối thiểu 4.5:1 cho text thường, 3:1 cho text lớn.
- Nút bấm tối thiểu **44×44px** (ngón tay).
- Tất cả ảnh có `alt` text tiếng Việt mô tả địa điểm.
- Focus state visible: `outline: 2px solid var(--color-accent)`.
- Không dùng màu đơn thuần để truyền thông tin (badge trạng thái có cả icon + màu + chữ).

---

## 7. Tham chiếu style

- **Layout danh sách:** Google Maps "Nearby" list — card đơn giản, thông tin cốt lõi lên đầu.
- **Filter chips:** Foody / Grab Food category chips — compact, bấm được trực tiếp không cần dropdown.
- **Badge trạng thái:** kiểu "Bận / Rảnh" trong Google Maps business hours.
- **Bottom sheet:** pattern phổ biến trên Grab / Shopee mobile — quen tay với SV Việt.
