# INSIGHTS.md — Số liệu khảo sát biện minh tính năng

> Nguồn: Khảo sát sinh viên UEH (n > 60). Dùng các số liệu này để:
> (1) điền vào **hero section** trang chủ, (2) quyết định **thứ tự ưu tiên** tính năng và filter.

---

## 1. Hero Stats — Hiển thị trên trang chủ

Đặt 3 số này nổi bật ở hero section (font lớn, màu accent `#e8590c`):

| Con số | Ý nghĩa | Dùng ở đâu |
|---|---|---|
| **31%** | Sinh viên mất hơn 10 phút mỗi lần tìm chỗ | Hero stat, Problem Statement |
| **4.3 / 5** | Mức độ quan tâm đến app/web hỗ trợ tìm chỗ | Hero stat, justify xây web |
| **16** | Địa điểm học tập đã được khảo sát thực tế | Hero stat, trust indicator |

**Copy gợi ý cho hero:**
```
31% sinh viên mất hơn 10 phút tìm chỗ mỗi lần.
UEH Study Space giúp bạn tìm ngay — trước khi bước ra khỏi lớp.
```

---

## 2. Ranking yếu tố quan trọng khi chọn chỗ học (C1)

> Dùng để quyết định **thứ tự hiển thị filter chips** trong F2.
> Yếu tố có điểm cao nhất → chip đầu tiên, to nhất.

| Thứ tự | Yếu tố | Điểm TB (1–5) | Filter chip tương ứng |
|---|---|---|---|
| 1 | Có ổ điện | *(điền sau khi có data)* | `has_power: true` |
| 2 | Wifi mạnh | *(điền sau khi có data)* | `wifi_speed >= 4` |
| 3 | Gần lớp / căng-tin | *(điền sau khi có data)* | `near_class: true` |
| 4 | Đủ chỗ cho cả nhóm | *(điền sau khi có data)* | `group_friendly: true` |
| 5 | Ánh sáng & điều hòa tốt | *(điền sau khi có data)* | `lighting_ac >= 4` |
| 6 | Yên tĩnh | *(điền sau khi có data)* | `quietness >= 4` |

> 📌 Khi Data team có điểm thực từ Dashboard, điền vào cột "Điểm TB" và xác nhận lại thứ tự. Nếu thứ tự thay đổi → cập nhật `FEATURES.md` bảng F2 và file này.

---

## 3. Pain point #1 — Biện minh tính năng F3 (hiển thị trạng thái)

**Câu hỏi C2:** Đâu là khó khăn lớn nhất khi tìm chỗ học?

| Khó khăn | % chọn |
|---|---|
| Không biết chỗ nào còn trống | *(điền từ Dashboard)* |
| Không biết chỗ nào yên tĩnh / phù hợp | *(điền từ Dashboard)* |
| Tới nơi thì đã hết chỗ | *(điền từ Dashboard)* |
| Thiếu ổ điện / wifi yếu | *(điền từ Dashboard)* |
| Không có chỗ đủ rộng cho học nhóm | *(điền từ Dashboard)* |

> Answer #1 (nhiều nhất) → **đây là lý do tính năng F3 là MVP**, không phải nice-to-have.

---

## 4. Top 3 địa điểm SV hay đến nhất (B3)

> Dùng để **sắp xếp danh sách** — 3 địa điểm này hiển thị đầu tiên (pinned/featured).

1. UEH Smart Library (Thư viện thông minh)
2. Quán cà phê gần / trong UEH
3. Khu tự học / hành lang các tòa nhà B và N

> Trong `locations.json`, có thể thêm field `"featured": true` cho 3 địa điểm này để sort lên đầu.

---

## 5. Top 3 thông tin SV muốn biết trước khi đến (D3)

> Dùng để quyết định **3 trường bắt buộc** hiển thị trong card preview (không ẩn trong popup).

1. Có ổ điện không
2. Wifi ổn định không
3. Ánh sáng & điều hòa tốt không

**Áp dụng vào card design:**
- 3 icon nhỏ luôn hiển thị ngay trên card: 🔌 `has_power` · 📶 `wifi_speed` · 💡 `lighting_ac`
- Các thông tin còn lại (sức chứa, giờ mở cửa, mô tả) → hiện trong popup chi tiết.

---

## 6. Hành vi tìm chỗ hiện tại (B4) — Context để viết microcopy

SV hiện đang tìm chỗ bằng cách:
- Đến thẳng "quán ruột" quen thuộc
- Hỏi bạn bè / xem nhóm chat
- Tìm trên Google Maps
- Đi vòng vòng kiểm tra nhiều nơi

**→ Implication cho UX:**
- Microcopy nên nhấn vào "trước khi đi" — tránh lãng phí chuyến đi.
- CTA button: *"Tìm chỗ ngay"* (không phải "Khám phá" hay "Xem danh sách").
- Empty state khi filter không khớp: *"Thử bỏ bớt 1 tiêu chí — hoặc thêm 'Gần lớp' để tìm chỗ gần nhất."*

---

## 7. Thời điểm cao điểm tìm chỗ (B1)

> Dùng để thiết kế badge "Giờ cao điểm" (tính năng V2.1).

| Khung giờ | % chọn |
|---|---|
| Sáng sớm (trước 9h) | *(điền từ Dashboard)* |
| Giữa buổi sáng (9–11h30) | *(điền từ Dashboard)* |
| Buổi trưa (11h30–13h) | *(điền từ Dashboard)* |
| **Buổi chiều (13–17h)** | **Cao nhất** (từ Persona) |
| Buổi tối (sau 17h) | *(điền từ Dashboard)* |

> Khi có đủ data từ `[USAGE_DATA]` Sheets: so sánh phân bổ checkin theo giờ → validate với survey.
