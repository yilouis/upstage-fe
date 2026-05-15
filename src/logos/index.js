import bankSalad from "./bank-salad.png";
import chatgpt from "./chatgpt.jpg";
import claude from "./claude.jpg";
import coupangPlay from "./coupang-play.jpg";
import deepseek from "./deepseek.jpg";
import disneyPlus from "./disney-plus.jpg";
import gemini from "./gemini.png";
import kakaoPay from "./kakao-pay.jpg";
import netflix from "./netflix.jpg";
import spotify from "./spotify.jpg";
import toss from "./toss.png";
import tving from "./tving.jpg";
import upstage from "./upstage.jpg";
import watcha from "./watcha.png";

export const SERVICE_LOGOS = {
  "bank-salad": bankSalad,
  chatgpt,
  claude,
  "coupang-play": coupangPlay,
  deepseek,
  "disney-plus": disneyPlus,
  gemini,
  "kakao-pay": kakaoPay,
  netflix,
  spotify,
  toss,
  tving,
  upstage,
  watcha,
};

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
};

const normalize = (raw) =>
  String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

export function getServiceLogo(service) {
  if (!service) return null;

  // Prefer backend-provided slug when available
  const slug = service.service_slug || service.slug;
  if (slug && SERVICE_LOGOS[slug]) return SERVICE_LOGOS[slug];

  // Fall back to name-based lookup (for legacy data)
  const name = service.name || service.service_name || "";
  const lower = name.toLowerCase().trim();
  if (NAME_ALIASES[lower]) return SERVICE_LOGOS[NAME_ALIASES[lower]];

  const normalized = normalize(name);
  if (SERVICE_LOGOS[normalized]) return SERVICE_LOGOS[normalized];

  return null;
}
