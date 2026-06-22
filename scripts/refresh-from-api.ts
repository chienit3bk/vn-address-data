/**
 * Cập nhật lại toàn bộ data/*.json từ API Nhất Tín (realtime).
 *
 * Chạy:
 *   NTX_USERNAME=... NTX_PASSWORD=... NTX_ENV=production npm run refresh
 *
 * Yêu cầu: tài khoản API Nhất Tín + có mạng. Script này thay thế normalize.py
 * khi muốn lấy dữ liệu trực tiếp từ API thay vì từ file export metaobject.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NhatTinAddressClient, type Environment } from "../src/index.js";
import type { WardWithProvince, OldDistrict } from "../src/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");

async function writeJson(path: string, obj: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(obj, null, 2) + "\n", "utf-8");
}

async function main(): Promise<void> {
  const client = new NhatTinAddressClient({
    env: (process.env.NTX_ENV as Environment) ?? "production",
    username: process.env.NTX_USERNAME,
    password: process.env.NTX_PASSWORD,
  });

  const provinces = await client.getProvinces();
  const allWards: WardWithProvince[] = [];
  const allOldDistricts: Array<OldDistrict & { provinceCode: string; provinceSlug: string; provinceName: string }> =
    [];
  const provincesIndex: unknown[] = [];

  for (const province of provinces) {
    const bundle = await client.getProvinceBundle(province);

    // file con tự chứa đầy đủ
    await writeJson(join(DATA, "provinces", `${province.slug}.json`), bundle);

    // gom cho file tổng
    for (const w of await client.getWards(province)) allWards.push(w);
    for (const d of bundle.oldDistricts) {
      allOldDistricts.push({
        name: d.name,
        slug: d.slug,
        provinceCode: province.code,
        provinceSlug: province.slug,
        provinceName: province.name,
        wards: d.wards,
      });
    }
    provincesIndex.push({
      ...province,
      wardsCount: bundle.wards.length,
      oldDistrictsCount: bundle.oldDistricts.length,
    });
    console.log(`✓ ${province.slug}: ${bundle.wards.length} xã/phường, ${bundle.oldDistricts.length} quận/huyện cũ`);
  }

  await writeJson(join(DATA, "provinces.json"), provincesIndex);
  await writeJson(join(DATA, "wards.json"), allWards);
  await writeJson(join(DATA, "old-districts.json"), allOldDistricts);

  console.log(
    `\nXong: ${provinces.length} tỉnh, ${allWards.length} xã/phường, ${allOldDistricts.length} quận/huyện cũ.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
