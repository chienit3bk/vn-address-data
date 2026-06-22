/**
 * Tải dữ liệu hành chính từ các file JSON trong `data/` — đây là NGUỒN CHÍNH.
 *
 *   import { loadAddressData } from "./dist/index.js";
 *   const data = await loadAddressData();              // { provinces, wards }
 *   createAddressDropdowns("#addr", { data });
 *
 * Muốn cập nhật realtime thì tự gọi API địa danh Nhất Tín (xem README) rồi map
 * về cùng shape — phần dropdown dùng lại nguyên vẹn.
 */
import type {
  Province,
  WardWithProvince,
  ProvinceBundle,
  OldDistrictWithProvince,
} from "./types.js";

export interface AddressDataset {
  provinces: Province[];
  wards: WardWithProvince[];
}

export interface LoadOptions {
  /** Thư mục chứa file JSON (mặc định "./data"). */
  baseUrl?: string;
  /** Inject fetch (test, hoặc môi trường không có global fetch). */
  fetchImpl?: typeof fetch;
}

const DEFAULT_BASE = "./data";

function resolve(opts: LoadOptions): { base: string; fetchImpl: typeof fetch } {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, "");
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("Không có fetch khả dụng; hãy truyền opts.fetchImpl.");
  return { base, fetchImpl };
}

async function getJson<T>(url: string, fetchImpl: typeof fetch): Promise<T> {
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`Không tải được ${url}: ${res.status}`);
  return (await res.json()) as T;
}

/** Tải `provinces.json` + `wards.json` — đủ để dựng 2 dropdown. */
export async function loadAddressData(opts: LoadOptions = {}): Promise<AddressDataset> {
  const { base, fetchImpl } = resolve(opts);
  const [provinces, wards] = await Promise.all([
    getJson<Province[]>(`${base}/provinces.json`, fetchImpl),
    getJson<WardWithProvince[]>(`${base}/wards.json`, fetchImpl),
  ]);
  return { provinces, wards };
}

/** Tải danh sách tỉnh (`provinces.json`). */
export function loadProvinces(opts: LoadOptions = {}): Promise<Province[]> {
  const { base, fetchImpl } = resolve(opts);
  return getJson<Province[]>(`${base}/provinces.json`, fetchImpl);
}

/** Tải toàn bộ xã/phường (`wards.json`). */
export function loadWards(opts: LoadOptions = {}): Promise<WardWithProvince[]> {
  const { base, fetchImpl } = resolve(opts);
  return getJson<WardWithProvince[]>(`${base}/wards.json`, fetchImpl);
}

/** Tải file đầy đủ của 1 tỉnh: `data/provinces/<slug>.json`. */
export function loadProvinceBundle(slug: string, opts: LoadOptions = {}): Promise<ProvinceBundle> {
  const { base, fetchImpl } = resolve(opts);
  return getJson<ProvinceBundle>(`${base}/provinces/${slug}.json`, fetchImpl);
}

/** Tải `old-districts.json` (quận/huyện cũ + xã/phường tương ứng). */
export function loadOldDistricts(opts: LoadOptions = {}): Promise<OldDistrictWithProvince[]> {
  const { base, fetchImpl } = resolve(opts);
  return getJson<OldDistrictWithProvince[]>(`${base}/old-districts.json`, fetchImpl);
}
