/**
 * Tiện ích xử lý tên/chuỗi địa danh tiếng Việt — thuần, không phụ thuộc gì.
 */
import type { UnitType } from "./types.js";

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
 * "Phường Hồng Gai" -> { word:"Phường", type:"ward", bareName:"Hồng Gai" }.
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
