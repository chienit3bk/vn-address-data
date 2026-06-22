/**
 * Test cho hàm format + thành phần dropdown (phần thuần, không cần DOM).
 * Chạy: `npm test`  (tsx --test).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { slugify, cleanText, detectUnit, buildFullName } from "./format.js";
import {
  escapeHtml,
  indexWardsByProvince,
  renderAddressDropdownsHTML,
  type AddressData,
} from "./dropdown.js";

/* ------------------------------- slugify ------------------------------- */

test("slugify: bỏ dấu tiếng Việt + xử lý đ", () => {
  assert.equal(slugify("Đắk Lắk"), "dak-lak");
  assert.equal(slugify("Thanh Hoá"), "thanh-hoa");
  assert.equal(slugify("Bà Rịa – Vũng Tàu"), "ba-ria-vung-tau");
  assert.equal(slugify("Hồ Chí Minh"), "ho-chi-minh");
  assert.equal(slugify("Thừa Thiên Huế"), "thua-thien-hue");
});

test("slugify: gọn dấu gạch nối ở đầu/cuối và lặp", () => {
  assert.equal(slugify("  Quận 1!! "), "quan-1");
  assert.equal(slugify("A / B"), "a-b");
});

/* ------------------------------ cleanText ------------------------------ */

test("cleanText: trim, gộp space, bỏ space trước dấu phẩy", () => {
  assert.equal(cleanText("  Phường  Mỹ Thới  "), "Phường Mỹ Thới");
  assert.equal(cleanText("Mỹ Thới , Tỉnh An Giang"), "Mỹ Thới, Tỉnh An Giang");
});

/* ------------------------------ detectUnit ----------------------------- */

test("detectUnit: nhận diện tiền tố đầy đủ và viết tắt", () => {
  assert.deepEqual(detectUnit("P.Hồng Gai"), {
    word: "Phường",
    type: "ward",
    bareName: "Hồng Gai",
  });
  assert.deepEqual(detectUnit("Phường Rạch Giá"), {
    word: "Phường",
    type: "ward",
    bareName: "Rạch Giá",
  });
  assert.deepEqual(detectUnit("Xã Nhơn Mỹ"), {
    word: "Xã",
    type: "commune",
    bareName: "Nhơn Mỹ",
  });
  assert.deepEqual(detectUnit("Đặc khu Phú Quốc"), {
    word: "Đặc khu",
    type: "commune",
    bareName: "Phú Quốc",
  });
});

test("detectUnit: không có tiền tố -> mặc định ward", () => {
  assert.deepEqual(detectUnit("Rạch Giá"), { word: "", type: "ward", bareName: "Rạch Giá" });
});

/* ----------------------------- buildFullName --------------------------- */

test("buildFullName: ghép đơn vị + tỉnh", () => {
  assert.equal(
    buildFullName("Hồng Gai", "Phường", "Tỉnh Quảng Ninh"),
    "Phường Hồng Gai, Tỉnh Quảng Ninh",
  );
  assert.equal(
    buildFullName("Phú Quốc", "Đặc khu", "Tỉnh An Giang"),
    "Đặc khu Phú Quốc, Tỉnh An Giang",
  );
});

/* -------------------------------- escapeHtml --------------------------- */

test("escapeHtml: escape ký tự nguy hiểm", () => {
  assert.equal(escapeHtml(`<a href="x">&'`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
});

/* --------------------------- indexWardsByProvince ---------------------- */

test("indexWardsByProvince: gom theo provinceCode", () => {
  const idx = indexWardsByProvince([
    { code: "1", name: "A", provinceCode: "18" },
    { code: "2", name: "B", provinceCode: "18" },
    { code: "3", name: "C", provinceCode: "01" },
  ]);
  assert.equal(idx.get("18")?.length, 2);
  assert.equal(idx.get("01")?.length, 1);
  assert.equal(idx.get("99"), undefined);
});

/* ----------------------- renderAddressDropdownsHTML -------------------- */

const SAMPLE: AddressData = {
  provinces: [
    { code: "18", name: "An Giang", fullName: "Tỉnh An Giang" },
    { code: "01", name: "Hà Nội", fullName: "Thành phố Hà Nội" },
  ],
  wards: [
    { code: "00001", name: "Rạch Giá", provinceCode: "18" },
    { code: "00030", name: "Long Xuyên", provinceCode: "18" },
    { code: "00100", name: "Hoàn Kiếm", provinceCode: "01" },
  ],
};

test("renderHTML: có 2 select + tất cả tỉnh, ward trống & bị disabled khi chưa chọn tỉnh", () => {
  const html = renderAddressDropdownsHTML({ data: SAMPLE });
  assert.match(html, /data-vn-province/);
  assert.match(html, /data-vn-ward disabled/);
  assert.match(html, /<option value="18">An Giang<\/option>/);
  assert.match(html, /<option value="01">Hà Nội<\/option>/);
  assert.doesNotMatch(html, /Rạch Giá/); // chưa chọn tỉnh -> chưa có ward
});

test("renderHTML: initialProvinceCode -> nạp sẵn ward của tỉnh đó, không disabled", () => {
  const html = renderAddressDropdownsHTML({
    data: SAMPLE,
    initialProvinceCode: "18",
    initialWardCode: "00030",
  });
  assert.doesNotMatch(html, /data-vn-ward disabled/);
  assert.match(html, /<option value="18" selected>An Giang<\/option>/);
  assert.match(html, /<option value="00030" selected>Long Xuyên<\/option>/);
  assert.match(html, /Rạch Giá/);
  assert.doesNotMatch(html, /Hoàn Kiếm/);
});

test("renderHTML: useFullName + provinceName attr", () => {
  const html = renderAddressDropdownsHTML({
    data: SAMPLE,
    useFullName: true,
    provinceName: "province_code",
    initialProvinceCode: "01",
  });
  assert.match(html, /name="province_code"/);
  assert.match(html, /Thành phố Hà Nội/);
});
