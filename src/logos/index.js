// Logo files are auto-discovered from this folder. To add a new service
// logo, drop an image named after its vendor slug (e.g. "youtube.png" or
// "twitch.png") into src/logos/ — no code change needed here.
const logoModules = import.meta.glob("./*.{png,jpg,jpeg,svg,webp}", {
  eager: true,
  import: "default",
});

export const SERVICE_LOGOS = Object.fromEntries(
  Object.entries(logoModules).map(([path, url]) => {
    const slug = path.replace(/^\.\//, "").replace(/\.[^.]+$/, "");
    return [slug, url];
  }),
);

const NAME_ALIASES = {
  // Korean / common variants → canonical slug
  "넷플릭스": "netflix",
  "디즈니+": "disney-plus",
  "디즈니플러스": "disney-plus",
  "disney+": "disney-plus",
  "disneyplus": "disney-plus",
  "쿠팡플레이": "coupang-play",
  "쿠팡 플레이": "coupang-play",
  "coupangplay": "coupang-play",
  "카카오페이": "kakao-pay",
  "kakaopay": "kakao-pay",
  "토스": "toss",
  "티빙": "tving",
  "왓챠": "watcha",
  "스포티파이": "spotify",
  "챗gpt": "chatgpt",
  "chat gpt": "chatgpt",
  "클로드": "claude",
  "딥시크": "deepseek",
  "업스테이지": "upstage",
  "뱅크샐러드": "bank-salad",
  "banksalad": "bank-salad",
  "제미나이": "gemini",
  "제미니": "gemini",
  "웨이브": "wavve",
  "wavve": "wavve",
  "유튜브": "youtube",
  "유튜브 프리미엄": "youtube",
  "유튜브프리미엄": "youtube",
  "youtube premium": "youtube",
  "트위치": "twitch",
};

const normalize = (raw) =>
  String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

export function getServiceLogo(service) {
  if (!service) return null;

  // Prefer backend-provided vendor_slug when available
  const slug = service.vendor_slug || service.service_slug || service.slug;
  if (slug && SERVICE_LOGOS[slug]) return SERVICE_LOGOS[slug];

  // Fall back to name-based lookup (for legacy data)
  const name = service.name || service.service_name || "";
  const lower = name.toLowerCase().trim();
  if (NAME_ALIASES[lower]) return SERVICE_LOGOS[NAME_ALIASES[lower]];

  const normalized = normalize(name);
  if (SERVICE_LOGOS[normalized]) return SERVICE_LOGOS[normalized];

  return null;
}
