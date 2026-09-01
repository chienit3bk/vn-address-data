# VN Address Data

Vietnamese administrative data (34 provinces / 3,317 wards after the 2025 merger, plus 691
legacy districts) as plain JSON, with a tiny dependency-free TypeScript library for
slugs/name formatting and a Province → Ward dependent dropdown. Source: Nhất Tín Express.
Docs below are in Vietnamese.

`Node >= 20 · Yarn 1 · MIT`

Dữ liệu hành chính Việt Nam (cơ cấu 34 tỉnh/thành) + thư viện TypeScript nhỏ, không phụ
thuộc bên ngoài, để format tên/slug và dựng 2 dropdown Tỉnh → Phường/Xã.

**Nguồn dữ liệu:** đơn vị vận chuyển **Nhất Tín** (Nhất Tín Express).

## Số liệu

| Thành phần              | Số lượng |
| ------------------------ | -------: |
| Tỉnh/thành phố            |       34 |
| Xã/phường (cơ cấu mới)    |    3.317 |
| Quận/huyện cũ             |      691 |

## Cài đặt (dùng trong dự án)

Chưa publish lên npm — cài thẳng từ GitHub. Script `prepare` sẽ tự build `dist/` khi cài đặt.

```bash
yarn add github:chienit3bk/vn-address-data
# hoặc
npm i github:chienit3bk/vn-address-data
```

**Trong trình duyệt** (bundler nào cũng được — Vite, webpack, ...): các hàm `load*` dùng
`fetch` với đường dẫn tương đối nên chỉ chạy trong browser/HTTP. `data/*.json` không tự có
trên web — phải serve hoặc copy `node_modules/vn-address-data/data/` ra một public path rồi
trỏ `baseUrl` vào đó.

```ts
import { loadAddressData, createAddressDropdowns } from "vn-address-data";

// vd copy node_modules/vn-address-data/data/ -> public/vn-address-data/
const data = await loadAddressData({ baseUrl: "/vn-address-data" });
createAddressDropdowns("#addr", { data });
```

**Trong Node**: đọc thẳng JSON, không cần `fetch`/serve gì cả.

```ts
import provinces from "vn-address-data/data/provinces.json" with { type: "json" };
console.log(provinces.length); // 34
```

## Chạy ở máy (local dev)

```bash
git clone git@github.com:chienit3bk/vn-address-data.git
cd vn-address-data
nvm use              # đọc .nvmrc -> Node 22
yarn install         # tự build dist/ qua hook "prepare"
yarn test
yarn typecheck
yarn build           # biên dịch src/ -> dist/ (1 lần)
yarn dev             # biên dịch lại khi sửa src/ (watch)
yarn demo            # build rồi serve . trên localhost
```

Mở:

- `http://localhost:3000/examples/standalone-demo.html` — demo tự chứa, không cần `dist/`.
- `http://localhost:3000/examples/dropdown-demo.html` — demo dùng bản build trong `dist/`.

`serve` tự đổi sang port khác nếu 3000 đang bận — coi log terminal để biết port thật. Mở
`dropdown-demo.html` trực tiếp qua `file://` (không qua `yarn demo`) thì `fetch` không chạy
được, demo sẽ rơi về dữ liệu mẫu (`FALLBACK`) chỉ có 3 xã/phường.

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

src/
├── types.ts      # kiểu dữ liệu
├── format.ts     # slugify, cleanText, detectUnit, buildFullName
├── data.ts       # loadAddressData / loadProvinceBundle — đọc từ data/*.json
├── dropdown.ts   # 2 dropdown phụ thuộc, inject vào HTML bất kỳ
├── index.ts      # export chung
└── *.test.ts

examples/
├── standalone-demo.html   # demo tự chứa (không cần build) — dùng cho GitHub Pages
├── dropdown-demo.html     # demo dùng bản build trong dist/
└── preview.svg            # ảnh preview cho README
```

## Schema

### `provinces.json`

```jsonc
[
  {
    "code": "18", "name": "An Giang", "slug": "an-giang",
    "type": "province", "isCentral": false, "fullName": "Tỉnh An Giang",
    "wardsCount": 102, "oldDistrictsCount": 25
  },
  {
    "code": "01", "name": "Hà Nội", "slug": "ha-noi",
    "type": "city", "isCentral": true, "fullName": "Thành phố Hà Nội",
    "wardsCount": 126, "oldDistrictsCount": 30
  }
]
```

`type` ∈ `{ "province", "city" }` — `"city"` cho 6 thành phố trực thuộc trung ương (Hà Nội,
Hải Phòng, Đà Nẵng, Huế, Hồ Chí Minh, Cần Thơ), khi đó `isCentral: true`. `wardsCount` /
`oldDistrictsCount` **chỉ có trong `provinces.json`**, không có trong `provinces/<slug>.json`.

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

Xã/phường trong `wards` ở đây **không có trường `type`** — JSON gốc chỉ có
`code, name, fullName, slug, postalCode` (khác với `wards.json` phẳng ở trên).

### `provinces/<slug>.json` — đầy đủ theo tỉnh

```jsonc
{
  "code": "18", "name": "An Giang", "slug": "an-giang", "type": "province",
  "isCentral": false, "fullName": "Tỉnh An Giang",
  "wards": [ /* như wards.json, không lặp lại tham chiếu tỉnh */ ],
  "oldDistricts": [ /* như old-districts.json, không lặp lại tham chiếu tỉnh */ ]
}
```

Không có `wardsCount` / `oldDistrictsCount` ở đây — 2 trường đó chỉ nằm trong `provinces.json`.

## Chuẩn hóa đã áp dụng

- Sửa lỗi gõ `type: "comune"` → `"commune"`.
- Trim khoảng trắng thừa, gộp khoảng trắng đôi, bỏ space trước dấu phẩy trong `name`/`fullName`.
- Thêm tham chiếu `provinceCode` / `provinceSlug` / `provinceName` vào `wards.json` và `old-districts.json`.
- Sắp xếp: tỉnh theo `code`; xã/phường theo `code`; quận/huyện cũ theo `slug`.

## Demo

![Preview 2 dropdown Tỉnh → Phường/Xã](examples/preview.svg)

Cách chạy: xem mục [Chạy ở máy (local dev)](#chạy-ở-máy-local-dev) ở trên.

## API

Thư viện nhỏ, không phụ thuộc bên ngoài. **Nguồn dữ liệu là các file `data/*.json`**
(đọc qua `loadAddressData` hoặc import trực tiếp trong Node).

### `format.ts`

| Hàm | Chữ ký | Mô tả |
| --- | --- | --- |
| `cleanText` | `(input: string) => string` | Gọn khoảng trắng: trim, gộp space, bỏ space trước dấu phẩy/chấm phẩy. |
| `slugify` | `(input: string) => string` | Tạo slug không dấu từ tên tiếng Việt (`"Đắk Lắk"` → `"dak-lak"`). |
| `detectUnit` | `(rawName: string) => { word: string; type: UnitType; bareName: string }` | Tách tiền tố đơn vị (Phường/Xã/Thị trấn/Đặc khu) khỏi tên. |
| `buildFullName` | `(bareName: string, unitWord: string, provinceFullName: string) => string` | Ghép fullName: `"Phường Hồng Gai, Tỉnh Quảng Ninh"`. |

### `data.ts`

| Hàm/kiểu | Chữ ký | Mô tả |
| --- | --- | --- |
| `loadAddressData` | `(opts?: LoadOptions) => Promise<AddressDataset>` | Tải `provinces.json` + `wards.json` — đủ để dựng 2 dropdown. |
| `loadProvinces` | `(opts?: LoadOptions) => Promise<Province[]>` | Tải danh sách tỉnh (`provinces.json`). |
| `loadWards` | `(opts?: LoadOptions) => Promise<WardWithProvince[]>` | Tải toàn bộ xã/phường (`wards.json`). |
| `loadProvinceBundle` | `(slug: string, opts?: LoadOptions) => Promise<ProvinceBundle>` | Tải file đầy đủ 1 tỉnh (`data/provinces/<slug>.json`). |
| `loadOldDistricts` | `(opts?: LoadOptions) => Promise<OldDistrictWithProvince[]>` | Tải `old-districts.json`. |
| `LoadOptions` | `{ baseUrl?: string; fetchImpl?: typeof fetch }` | `baseUrl` mặc định `"./data"`; `fetchImpl` để inject fetch (test hoặc môi trường không có global fetch). |
| `AddressDataset` | `{ provinces: Province[]; wards: WardWithProvince[] }` | Kết quả trả về của `loadAddressData`. |

### `dropdown.ts`

| Hàm | Chữ ký | Mô tả |
| --- | --- | --- |
| `createAddressDropdowns` | `(target: HTMLElement \| string, options: AddressDropdownOptions) => AddressDropdownHandle` | Render HTML + gắn sự kiện vào 1 container, 1 lần gọi. |
| `renderAddressDropdownsHTML` | `(options: AddressDropdownOptions) => string` | Sinh chuỗi HTML cho 2 dropdown (không gắn sự kiện). |
| `mountAddressDropdowns` | `(root: HTMLElement, options: AddressDropdownOptions) => AddressDropdownHandle` | Gắn hành vi (đổi tỉnh → nạp lại phường/xã) vào markup đã render sẵn trong `root`. |
| `escapeHtml` | `(value: string) => string` | Escape ký tự HTML để chống XSS khi nhúng vào markup. |
| `indexWardsByProvince` | `(wards: DdWard[]) => Map<string, DdWard[]>` | Gom danh sách xã/phường theo mã tỉnh. |

**`AddressDropdownOptions`** (field · mặc định):

| Field | Mặc định |
| --- | --- |
| `data: AddressData` | *(bắt buộc)* |
| `idPrefix?: string` | `"vn-addr"` |
| `useFullName?: boolean` | `false` |
| `provinceLabel?: string` | `"Tỉnh/Thành phố"` |
| `wardLabel?: string` | `"Phường/Xã"` |
| `provincePlaceholder?: string` | `"-- Chọn Tỉnh/Thành phố --"` |
| `wardPlaceholder?: string` | `"-- Chọn Phường/Xã --"` |
| `provinceName?: string` | không set (không có attr `name` nếu bỏ trống) |
| `wardName?: string` | không set (không có attr `name` nếu bỏ trống) |
| `initialProvinceCode?: string` | không có |
| `initialWardCode?: string` | không có |
| `onChange?: (selection: AddressSelection) => void` | không có |

**`AddressDropdownHandle`**:

| Field/method | Mô tả |
| --- | --- |
| `root: HTMLElement` | Container đã render. |
| `provinceSelect: HTMLSelectElement` | Thẻ `<select>` tỉnh. |
| `wardSelect: HTMLSelectElement` | Thẻ `<select>` phường/xã. |
| `getSelection(): AddressSelection` | Lấy tỉnh/phường đang chọn. |
| `setProvince(code: string): void` | Chọn tỉnh bằng code, tự nạp lại danh sách phường/xã. |
| `destroy(): void` | Gỡ các event listener đã gắn. |

**Các kiểu export**: `UnitType`, `Province`, `Ward`, `WardWithProvince`, `OldDistrictWard`,
`OldDistrict`, `OldDistrictWithProvince`, `ProvinceBundle`, `AddressDataset`, `LoadOptions`,
`DdProvince`, `DdWard`, `AddressData`, `AddressSelection`, `AddressDropdownOptions`,
`AddressDropdownHandle`.

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

## Nguồn dữ liệu & cập nhật

Dữ liệu trong `data/` được kéo **1 lần** (tháng 6/2025) từ API Nhất Tín
(`https://docs.ntlogistics.vn`, `GET /v3/loc/provinces|wards|districts` với `is_new=1`,
xác thực JWT bằng tài khoản NTX), sau đó chuẩn hoá theo danh sách ở mục
[Chuẩn hóa đã áp dụng](#chuẩn-hóa-đã-áp-dụng). Repo **không giữ script refresh** — muốn xem
lại code cũ (client gọi API + script ghi ra `data/`) thì chạy:

```bash
git show f8397267^:scripts/refresh-from-api.ts
git show f8397267^:src/client.ts
```

Muốn cập nhật thủ công khi Nhất Tín đổi dữ liệu: gọi lại API → map về đúng schema ở mục
[Schema](#schema) → build lại 3 file gốc (`provinces.json`, `wards.json`,
`old-districts.json`) + 34 file `provinces/<slug>.json` → cập nhật lại bảng
[Số liệu](#số-liệu) → chạy `yarn test`.

## Đóng góp

Tạo branch mới từ `main`, sửa xong chạy `yarn check` (typecheck + test), rồi mở PR.

## Giấy phép

MIT — xem [LICENSE](LICENSE).
