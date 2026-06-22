/**
 * Các hàm format / chuẩn hoá đơn giản, không phụ thuộc DOM hay network.
 * Dùng để biến shape thô từ API Nhất Tín thành shape chuẩn trong `data/`.
 */
import type {
  NtxProvince,
  NtxWard,
  NtxDistrict,
  Province,
  Ward,
  WardWithProvince,
  OldDistrict,
  ProvinceRef,
  UnitType,
} from "./types.js";

/** 6 thành phố trực thuộc trung ương (theo slug). */
export const CENTRAL_CITY_SLUGS: ReadonlySet<string> = new Set([
  "ha-noi",
  "hai-phong",
  "da-nang",
  "hue",
  "ho-chi-minh",
  "can-tho",
]);

/** Gọn khoảng trắng: trim, gộp space, bỏ space trước dấu phẩy/chấm phẩy. */
export function cleanText(input: string): string {
  return input
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+([,;])/g, "$1");
}

/**
 * Tạo slug không dấu từ tên tiếng Việt.
 * "Đắk Lắk" -> "dak-lak", "Thanh Hoá" -> "thanh-hoa".
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD") // tách dấu tổ hợp khỏi nguyên âm
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tổ hợp
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Bảng tiền tố đơn vị cấp xã (đầy đủ + viết tắt). */
const UNIT_PREFIXES: ReadonlyArray<{ re: RegExp; word: string; type: UnitType }> = [
  { re: /^(?:Phường|P\.)\s*/i, word: "Phường", type: "ward" },
  { re: /^(?:Thị\s*trấn|TT\.)\s*/i, word: "Thị trấn", type: "commune" },
  { re: /^(?:Đặc\s*khu|ĐK\.)\s*/i, word: "Đặc khu", type: "commune" },
  { re: /^(?:Xã|X\.)\s*/i, word: "Xã", type: "commune" },
];

/**
 * Tách tiền tố đơn vị khỏi tên.
 * "P.Hồng Gai" -> { word:"Phường", type:"ward", bareName:"Hồng Gai" }.
 * Không khớp tiền tố nào -> mặc định type "ward", word "".
 */
export function detectUnit(rawName: string): {
  word: string;
  type: UnitType;
  bareName: string;
} {
  const name = cleanText(rawName);
  for (const p of UNIT_PREFIXES) {
    if (p.re.test(name)) {
      return { word: p.word, type: p.type, bareName: cleanText(name.replace(p.re, "")) };
    }
  }
  return { word: "", type: "ward", bareName: name };
}

/** Ghép fullName: "Phường Hồng Gai, Tỉnh Quảng Ninh". */
export function buildFullName(
  bareName: string,
  unitWord: string,
  provinceFullName: string,
): string {
  const unit = unitWord ? `${unitWord} ${bareName}` : bareName;
  return provinceFullName ? `${unit}, ${provinceFullName}` : unit;
}

/** Chuẩn hoá 1 tỉnh từ API. */
export function normalizeProvince(api: NtxProvince): Province {
  const name = cleanText(api.province_name);
  const slug = slugify(name);
  const isCentral = CENTRAL_CITY_SLUGS.has(slug);
  return {
    code: String(api.id),
    name,
    slug,
    type: "province",
    isCentral,
    fullName: `${isCentral ? "Thành phố" : "Tỉnh"} ${name}`,
  };
}

/** Lấy ProvinceRef từ Province. */
export function toProvinceRef(p: Province): ProvinceRef {
  return { code: p.code, slug: p.slug, name: p.name, fullName: p.fullName };
}

/** Chuẩn hoá 1 xã/phường (kèm tham chiếu tỉnh). */
export function normalizeWard(api: NtxWard, province: ProvinceRef): WardWithProvince {
  const { word, type, bareName } = detectUnit(api.ward_name);
  const unitWord = word || "Phường";
  return {
    code: String(api.id),
    name: bareName,
    fullName: buildFullName(bareName, unitWord, province.fullName),
    slug: slugify(bareName),
    type,
    postalCode: api.postal_code ?? null,
    provinceCode: province.code,
    provinceSlug: province.slug,
    provinceName: province.name,
  };
}

/** Chuẩn hoá 1 xã/phường nhưng KHÔNG kèm tham chiếu tỉnh (dùng trong file con). */
export function normalizeWardBare(api: NtxWard, provinceFullName: string): Ward {
  const { word, type, bareName } = detectUnit(api.ward_name);
  return {
    code: String(api.id),
    name: bareName,
    fullName: buildFullName(bareName, word || "Phường", provinceFullName),
    slug: slugify(bareName),
    type,
    postalCode: api.postal_code ?? null,
  };
}

/** Bỏ các trường tham chiếu tỉnh khỏi 1 ward (để dùng trong file con). */
export function stripProvinceRef(w: WardWithProvince): Ward {
  const { provinceCode, provinceSlug, provinceName, ...bare } = w;
  void provinceCode;
  void provinceSlug;
  void provinceName;
  return bare;
}

/** Chuẩn hoá 1 quận/huyện cũ. */
export function normalizeDistrict(api: NtxDistrict, wards: Ward[] = []): OldDistrict {
  const name = cleanText(api.district_name);
  return { name, slug: slugify(name), wards };
}
