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

Tái tạo: `python3 normalize.py`
