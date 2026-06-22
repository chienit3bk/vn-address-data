/**
 * 2 dropdown phụ thuộc (Tỉnh -> Phường/Xã), vanilla TS, không phụ thuộc thư viện.
 *
 * Có 2 cách dùng:
 *  1) Sinh chuỗi HTML để chèn vào nơi khác:
 *        el.innerHTML = renderAddressDropdownsHTML({ data });
 *        mountAddressDropdowns(el, { data });          // gắn sự kiện
 *  2) Tạo + gắn 1 phát vào 1 container:
 *        const h = createAddressDropdowns("#addr", { data, onChange });
 *
 * `data` chỉ cần: provinces[{code,name}] và wards[{code,name,provinceCode}] —
 * khớp trực tiếp với `data/provinces.json` + `data/wards.json`.
 */

export interface DdProvince {
  code: string;
  name: string;
  fullName?: string;
}

export interface DdWard {
  code: string;
  name: string;
  provinceCode: string;
  fullName?: string;
  type?: string;
}

export interface AddressData {
  provinces: DdProvince[];
  wards: DdWard[];
}

export interface AddressSelection {
  province: DdProvince | null;
  ward: DdWard | null;
}

export interface AddressDropdownOptions {
  data: AddressData;
  /** Tiền tố id cho 2 thẻ select (mặc định "vn-addr"). */
  idPrefix?: string;
  /** Hiện fullName thay vì name. */
  useFullName?: boolean;
  provinceLabel?: string;
  wardLabel?: string;
  provincePlaceholder?: string;
  wardPlaceholder?: string;
  /** Thuộc tính name cho form (vd khi submit). */
  provinceName?: string;
  wardName?: string;
  initialProvinceCode?: string;
  initialWardCode?: string;
  onChange?: (selection: AddressSelection) => void;
}

export interface AddressDropdownHandle {
  root: HTMLElement;
  provinceSelect: HTMLSelectElement;
  wardSelect: HTMLSelectElement;
  getSelection(): AddressSelection;
  setProvince(code: string): void;
  destroy(): void;
}

const DEFAULTS = {
  idPrefix: "vn-addr",
  provinceLabel: "Tỉnh/Thành phố",
  wardLabel: "Phường/Xã",
  provincePlaceholder: "-- Chọn Tỉnh/Thành phố --",
  wardPlaceholder: "-- Chọn Phường/Xã --",
};

/* --------------------------- Hàm thuần (test được) --------------------------- */

/** Escape ký tự HTML để chống XSS khi nhúng vào markup. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    c === "&"
      ? "&amp;"
      : c === "<"
        ? "&lt;"
        : c === ">"
          ? "&gt;"
          : c === '"'
            ? "&quot;"
            : "&#39;",
  );
}

/** Gom danh sách xã/phường theo mã tỉnh. */
export function indexWardsByProvince(wards: DdWard[]): Map<string, DdWard[]> {
  const map = new Map<string, DdWard[]>();
  for (const w of wards) {
    const arr = map.get(w.provinceCode);
    if (arr) arr.push(w);
    else map.set(w.provinceCode, [w]);
  }
  return map;
}

function optionHtml(value: string, label: string, selected: boolean): string {
  return `<option value="${escapeHtml(value)}"${selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function labelOf(item: { name: string; fullName?: string }, useFullName: boolean): string {
  return useFullName && item.fullName ? item.fullName : item.name;
}

function sortByName<T extends { name: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

/** Sinh chuỗi HTML cho 2 dropdown, có thể chèn thẳng vào container bất kỳ. */
export function renderAddressDropdownsHTML(options: AddressDropdownOptions): string {
  const o = { ...DEFAULTS, ...options };
  const useFull = options.useFullName ?? false;

  const provinceOptions = [
    optionHtml("", o.provincePlaceholder, !options.initialProvinceCode),
    ...sortByName(options.data.provinces).map((p) =>
      optionHtml(p.code, labelOf(p, useFull), p.code === options.initialProvinceCode),
    ),
  ].join("");

  const initWards = options.initialProvinceCode
    ? (indexWardsByProvince(options.data.wards).get(options.initialProvinceCode) ?? [])
    : [];
  const wardOptions = [
    optionHtml("", o.wardPlaceholder, !options.initialWardCode),
    ...sortByName(initWards).map((w) =>
      optionHtml(w.code, labelOf(w, useFull), w.code === options.initialWardCode),
    ),
  ].join("");

  const provNameAttr = options.provinceName ? ` name="${escapeHtml(options.provinceName)}"` : "";
  const wardNameAttr = options.wardName ? ` name="${escapeHtml(options.wardName)}"` : "";
  const wardDisabled = initWards.length === 0 ? " disabled" : "";

  return [
    `<div class="vn-address" data-vn-address>`,
    `  <div class="vn-address__field">`,
    `    <label for="${o.idPrefix}-province">${escapeHtml(o.provinceLabel)}</label>`,
    `    <select id="${o.idPrefix}-province"${provNameAttr} data-vn-province>${provinceOptions}</select>`,
    `  </div>`,
    `  <div class="vn-address__field">`,
    `    <label for="${o.idPrefix}-ward">${escapeHtml(o.wardLabel)}</label>`,
    `    <select id="${o.idPrefix}-ward"${wardNameAttr} data-vn-ward${wardDisabled}>${wardOptions}</select>`,
    `  </div>`,
    `</div>`,
  ].join("\n");
}

/* ----------------------------- Phần cần DOM ----------------------------- */

/** Gắn hành vi (đổi tỉnh -> nạp lại phường/xã) cho markup đã render trong `root`. */
export function mountAddressDropdowns(
  root: HTMLElement,
  options: AddressDropdownOptions,
): AddressDropdownHandle {
  const provinceSelect = root.querySelector<HTMLSelectElement>("[data-vn-province]");
  const wardSelect = root.querySelector<HTMLSelectElement>("[data-vn-ward]");
  if (!provinceSelect || !wardSelect) {
    throw new Error("Không tìm thấy select tỉnh/phường trong root. Render HTML trước khi mount.");
  }

  const useFull = options.useFullName ?? false;
  const wardPlaceholder = options.wardPlaceholder ?? DEFAULTS.wardPlaceholder;
  const wardIndex = indexWardsByProvince(options.data.wards);
  const provinceMap = new Map(options.data.provinces.map((p) => [p.code, p]));

  function fillWards(provinceCode: string, selectedWard = ""): void {
    const list = sortByName(wardIndex.get(provinceCode) ?? []);
    wardSelect!.innerHTML = [
      optionHtml("", wardPlaceholder, !selectedWard),
      ...list.map((w) => optionHtml(w.code, labelOf(w, useFull), w.code === selectedWard)),
    ].join("");
    wardSelect!.disabled = list.length === 0;
  }

  function currentWard(): DdWard | null {
    const code = wardSelect!.value;
    if (!code) return null;
    return (wardIndex.get(provinceSelect!.value) ?? []).find((w) => w.code === code) ?? null;
  }

  function selection(): AddressSelection {
    return { province: provinceMap.get(provinceSelect!.value) ?? null, ward: currentWard() };
  }

  const onProvince = (): void => {
    fillWards(provinceSelect.value);
    options.onChange?.(selection());
  };
  const onWard = (): void => options.onChange?.(selection());

  provinceSelect.addEventListener("change", onProvince);
  wardSelect.addEventListener("change", onWard);

  return {
    root,
    provinceSelect,
    wardSelect,
    getSelection: selection,
    setProvince(code: string) {
      provinceSelect.value = code;
      fillWards(code);
      options.onChange?.(selection());
    },
    destroy() {
      provinceSelect.removeEventListener("change", onProvince);
      wardSelect.removeEventListener("change", onWard);
    },
  };
}

/** Render + mount vào 1 container (selector hoặc element) trong 1 lần gọi. */
export function createAddressDropdowns(
  target: HTMLElement | string,
  options: AddressDropdownOptions,
): AddressDropdownHandle {
  const root =
    typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!root) throw new Error(`Không tìm thấy container: ${String(target)}`);
  root.innerHTML = renderAddressDropdownsHTML(options);
  return mountAddressDropdowns(root, options);
}
