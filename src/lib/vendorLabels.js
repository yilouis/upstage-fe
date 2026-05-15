// Optional Korean display-name overrides keyed by canonical vendor slug.
// Backend stores the user-supplied service_name verbatim ("Toss",
// "Netflix" 등); this map lets the UI swap in a preferred Korean
// display name without changing the underlying record.
const VENDOR_DISPLAY_NAMES = {
  toss: "토스",
  "coupang-play": "쿠팡플레이",
  "disney-plus": "디즈니+",
  watcha: "왓챠",
  tving: "티빙",
  wavve: "웨이브",
};

export function getVendorDisplayName(service) {
  if (!service) return "";
  const slug = (service.vendor_slug || "").toLowerCase();
  if (slug && VENDOR_DISPLAY_NAMES[slug]) return VENDOR_DISPLAY_NAMES[slug];
  return service.name || service.service_name || "";
}
