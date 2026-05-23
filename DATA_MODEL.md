# DATA_MODEL.md — Schema dữ liệu & Luồng Apps Script

---

## 1. Hai loại dữ liệu — KHÔNG được nhầm lẫn

| Loại | Nguồn | Thay đổi khi nào | Ví dụ |
|---|---|---|---|
| **Tĩnh** | `data/locations.json` | Chỉ khi team cập nhật file | Tên, địa chỉ, wifi rating, giờ mở cửa |
| **Động** | Google Sheets `[USAGE_DATA]` | Mỗi lần SV checkin / báo cáo | Trạng thái trống/đông, đánh giá sao |

Web ghép 2 nguồn này bằng `location_id` để render card đầy đủ.

---

## 2. Schema `data/locations.json`

Mỗi entry là một object với các field sau:

```jsonc
{
  "id":           "string  — slug duy nhất, dùng để khớp với Sheets",
  "name":         "string  — tên hiển thị đầy đủ",
  "type":         "string  — university | cafe | coworking | convenience_store",
  "style":        "string  — mô tả vibe không gian ngắn (vd 'Hiện đại, học thuật')",
  "campus":       ["array  — danh sách campus gần: A | B | N"],
  "address":      "string  — địa chỉ hoặc mô tả vị trí",
  "capacity": {
    "min": "number",
    "max": "number | null"
  },
  "outlets": {
    "min": "number",
    "max": "number | null"
  },
  "hours": {
    // Chỉ dùng 1 trong 2 format sau:
    "daily":   "string  — nếu giờ giống nhau mọi ngày (vd '07:00–22:00')",
    // HOẶC:
    "mon_fri": "string",
    "sat":     "string",
    "sun":     "string"
  },
  "ratings": {
    "wifi_speed":  "number (1–5)  — 1=yếu, 5=rất nhanh",
    "lighting_ac": "number (1–5)  — 1=tối/nóng, 5=sáng/mát",
    "quietness":   "number (1–5)  — 1=ồn ào, 5=rất yên tĩnh"
  },
  "has_power":      "boolean — có ổ điện không",
  "near_class":     "boolean — gần khu lớp học / căng-tin",
  "group_friendly": "boolean — phù hợp học nhóm",
  "price_vnd": {
    "min": "number | null",
    "max": "number | null"
  },
  "description": "string — mô tả không gian 2–3 câu, viết cho SV",
  "notes":       "string — đặc điểm nổi bật, tip hữu ích",
  "image":       "string — đường dẫn ảnh: 'assets/images/<tên-file>.jpg'",
  "tags":        ["array — 3–5 tag ngắn để hiển thị trên card"]
}
```

**Field phái sinh (tính trong JS, không lưu trong JSON):**
- `has_power`: `true` nếu `outlets.min >= 10` (quy ước) hoặc team đặt thủ công.
- `tags`: tự generate từ ratings + boolean fields — xem hàm `generateTags()` bên dưới.

```javascript
function generateTags(loc) {
  const tags = [];
  if (loc.ratings.wifi_speed >= 4)  tags.push("Wifi mạnh");
  if (loc.has_power)                tags.push("Có ổ điện");
  if (loc.ratings.quietness >= 4)   tags.push("Yên tĩnh");
  if (loc.group_friendly)           tags.push("Học nhóm được");
  if (loc.ratings.lighting_ac >= 4) tags.push("Sáng & mát");
  if (loc.near_class)               tags.push("Gần lớp");
  return tags.slice(0, 3); // hiển thị tối đa 3 tag trên card
}
```

---

## 3. Schema Google Sheets `[USAGE_DATA]`

Sheet dùng để nhận dữ liệu cộng đồng từ SV gửi lên qua web.

| Cột | Kiểu | Ý nghĩa | Ví dụ |
|---|---|---|---|
| `timestamp` | datetime | Thời điểm ghi nhận | `2025-05-22 14:30:00` |
| `location_id` | string | Khớp với `id` trong locations.json | `thu-vien-thong-minh` |
| `action` | string | `checkin` / `rating` / `report` | `checkin` |
| `occupancy` | string | `trống` / `vừa` / `đông` | `trống` |
| `rating` | number (1–5) | Điểm đánh giá (chỉ có khi action=`rating`) | `4` |
| `comment` | string | Góp ý tùy chọn, tối đa 100 ký tự | `"Buổi chiều khá vắng"` |
| `session_id` | string | UUID ngẫu nhiên tạo client-side, tránh đếm trùng | `"a3f2c1..."` |

---

## 4. Apps Script — 2 Endpoint

> ⚠️ **Trạng thái hiện tại: CHƯA CÓ URL.** Khi build, tạm mock dữ liệu bằng local JS. Để comment `// TODO: replace with fetch(APPS_SCRIPT_URL)` tại đúng chỗ.

### Endpoint GET — Đọc trạng thái

**URL:** `GET https://<apps-script-url>?action=getStatus`

**Response trả về JSON:**
```json
{
  "status": "ok",
  "data": {
    "thu-vien-thong-minh": {
      "occupancy": "trống",
      "updated_at": "2025-05-22T14:30:00",
      "avg_rating": 4.2,
      "total_ratings": 17
    },
    "gs25": {
      "occupancy": "đông",
      "updated_at": "2025-05-22T13:55:00",
      "avg_rating": 2.8,
      "total_ratings": 5
    }
  }
}
```

**Logic trong Apps Script:**
- Đọc `[USAGE_DATA]` sheet.
- Với mỗi `location_id`, lọc các row có `timestamp` trong 2 giờ gần nhất.
- Lấy `occupancy` xuất hiện nhiều nhất (majority vote) → đó là trạng thái hiển thị.
- Tính `avg_rating` từ tất cả row có `action = "rating"` (không giới hạn 2 giờ).
- Nếu không có row nào trong 2 giờ → trả `occupancy: null` (hiển thị "Chưa cập nhật").

### Endpoint POST — Ghi dữ liệu

**URL:** `POST https://<apps-script-url>`

**Request body (JSON):**
```json
{
  "action":      "checkin",
  "location_id": "thu-vien-thong-minh",
  "occupancy":   "trống",
  "rating":      4,
  "comment":     "Vắng, nhiều chỗ ngồi",
  "session_id":  "a3f2c1d9..."
}
```

**Response:**
```json
{ "status": "ok" }
```

**Logic:** Append 1 dòng mới vào Sheet `[USAGE_DATA]`.

---

## 5. Mock data khi chưa có Apps Script

Tạo file `js/mock-status.js` với nội dung:

```javascript
// TODO: Khi có Apps Script URL, xóa file này và thay bằng fetch thật.
// Apps Script URL sẽ được điền vào: const APPS_SCRIPT_URL = "https://...";

const MOCK_STATUS = {
  "thu-vien-thong-minh":        { occupancy: "trống",   avg_rating: 4.5, total_ratings: 23 },
  "thu-vien-tri-thuc":          { occupancy: "vừa",     avg_rating: 4.2, total_ratings: 18 },
  "phong-doc-sach-acb":         { occupancy: "đông",    avg_rating: 3.8, total_ratings: 12 },
  "phong-tu-hoc-tich-hop":      { occupancy: "trống",   avg_rating: 4.0, total_ratings: 9  },
  "english-zone":               { occupancy: "vừa",     avg_rating: 3.5, total_ratings: 7  },
  "trung-nguyen-e-coffee":      { occupancy: "trống",   avg_rating: 4.3, total_ratings: 14 },
  "spacep-study-working-space": { occupancy: "trống",   avg_rating: 4.7, total_ratings: 31 },
  "tim-say-cafe-banh":          { occupancy: "đông",    avg_rating: 4.1, total_ratings: 20 },
  "gs25":                       { occupancy: "đông",    avg_rating: 2.9, total_ratings: 8  },
  "baba-coffee-tea":            { occupancy: "vừa",     avg_rating: 4.0, total_ratings: 11 },
  "bibli-library-cafe":         { occupancy: "trống",   avg_rating: 4.6, total_ratings: 27 },
  "highlands-coffee-ntp":       { occupancy: "vừa",     avg_rating: 4.2, total_ratings: 19 },
  "geek-hub":                   { occupancy: "trống",   avg_rating: 4.8, total_ratings: 15 },
  "south-ground-coworking-cafe":{ occupancy: "vừa",     avg_rating: 4.4, total_ratings: 22 },
  "the-workshop-coffee":        { occupancy: "trống",   avg_rating: 4.5, total_ratings: 30 },
  "chon-rieng-cafe":            { occupancy: null,      avg_rating: null, total_ratings: 0 }
};

async function fetchStatus() {
  // TODO: thay đoạn này bằng:
  // const res = await fetch(APPS_SCRIPT_URL + "?action=getStatus");
  // return (await res.json()).data;
  return MOCK_STATUS;
}

async function postReport(payload) {
  console.log("Mock POST:", payload);
  // TODO: thay bằng:
  // await fetch(APPS_SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
  return { status: "ok" };
}
```

---

## 6. Cách ghép tĩnh + động trong JS

```javascript
async function renderLocations() {
  // 1. Load dữ liệu tĩnh
  const res = await fetch("data/locations.json");
  const { locations } = await res.json();

  // 2. Load trạng thái động (mock hoặc thật)
  const statusMap = await fetchStatus(); // từ mock-status.js hoặc Apps Script

  // 3. Ghép và render
  locations.forEach(loc => {
    const status = statusMap[loc.id] || { occupancy: null, avg_rating: null };
    renderCard({ ...loc, ...status });
  });
}
```
