/**
 * Kiểu dữ liệu cho dữ liệu hành chính VN (cơ cấu 34 tỉnh/thành),
 * khớp với các file trong `data/`.
 */

/** Loại đơn vị cấp xã. */
export type UnitType = "ward" | "commune";

/** Tỉnh/thành phố. */
export interface Province {
  code: string;
  name: string;
  slug: string;
  type: "province";
  isCentral: boolean;
  fullName: string;
}

/** Xã/phường (cơ cấu mới). */
export interface Ward {
  code: string;
  name: string;
  fullName: string;
  slug: string;
  type: UnitType;
  postalCode?: string | null;
}

/** Xã/phường kèm tham chiếu tỉnh (dùng trong `wards.json` phẳng). */
export interface WardWithProvince extends Ward {
  provinceCode: string;
  provinceSlug: string;
  provinceName: string;
}

/** Quận/huyện cũ + danh sách xã/phường tương ứng. */
export interface OldDistrict {
  name: string;
  slug: string;
  wards: Ward[];
}

/** Quận/huyện cũ kèm tham chiếu tỉnh (dùng trong `old-districts.json` phẳng). */
export interface OldDistrictWithProvince extends OldDistrict {
  provinceCode: string;
  provinceSlug: string;
  provinceName: string;
}

/** File đầy đủ theo từng tỉnh: `data/provinces/<slug>.json`. */
export interface ProvinceBundle extends Province {
  wards: Ward[];
  oldDistricts: OldDistrict[];
}
