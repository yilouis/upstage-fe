const DOMAIN_LABELS = {
  FINANCE: "금융",
  OTT: "OTT",
  INSURANCE: "보험",
  APP: "앱",
  AI: "AI",
  MEDICAL: "의료",
  TELECOM: "통신",
  ETC: "기타",
};

export function getDomainLabel(domain) {
  if (!domain) return "미분류";
  return DOMAIN_LABELS[domain] || domain;
}
