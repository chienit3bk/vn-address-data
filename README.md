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

Kèm theo dữ liệu là một thư viện nhỏ, không phụ thuộc bên ngoài, gồm: hàm format,
client gọi API Nhất Tín (cập nhật realtime), và 2 dropdown Tỉnh → Phường/Xã.

```
src/
├── types.ts      # kiểu dữ liệu (API thô + đã chuẩn hoá)
├── format.ts     # slugify, detectUnit, buildFullName, normalizeProvince/Ward/District
├── client.ts     # NhatTinAddressClient — fetch realtime từ API Nhất Tín
├── dropdown.ts   # 2 dropdown phụ thuộc, inject vào HTML bất kỳ
├── index.ts      # export chung
└── format.test.ts
examples/dropdown-demo.html   # demo
scripts/refresh-from-api.ts   # cập nhật lại data/*.json từ API
```

Scripts:

```bash
npm install        # cài tsx + typescript (devDependencies)
npm test           # chạy test (tsx --test) — 17 test
npm run build      # biên dịch src/ -> dist/ (ESM + .d.ts)
npm run demo       # build rồi mở demo dropdown (serve .)
npm run refresh    # cập nhật data/*.json từ API (cần tài khoản Nhất Tín)
```

### Dùng 2 dropdown trong HTML bất kỳ

Dropdown ăn trực tiếp dữ liệu `provinces.json` + `wards.json`:

```html
<div id="addr"></div>
<script type="module">
  import { createAddressDropdowns } from "./dist/index.js";
  const [provinces, wards] = await Promise.all([
    fetch("./data/provinces.json").then((r) => r.json()),
    fetch("./data/wards.json").then((r) => r.json()),
  ]);
  createAddressDropdowns("#addr", {
    data: { provinces, wards },
    provinceName: "province_code",   // name attr để submit form
    wardName: "ward_code",
    onChange: (sel) => console.log(sel.province, sel.ward),
  });
</script>
```

Hoặc lấy chuỗi HTML để chèn vào nơi khác rồi gắn sự kiện sau:

```ts
import { renderAddressDropdownsHTML, mountAddressDropdowns } from "./dist/index.js";
el.innerHTML = renderAddressDropdownsHTML({ data, initialProvinceCode: "18" });
mountAddressDropdowns(el, { data });
```

### Hàm format

```ts
import { slugify, normalizeWard, toProvinceRef, normalizeProvince } from "./dist/index.js";
slugify("Đắk Lắk");                       // "dak-lak"
const p = normalizeProvince({ id: "18", province_name: "An Giang", is_new: "Y" });
normalizeWard({ id: "00001", ward_name: "P.Rạch Giá", is_new: "Y" }, toProvinceRef(p));
// -> { code, name:"Rạch Giá", fullName:"Phường Rạch Giá, Tỉnh An Giang", slug, type:"ward", provinceCode... }
```

---

## Cập nhật realtime từ API Nhất Tín

Dữ liệu gốc lấy từ **API địa danh Nhất Tín** (`https://docs.ntlogistics.vn`), nên có thể
làm tươi bất cứ lúc nào thay vì export thủ công.

| Môi trường | Host |
|------------|------|
| Production | `https://apiws.ntlogistics.vn` |
| Sandbox    | `https://apisandbox.ntlogistics.vn` |

**Xác thực (JWT):** `POST /v1/auth/sign-in` `{ username, password }` → `jwt_token` + `refresh_token`;
gửi header `Authorization: Bearer <jwt_token>`; hết hạn thì `POST /v1/auth/refresh-token`.

**Endpoint địa danh** (cơ cấu mới: `is_new=1`):

| Mục | Request |
|-----|---------|
| Tỉnh/thành | `GET /v3/loc/provinces?is_new=1` |
| Xã/phường (theo tỉnh) | `GET /v3/loc/wards?is_new=1&province_id=<id>` |
| Quận/huyện cũ | `GET /v3/loc/districts?province_id=<id>` |
| Xã/phường cũ (theo huyện) | `GET /v3/loc/wards?district_id=<id>` |

Client đã bọc sẵn và trả về dữ liệu **đã chuẩn hoá** đúng schema ở trên:

```ts
import { NhatTinAddressClient } from "./dist/index.js";
const client = new NhatTinAddressClient({ env: "production", username, password });
const provinces = await client.getProvinces();          // Province[]
const wards     = await client.getWards(provinces[0]);  // WardWithProvince[]
const bundle    = await client.getProvinceBundle(provinces[0]); // = provinces/<slug>.json
```

Làm tươi toàn bộ `data/`:

```bash
NTX_USERNAME=... NTX_PASSWORD=... NTX_ENV=production npm run refresh
```

> Lưu ý: tài khoản & token API do Nhất Tín cấp. Mã tỉnh/xã của API có thể khác mã trong
> bản export metaobject (tài liệu yêu cầu mapping theo mã địa danh Nhà nước) — kiểm tra
> lại `code` sau lần refresh đầu tiên.
