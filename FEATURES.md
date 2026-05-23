# FEATURES.md — Đặc tả tính năng

> Build theo thứ tự ưu tiên. MVP = bắt buộc có trước demo. V2 = làm nếu còn thời gian.

---

## MVP — 4 tính năng bắt buộc

---

### F1 · Danh sách địa điểm + thông tin chi tiết

**Ưu tiên:** MVP #1 (làm trước nhất — toàn bộ tính năng khác đứng trên cái này)

**User story:**
> Là sinh viên UEH, tôi muốn xem danh sách các địa điểm học tập kèm thông tin cơ bản để biết nơi nào phù hợp với mình trước khi đi.

**Tiêu chí hoàn thành:**
- Hiển thị danh sách dạng **card** — mỗi card gồm: ảnh địa điểm, tên, campus (A/B/N...), loại (thư viện / quán cà phê / coworking...), sức chứa, giờ mở cửa, 3 tag nổi bật (vd "Wifi mạnh", "Học nhóm được", "Yên tĩnh").
- Khi bấm vào card → mở **popup / drawer** hiển thị thêm: mô tả không gian, điểm rating từng tiêu chí (wifi, yên tĩnh, ánh sáng, ổ điện), trạng thái hiện tại (trống/vừa/đông), số lượt đánh giá, bình luận gần nhất.
- Toàn bộ dữ liệu lấy từ `data/locations.json` — không hardcode bất kỳ thông tin nào.
- Khi chưa có ảnh thật (`assets/images/`), hiển thị placeholder màu `#0d5c63` kèm tên địa điểm.

**Dữ liệu cần:** `locations.json` + ảnh trong `assets/images/`

---

### F2 · Lọc theo tiêu chí

**Ưu tiên:** MVP #2

**User story:**
> Là sinh viên, tôi muốn lọc chỗ theo nhu cầu cụ thể (có ổ điện, wifi mạnh, yên tĩnh...) để không phải đọc hết danh sách.

**Tiêu chí hoàn thành:**
- Bộ lọc hiển thị dưới dạng **chip / toggle button**, thứ tự theo ranking khảo sát (quan trọng nhất đứng đầu):

| Thứ tự | Tiêu chí | Field trong JSON | Kiểu lọc |
|---|---|---|---|
| 1 | Có ổ điện | `has_power: true` | boolean toggle |
| 2 | Wifi mạnh | `wifi >= 4` | boolean toggle |
| 3 | Gần lớp / căng-tin | `near_class: true` | boolean toggle |
| 4 | Đủ chỗ cho nhóm | `group_friendly: true` | boolean toggle |
| 5 | Ánh sáng & điều hòa tốt | `lighting_ac >= 4` | boolean toggle |
| 6 | Yên tĩnh | `quietness >= 4` | boolean toggle |

- Khi chọn nhiều tiêu chí → lọc theo **AND** (phải thỏa tất cả).
- Hiển thị số kết quả khớp: ví dụ *"Tìm thấy 5 địa điểm"*.
- Khi không có kết quả → hiển thị message thân thiện + gợi ý bỏ bớt 1 tiêu chí.
- Thêm filter **Campus**: chip A / B / N / Ngoài trường — lọc theo field `campus`.
- Reset bộ lọc bằng 1 nút "Xóa bộ lọc".

**Dữ liệu cần:** `locations.json`

---

### F3 · Hiển thị trạng thái còn trống / đông

**Ưu tiên:** MVP #3

**User story:**
> Là sinh viên, tôi muốn biết chỗ nào đang trống hay đông ngay lúc này để không đi mò rồi mới biết hết chỗ.

**Tiêu chí hoàn thành:**
- Mỗi card địa điểm hiển thị badge trạng thái với 3 mức:
  - 🟢 **Còn trống** — màu xanh lá
  - 🟡 **Vừa phải** — màu vàng cam
  - 🔴 **Đông** — màu đỏ
- Trạng thái lấy từ dữ liệu cộng đồng (Apps Script GET endpoint) — xem `DATA_MODEL.md`.
- Logic tính trạng thái: lấy **majority vote** của các lượt report trong **2 giờ gần nhất**. Nếu không có dữ liệu trong 2 giờ → hiển thị "Chưa có cập nhật" (màu xám).
- **Mock data khi chưa có Apps Script:** hardcode trạng thái ngẫu nhiên trong file JS, để comment `// TODO: thay bằng fetch từ Apps Script URL`.
- Thời gian cập nhật cuối hiển thị dưới badge: *"Cập nhật 15 phút trước"*.

**Dữ liệu cần:** Apps Script GET endpoint (hoặc mock local)

---

### F4 · Báo trạng thái + đánh giá sau khi dùng

**Ưu tiên:** MVP #4

**User story:**
> Là sinh viên vừa dùng xong một chỗ, tôi muốn báo lại trạng thái để giúp bạn khác biết.

**Tiêu chí hoàn thành:**
- Trong popup chi tiết địa điểm, có nút **"Báo trạng thái"** → mở mini-form:
  - Chọn 1 trong 3: Còn trống / Vừa phải / Đông
  - Tùy chọn: chọn sao đánh giá (1–5) và để lại bình luận ngắn (tối đa 100 ký tự)
  - Nút "Gửi" → POST lên Apps Script (hoặc mock: lưu local, show toast "Cảm ơn bạn đã cập nhật!")
- Sau khi gửi: badge trạng thái trên card cập nhật ngay (optimistic update).
- Giới hạn: 1 lần báo / địa điểm / 30 phút (dùng `localStorage` để track, tránh spam).
- Không cần đăng nhập — ẩn danh hoàn toàn.

**Dữ liệu cần:** Apps Script POST endpoint (hoặc mock)

---

## V2 — Tính năng mở rộng (làm nếu còn thời gian)

### V2.1 · Gợi ý thông minh theo thời gian
> Dựa trên khung giờ hiện tại + lịch sử trạng thái → hiển thị banner "Buổi chiều thứ 3 thường đông ở Thư viện B1 — thử English Zone?"

**Cần:** tích lũy đủ dữ liệu trong Sheets; logic phân tích theo `timestamp` + `day_of_week`.

### V2.2 · Lưu địa điểm yêu thích
> SV bấm ❤️ để lưu vào danh sách "Chỗ hay đến" — lưu bằng `localStorage`, không cần tài khoản.

**Cần:** chỉ cần `localStorage`, không cần backend.

### V2.3 · Xem trên bản đồ
> Hiển thị các địa điểm dưới dạng pin trên bản đồ khu vực UEH.

**Cần:** thêm field `lat` + `lng` vào `locations.json`; nhúng Google Maps Embed hoặc Leaflet.js (miễn phí).

### V2.4 · Chế độ "Đang cần chỗ ngay"
> Một nút lớn ở trang chủ → tự động lọc ra các địa điểm còn trống + gần campus hiện tại nhất.

**Cần:** F2 + F3 đã hoàn chỉnh; tùy chọn dùng Geolocation API để xác định campus.

---

## Luồng người dùng chính (Happy Path)

```
Mở web
  → Thấy danh sách địa điểm với badge trạng thái    [F1 + F3]
  → Bật filter "Có ổ điện" + "Wifi mạnh"            [F2]
  → Danh sách thu gọn còn 6 địa điểm
  → Bấm vào "Thư viện thông minh" → xem chi tiết    [F1]
  → Thấy badge "🟢 Còn trống", wifi ★★★★★
  → Quyết định đến
  → Sau khi học xong, mở web → báo "Đông"           [F4]
```
