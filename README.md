[README.md](https://github.com/user-attachments/files/28183550/README.md)
# ueh-study-space# UEH Study Space

> **Một câu pitch:** UEH Study Space — website giúp sinh viên UEH tìm chỗ tự học / học nhóm phù hợp trước khi di chuyển tới.

---

## 1. Problem Statement

> *Sinh viên UEH cần một cách nhanh chóng để tìm được chỗ học phù hợp tại trường, vì hiện tại hơn 31% mất hơn 10 phút mỗi lần tìm do thiếu thông tin thời gian thực về trạng thái và tiện ích của từng địa điểm.*

---

## 2. Persona

**Tên:** Nguyễn Văn A — sinh viên năm 2, cơ sở B (Nguyễn Tri Phương).

Mỗi tuần học ngoài lớp 1–3 buổi, thường vào **khung giờ chiều 13h–17h**. Hay đến Thư viện UEH, khu tự học hành lang, hoặc quán cà phê gần trường. Khi chọn chỗ, điều A quan tâm nhất là **ổ điện** và **wifi ổn định** vì hay dùng laptop.

**Pain point chính:** Không biết chỗ có còn trống không trước khi đi — nhiều lần đến rồi mới biết hết chỗ, lại phải di chuyển sang nơi khác, mất 15–20 phút. Giải pháp hiện tại là "cắm rễ sớm ở quán ruột để giữ chỗ" — tốn chi phí và không linh hoạt.

**Kỳ vọng:** Biết được ngay chỗ nào còn trống + wifi/ổ điện thế nào trước khi bước ra khỏi lớp.

---

## 3. Mục tiêu sản phẩm (Success Criteria)

- SV xem được trạng thái còn trống / đông của từng địa điểm, cập nhật theo cộng đồng.
- SV lọc được theo tiêu chí (ổ điện, wifi, yên tĩnh, học nhóm...) trong **< 4 thao tác**.
- SV xem được mô tả + ảnh thực tế từng địa điểm trước khi đi.
- SV để lại đánh giá / báo trạng thái sau khi dùng xong.

---

## 4. Tech Stack

| Tầng | Công nghệ | Lý do chọn |
|---|---|---|
| Frontend | HTML + CSS + Vanilla JS | Không cần build tool, deploy nhanh, Claude Code handle tốt |
| Dữ liệu tĩnh | `data/locations.json` | Đặc điểm cố định các địa điểm — đọc thẳng từ file |
| Dữ liệu động | Google Sheets + Apps Script | Trạng thái đông/trống + đánh giá do SV cập nhật |
| API layer | Google Apps Script Web App | Endpoint GET (đọc trạng thái) + POST (ghi checkin/rating) |
| Deploy | Vercel (static) | Free, kết nối GitHub, tự động redeploy |
| Font | Be Vietnam Pro (Google Fonts) | Hỗ trợ tiếng Việt, hiện đại, nhẹ |

> ⚠️ Apps Script chưa dựng — tạm **mock** trạng thái bằng dữ liệu local. Để TODO ở chỗ cần ráp. Xem chi tiết `DATA_MODEL.md`.

---

## 5. Bản đồ file

```
ueh-study-space/
├── README.md          ← file này — brief tổng, đọc đầu tiên
├── FEATURES.md        ← đặc tả 4 tính năng MVP + tiêu chí hoàn thành
├── DESIGN.md          ← màu, font, layout, component guide
├── DATA_MODEL.md      ← schema Sheets, luồng GET/POST Apps Script
├── INSIGHTS.md        ← số liệu từ khảo sát, biện minh tính năng
├── data/
│   └── locations.json ← ⭐ dữ liệu 16 địa điểm thật — KHÔNG tạo dữ liệu giả
└── assets/
    └── images/        ← ảnh thật từng địa điểm (tên file khớp field `image`)
```

**Thứ tự đọc đề xuất:** README → FEATURES → DESIGN → DATA_MODEL → INSIGHTS → locations.json.

---

## 6. Nguyên tắc build

1. **Dùng dữ liệu thật** trong `locations.json` — không tạo placeholder "Địa điểm A/B/C".
2. **Mobile-first** — SV dùng điện thoại khi đang đi tìm chỗ.
3. **Trạng thái động** đến từ Apps Script (hoặc mock nếu chưa có URL) — không hardcode.
4. **Tiếng Việt** toàn bộ giao diện.
5. Khi chưa có ảnh thực tế, dùng placeholder màu teal `#0d5c63` với tên địa điểm — không dùng ảnh lorem picsum ngẫu nhiên.
