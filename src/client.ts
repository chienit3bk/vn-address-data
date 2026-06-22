/**
 * Client gọi API địa danh Nhất Tín (https://docs.ntlogistics.vn) — dùng để
 * cập nhật dữ liệu realtime khi cần.
 *
 *   const c = new NhatTinAddressClient({ env: "production", username, password });
 *   const provinces = await c.getProvinces();          // đã chuẩn hoá
 *   const wards     = await c.getWards(provinces[0]);   // xã/phường theo tỉnh
 *
 * Xác thực JWT: tự đăng nhập khi gọi lần đầu, tự refresh khi gặp 401.
 */
import type {
  NtxProvince,
  NtxDistrict,
  NtxWard,
  Province,
  Ward,
  WardWithProvince,
  OldDistrict,
  ProvinceBundle,
} from "./types.js";
import {
  normalizeProvince,
  normalizeWard,
  normalizeWardBare,
  normalizeDistrict,
  stripProvinceRef,
  toProvinceRef,
} from "./format.js";

export type Environment = "production" | "sandbox";

/** Host theo môi trường (mục "Thông tin kết nối" trong tài liệu). */
export const NTX_HOSTS: Record<Environment, string> = {
  production: "https://apiws.ntlogistics.vn",
  sandbox: "https://apisandbox.ntlogistics.vn",
};

export interface NhatTinClientOptions {
  /** Chọn host theo môi trường (mặc định "production"). Bỏ qua nếu set `baseUrl`. */
  env?: Environment;
  /** Ghi đè host hoàn toàn. */
  baseUrl?: string;
  username?: string;
  password?: string;
  /** Có thể truyền sẵn token thay vì username/password. */
  accessToken?: string;
  refreshToken?: string;
  /** Cho phép inject fetch (test, hoặc môi trường không có global fetch). */
  fetchImpl?: typeof fetch;
}

export class NhatTinAddressClient {
  private readonly baseUrl: string;
  private readonly username?: string;
  private readonly password?: string;
  private accessToken?: string;
  private refreshToken?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: NhatTinClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? NTX_HOSTS[opts.env ?? "production"]).replace(/\/+$/, "");
    this.username = opts.username;
    this.password = opts.password;
    this.accessToken = opts.accessToken;
    this.refreshToken = opts.refreshToken;
    const f = opts.fetchImpl ?? globalThis.fetch;
    if (!f) throw new Error("Không có fetch khả dụng; hãy truyền opts.fetchImpl.");
    this.fetchImpl = f;
  }

  /* ------------------------------- Auth ------------------------------- */

  /** `POST /v1/auth/sign-in` -> lưu access & refresh token. */
  async signIn(): Promise<void> {
    if (!this.username || !this.password) {
      throw new Error("Cần username/password để đăng nhập.");
    }
    const res = await this.fetchImpl(`${this.baseUrl}/v1/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: this.username, password: this.password }),
    });
    const json = (await res.json()) as { success?: boolean; message?: string; data?: TokenData };
    if (!res.ok || !json?.success || !json.data) {
      throw new Error(`Đăng nhập thất bại: ${json?.message ?? res.status}`);
    }
    this.accessToken = json.data.jwt_token;
    this.refreshToken = json.data.refresh_token;
  }

  /** `POST /v1/auth/refresh-token` -> cấp token mới. */
  async refresh(): Promise<void> {
    if (!this.refreshToken) throw new Error("Chưa có refresh_token; gọi signIn() trước.");
    const res = await this.fetchImpl(`${this.baseUrl}/v1/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });
    const json = (await res.json()) as { success?: boolean; message?: string; data?: TokenData };
    if (!res.ok || !json?.success || !json.data) {
      throw new Error(`Refresh token thất bại: ${json?.message ?? res.status}`);
    }
    this.accessToken = json.data.jwt_token;
    this.refreshToken = json.data.refresh_token;
  }

  private async ensureToken(): Promise<void> {
    if (!this.accessToken) await this.signIn();
  }

  /** GET có xác thực + tự refresh 1 lần khi 401. */
  private async get<T>(
    path: string,
    params: Record<string, string | number | undefined>,
  ): Promise<T> {
    await this.ensureToken();
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
    const call = () =>
      this.fetchImpl(url.toString(), {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

    let res = await call();
    if (res.status === 401 && this.refreshToken) {
      await this.refresh();
      res = await call();
    }
    const json = (await res.json()) as { success?: boolean; message?: string; data?: T };
    if (!res.ok || !json?.success) {
      throw new Error(`GET ${path} thất bại: ${json?.message ?? res.status}`);
    }
    return json.data as T;
  }

  /* ----------------------------- Raw API ----------------------------- */

  getProvincesRaw(isNew = true): Promise<NtxProvince[]> {
    return this.get<NtxProvince[]>("/v3/loc/provinces", { is_new: isNew ? 1 : 0 });
  }

  getDistrictsRaw(provinceId: string): Promise<NtxDistrict[]> {
    return this.get<NtxDistrict[]>("/v3/loc/districts", { province_id: provinceId });
  }

  getWardsRaw(p: { provinceId?: string; districtId?: string; isNew?: boolean }): Promise<NtxWard[]> {
    return this.get<NtxWard[]>("/v3/loc/wards", {
      province_id: p.provinceId,
      district_id: p.districtId,
      is_new: p.isNew === undefined ? undefined : p.isNew ? 1 : 0,
    });
  }

  /* -------------------------- Đã chuẩn hoá --------------------------- */

  /** 34 tỉnh/thành cơ cấu mới, đã chuẩn hoá + sort theo code. */
  async getProvinces(): Promise<Province[]> {
    const raw = await this.getProvincesRaw(true);
    return raw.map(normalizeProvince).sort((a, b) => a.code.localeCompare(b.code));
  }

  /** Xã/phường (mới) của 1 tỉnh, kèm tham chiếu tỉnh. */
  async getWards(province: Province): Promise<WardWithProvince[]> {
    const raw = await this.getWardsRaw({ provinceId: province.code, isNew: true });
    const ref = toProvinceRef(province);
    return raw.map((w) => normalizeWard(w, ref)).sort((a, b) => a.code.localeCompare(b.code));
  }

  /** Quận/huyện cũ của 1 tỉnh + xã/phường cũ tương ứng. */
  async getOldDistricts(province: Province): Promise<OldDistrict[]> {
    const districts = await this.getDistrictsRaw(province.code);
    const out: OldDistrict[] = [];
    for (const d of districts) {
      const wraw = await this.getWardsRaw({ districtId: d.id, isNew: false });
      const wards: Ward[] = wraw
        .map((w) => normalizeWardBare(w, province.fullName))
        .sort((a, b) => a.code.localeCompare(b.code));
      out.push(normalizeDistrict(d, wards));
    }
    return out.sort((a, b) => a.slug.localeCompare(b.slug));
  }

  /** File đầy đủ của 1 tỉnh (giống `data/provinces/<slug>.json`). */
  async getProvinceBundle(province: Province): Promise<ProvinceBundle> {
    const [wards, oldDistricts] = await Promise.all([
      this.getWards(province),
      this.getOldDistricts(province),
    ]);
    return { ...province, wards: wards.map(stripProvinceRef), oldDistricts };
  }
}

interface TokenData {
  jwt_token: string;
  token_type: string;
  token_expires_in: string;
  refresh_token: string;
  refresh_expires_in: string;
}
