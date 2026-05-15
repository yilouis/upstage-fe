const BILLING_KEY = "term_tracker_billing";

const OTT_SEED_VENDORS = ["netflix", "spotify"];
const OTT_SEED_NAMES = ["넷플릭스", "netflix", "스포티파이", "spotify"];

const pad = (n) => String(n).padStart(2, "0");
const toIsoDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const clampDay = (year, month, day) =>
  Math.min(day, daysInMonth(year, month));

export function loadBilling() {
  try {
    const raw = localStorage.getItem(BILLING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveBilling(data) {
  try {
    localStorage.setItem(BILLING_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to persist billing data", e);
  }
}

const isOttSeedTarget = (service) => {
  const slug = (service.vendor_slug || "").toLowerCase();
  if (OTT_SEED_VENDORS.includes(slug)) return true;
  const name = (service.name || "").toLowerCase().trim();
  return OTT_SEED_NAMES.includes(name);
};

// Seed defaults for subscribed OTT services that don't yet have a record.
// subscribedAt = today - 2 months, billingDay = day-of-month from subscribedAt.
export function seedDefaultsForServices(services, existing) {
  const next = { ...existing };
  let changed = false;

  const today = new Date();
  const seedDate = new Date(
    today.getFullYear(),
    today.getMonth() - 2,
    today.getDate(),
  );

  services.forEach((service) => {
    if (!service?.id) return;
    if (next[service.id]) return;
    if (!isOttSeedTarget(service)) return;

    next[service.id] = {
      subscribedAt: toIsoDate(seedDate),
      billingDay: seedDate.getDate(),
    };
    changed = true;
  });

  return { data: next, changed };
}

// Update one service's billing record. Pass partial fields.
export function updateBillingRecord(billing, serviceId, patch) {
  const prev = billing[serviceId] || {};
  const next = { ...billing, [serviceId]: { ...prev, ...patch } };
  return next;
}

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Derive mock events for a service across a month window.
// - 구독 시작: single event on subscribedAt
// - Recurring billing: one event per month in the window at billingDay
//   (clamped to the month length). Kind is "prev" if the date is before
//   today, otherwise "next".
// Events whose billing date falls before subscribedAt are skipped.
function deriveServiceEvents(service, record, today, monthsBefore, monthsAfter) {
  if (!record) return [];
  const events = [];

  if (record.subscribedAt) {
    events.push({
      id: `mock-${service.id}-start`,
      term_id: service.id,
      event_date: record.subscribedAt,
      event_type: "구독 시작",
      label: `${service.name} 구독 시작`,
      source: "mock",
      kind: "start",
    });
  }

  if (!record.billingDay) return events;

  const day = Number(record.billingDay);
  const todayMid = startOfDay(today);
  const subscribedDate = record.subscribedAt
    ? startOfDay(new Date(record.subscribedAt))
    : null;

  for (let offset = -monthsBefore; offset <= monthsAfter; offset++) {
    const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const clamped = clampDay(year, month, day);
    const billingDate = new Date(year, month, clamped);

    if (subscribedDate && billingDate < subscribedDate) continue;

    const isPast = billingDate < todayMid;
    events.push({
      id: `mock-${service.id}-bill-${year}-${pad(month + 1)}`,
      term_id: service.id,
      event_date: toIsoDate(billingDate),
      event_type: isPast ? "지난 결제" : "다음 결제",
      label: `${service.name} ${isPast ? "지난 결제" : "다음 결제"}`,
      source: "mock",
      kind: isPast ? "prev" : "next",
    });
  }

  return events;
}

export function deriveMockEvents(
  services,
  billing,
  today = new Date(),
  { monthsBefore = 2, monthsAfter = 6 } = {},
) {
  const out = [];
  services.forEach((service) => {
    const record = billing[service.id];
    if (!record) return;
    out.push(
      ...deriveServiceEvents(service, record, today, monthsBefore, monthsAfter),
    );
  });
  return out;
}

export const EVENT_KIND_STYLES = {
  start: { dot: "bg-gray-400", badge: "bg-gray-50 text-gray-600 border-gray-200" },
  prev: { dot: "bg-blue-300", badge: "bg-blue-50 text-blue-500 border-blue-100" },
  next: { dot: "bg-blue-600", badge: "bg-blue-100 text-blue-700 border-blue-200" },
};
