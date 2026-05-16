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
  upstage: "업스테이지",
  youtube: "유튜브",
  twitch: "트위치",
};

// Lowercased brand-name variants → canonical slug. Used as a fallback when
// the backend did not provide a vendor_slug for the term.
const NAME_TO_SLUG = {
  youtube: "youtube",
  "youtube premium": "youtube",
  "유튜브": "youtube",
  "유튜브 프리미엄": "youtube",
  twitch: "twitch",
  "트위치": "twitch",
};

export function getVendorDisplayName(service) {
  if (!service) return "";
  const slug = (service.vendor_slug || "").toLowerCase();
  if (slug && VENDOR_DISPLAY_NAMES[slug]) return VENDOR_DISPLAY_NAMES[slug];

  const rawName = service.name || service.service_name || "";
  const nameSlug = NAME_TO_SLUG[rawName.toLowerCase().trim()];
  if (nameSlug && VENDOR_DISPLAY_NAMES[nameSlug]) {
    return VENDOR_DISPLAY_NAMES[nameSlug];
  }
  return rawName;
}
