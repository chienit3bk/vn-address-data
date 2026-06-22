/** Test cho data loader (đọc từ JSON), dùng fetch giả lập. */
import { test } from "node:test";
import assert from "node:assert/strict";

import { loadAddressData, loadProvinceBundle, loadOldDistricts } from "./data.js";

/** fetch giả: trả JSON theo đuôi URL, còn lại 404. */
function fakeFetch(map: Record<string, unknown>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(map).find((k) => url.endsWith(k));
    if (key === undefined) return new Response("not found", { status: 404 });
    return new Response(JSON.stringify(map[key]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

const PROVINCES = [
  {
    code: "18",
    name: "An Giang",
    slug: "an-giang",
    type: "province",
    isCentral: false,
    fullName: "Tỉnh An Giang",
  },
];
const WARDS = [
  {
    code: "00001",
    name: "Rạch Giá",
    fullName: "Phường Rạch Giá, Tỉnh An Giang",
    slug: "rach-gia",
    type: "ward",
    postalCode: "30742",
    provinceCode: "18",
    provinceSlug: "an-giang",
    provinceName: "An Giang",
  },
];

test("loadAddressData: đọc provinces.json + wards.json", async () => {
  const data = await loadAddressData({
    baseUrl: "./data",
    fetchImpl: fakeFetch({ "provinces.json": PROVINCES, "wards.json": WARDS }),
  });
  assert.equal(data.provinces.length, 1);
  assert.equal(data.provinces[0]?.slug, "an-giang");
  assert.equal(data.wards[0]?.provinceCode, "18");
});

test("loadAddressData: baseUrl có dấu / thừa vẫn ghép đúng", async () => {
  const data = await loadAddressData({
    baseUrl: "https://cdn.example.com/data/",
    fetchImpl: fakeFetch({ "/data/provinces.json": PROVINCES, "/data/wards.json": WARDS }),
  });
  assert.equal(data.provinces.length, 1);
});

test("loadAddressData: lỗi HTTP -> throw", async () => {
  await assert.rejects(loadAddressData({ fetchImpl: fakeFetch({}) }), /Không tải được/);
});

test("loadProvinceBundle: đọc theo slug", async () => {
  const bundle = { ...PROVINCES[0], wards: [], oldDistricts: [] };
  const got = await loadProvinceBundle("an-giang", {
    baseUrl: "./data",
    fetchImpl: fakeFetch({ "provinces/an-giang.json": bundle }),
  });
  assert.equal(got.slug, "an-giang");
});

test("loadOldDistricts: đọc old-districts.json", async () => {
  const old = [
    {
      name: "Thành phố Long Xuyên",
      slug: "thanh-pho-long-xuyen",
      provinceCode: "18",
      provinceSlug: "an-giang",
      provinceName: "An Giang",
      wards: [],
    },
  ];
  const got = await loadOldDistricts({
    baseUrl: "./data",
    fetchImpl: fakeFetch({ "old-districts.json": old }),
  });
  assert.equal(got[0]?.provinceSlug, "an-giang");
});
