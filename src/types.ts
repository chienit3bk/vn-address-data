/**
 * Kiểu dữ liệu cho dữ liệu hành chính VN (cơ cấu 34 tỉnh/thành).
 *
 * Gồm 2 nhóm:
 *  - `Ntx*`      : shape thô trả về từ API Nhất Tín (https://docs.ntlogistics.vn).
 *  - phần còn lại: shape đã chuẩn hoá, khớp với các file trong `data/`.
 */

/* ----------------------------- API Nhất Tín ----------------------------- */

/** Envelope chung của mọi response API Nhất Tín. */
export interface NtxEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** `GET /v3/loc/provinces` */
export interface NtxProvince {
  id: string;
  province_name: string;
  is_new: string; // "Y" | "N"
}

/** `GET /v3/loc/districts` */
export interface NtxDistrict {
  id: string;
  district_name: string;
  is_new: string;
}

/** `GET /v3/loc/wards` */
export interface NtxWard {
  id: string;
  ward_name: string;
  is_new: string;
  /** API có thể bổ sung mã bưu chính ở các bản sau; để optional cho an toàn. */
  postal_code?: string;
}

/* ----------------------------- Đã chuẩn hoá ----------------------------- */

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

/** File đầy đủ theo từng tỉnh: `data/provinces/<slug>.json`. */
export interface ProvinceBundle extends Province {
  wards: Ward[];
  oldDistricts: OldDistrict[];
}

/** Tham chiếu tỉnh tối thiểu, dùng khi chuẩn hoá xã/phường. */
export interface ProvinceRef {
  code: string;
  slug: string;
  name: string;
  fullName: string;
}
