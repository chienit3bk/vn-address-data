/**
 * Kiểu dữ liệu cho dữ liệu hành chính VN (cơ cấu 34 tỉnh/thành),
 * khớp với các file trong `data/`.
 */

/** Loại đơn vị cấp xã. */
export type UnitType = "ward" | "commune";

/** Tỉnh/thành phố. `type` là `"city"` cho 6 thành phố trực thuộc trung ương. */
export interface Province {
  code: string;
  name: string;
  slug: string;
  type: "province" | "city";
  isCentral: boolean;
  fullName: string;
  /** Chỉ có trong `provinces.json`, không có trong `provinces/<slug>.json`. */
  wardsCount?: number;
  /** Chỉ có trong `provinces.json`, không có trong `provinces/<slug>.json`. */
  oldDistrictsCount?: number;
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

/** Xã/phường trong quận/huyện cũ — không có `type` (JSON gốc không có trường này). */
export type OldDistrictWard = Omit<Ward, "type">;

/** Quận/huyện cũ + danh sách xã/phường tương ứng. */
export interface OldDistrict {
  name: string;
  slug: string;
  wards: OldDistrictWard[];
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
