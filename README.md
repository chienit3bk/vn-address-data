# VN Address Data

Dữ liệu hành chính Việt Nam (cơ cấu 34 tỉnh/thành)

**Nguồn dữ liệu:** đơn vị vận chuyển **Nhất Tín** (Nhất Tín Express).

## Cấu trúc thư mục

```
data/
├── provinces.json          # 34 tỉnh/thành (kèm số lượng xã/phường & quận/huyện cũ)
├── wards.json              # 3.317 xã/phường (cơ cấu mới), có tham chiếu tỉnh
├── old-districts.json      # 691 quận/huyện cũ + xã/phường tương ứng
└── provinces/
    ├── an-giang.json       # 34 file, mỗi tỉnh 1 file tự chứa đầy đủ
    ├── bac-ninh.json
    └── ... (<slug>.json)
```

## Schema

### `provinces.json`
```jsonc
[{
  "code": "18", "name": "An Giang", "slug": "an-giang",
  "type": "province", "isCentral": false, "fullName": "Tỉnh An Giang",
  "wardsCount": 102, "oldDistrictsCount": 11
}]
```

### `wards.json` — xã/phường cơ cấu mới (trực thuộc tỉnh)
```jsonc
[{
  "code": "00001", "name": "Rạch Giá", "fullName": "Phường Rạch Giá, Tỉnh An Giang",
  "slug": "rach-gia", "type": "ward", "postalCode": "30742",
  "provinceCode": "18", "provinceSlug": "an-giang", "provinceName": "An Giang"
}]
```
`type` ∈ `{ "ward", "commune" }` (phường / xã).

### `old-districts.json` — quận/huyện cũ
```jsonc
[{
  "name": "Thành phố Long Xuyên", "slug": "thanh-pho-long-xuyen",
  "provinceCode": "18", "provinceSlug": "an-giang", "provinceName": "An Giang",
  "wards": [{ "code": "30292", "name": "Bình Đức",
              "fullName": "Phường Bình Đức, Tỉnh An Giang",
              "slug": "binh-duc", "postalCode": "30292" }]
}]
```

### `provinces/<slug>.json` — đầy đủ theo tỉnh
```jsonc
{
  "code": "18", "name": "An Giang", "slug": "an-giang", "type": "province",
  "isCentral": false, "fullName": "Tỉnh An Giang",
  "wards": [ /* như wards.json, không lặp lại tham chiếu tỉnh */ ],
  "oldDistricts": [ /* như old-districts.json, không lặp lại tham chiếu tỉnh */ ]
}
```

## Chuẩn hóa đã áp dụng

- Sửa lỗi gõ `type: "comune"` → `"commune"`.
- Trim khoảng trắng thừa, gộp khoảng trắng đôi, bỏ space trước dấu phẩy trong `name`/`fullName`.
- Thêm tham chiếu `provinceCode` / `provinceSlug` / `provinceName` vào `wards.json` và `old-districts.json`.
- Sắp xếp: tỉnh theo `code`; xã/phường theo `code`; quận/huyện cũ theo `slug`.

## Số liệu

| Mục            | Số lượng |
|----------------|----------|
| Tỉnh/thành     | 34       |
| Xã/phường (mới)| 3.317    |
| Quận/huyện cũ  | 691      |
| Xã/phường (cũ) | 3.652    |

Tái tạo từ file export: `python3 normalize.py`

---

## Thư viện TypeScript (`src/`)

Thư viện nhỏ, không phụ thuộc bên ngoài. **Nguồn dữ liệu là các file `data/*.json`**
(đọc qua `loadAddressData`).

```
src/
├── types.ts      # kiểu dữ liệu
├── format.ts     # slugify, cleanText, detectUnit, buildFullName
├── data.ts       # loadAddressData / loadProvinceBundle — đọc từ data/*.json
├── dropdown.ts   # 2 dropdown phụ thuộc, inject vào HTML bất kỳ
├── index.ts      # export chung
└── *.test.ts
examples/dropdown-demo.html   # demo
```

Scripts:

```bash
npm install        # cài devDependencies (tsx, typescript, @types/node)
npm test           # chạy test (tsx --test)
npm run build      # biên dịch src/ -> dist/ (ESM + .d.ts)
npm run demo       # build rồi mở demo dropdown (serve .)
```

### Dùng 2 dropdown trong HTML bất kỳ

Dữ liệu đọc trực tiếp từ `data/*.json` qua `loadAddressData`:

```html
<div id="addr"></div>
<script type="module">
  import { createAddressDropdowns, loadAddressData } from "./dist/index.js";
  const data = await loadAddressData({ baseUrl: "./data" }); // đọc provinces.json + wards.json
  createAddressDropdowns("#addr", {
    data,
    provinceName: "province_code",   // name attr để submit form
    wardName: "ward_code",
    onChange: (sel) => console.log(sel.province, sel.ward),
  });
</script>
```

Nếu đã có sẵn JSON thì truyền thẳng, khỏi cần `loadAddressData`:

```ts
createAddressDropdowns("#addr", { data: { provinces, wards } });
```

Hoặc lấy chuỗi HTML để chèn vào nơi khác rồi gắn sự kiện sau:

```ts
import { renderAddressDropdownsHTML, mountAddressDropdowns } from "./dist/index.js";
el.innerHTML = renderAddressDropdownsHTML({ data, initialProvinceCode: "18" });
mountAddressDropdowns(el, { data });
```

### Hàm format

```ts
import { slugify, detectUnit, buildFullName } from "./dist/index.js";
slugify("Đắk Lắk");                 // "dak-lak"
detectUnit("Phường Rạch Giá");      // { word:"Phường", type:"ward", bareName:"Rạch Giá" }
buildFullName("Rạch Giá", "Phường", "Tỉnh An Giang"); // "Phường Rạch Giá, Tỉnh An Giang"
```

---

## Nguồn dữ liệu & cập nhật

Dữ liệu được lấy từ đơn vị vận chuyển **Nhất Tín**. Bộ JSON trong `data/` là bản đã
chuẩn hoá sẵn — dùng trực tiếp, không cần gọi API.

Nếu sau này cần **tự cập nhật/đồng bộ realtime**, tham khảo API địa danh của Nhất Tín
(tự viết phần gọi API theo nhu cầu):

- Tài liệu: **https://docs.ntlogistics.vn**
- Endpoint địa danh (cơ cấu mới, `is_new=1`): `GET /v3/loc/provinces`, `GET /v3/loc/wards`, `GET /v3/loc/districts`

Hoặc tạo lại bộ JSON từ file export bằng `python3 normalize.py`.
