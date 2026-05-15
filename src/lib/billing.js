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

// Derive the 3 mock events (구독 시작, 지난 결제, 다음 결제) for one service
// within a window of [today - 60d, today + 60d] so they show up around the
// currently-displayed month.
function deriveServiceEvents(service, record, today) {
  if (!record) return [];
  const events = [];

  // 구독 시작
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

  if (record.billingDay) {
    const day = Number(record.billingDay);
    const year = today.getFullYear();
    const month = today.getMonth();

    const lastDay = clampDay(year, month - 1, day);
    const lastDate = new Date(year, month - 1, lastDay);

    const nextMonthDay = clampDay(year, month + 1, day);
    const thisMonthDay = clampDay(year, month, day);
    const thisMonthDate = new Date(year, month, thisMonthDay);
    const nextDate =
      thisMonthDate >= today
        ? thisMonthDate
        : new Date(year, month + 1, nextMonthDay);

    // 지난 결제 = 다음 결제 직전 한 달치
    const prevDate = new Date(
      nextDate.getFullYear(),
      nextDate.getMonth() - 1,
      clampDay(nextDate.getFullYear(), nextDate.getMonth() - 1, day),
    );

    events.push({
      id: `mock-${service.id}-prev`,
      term_id: service.id,
      event_date: toIsoDate(prevDate),
      event_type: "지난 결제",
      label: `${service.name} 지난 결제`,
      source: "mock",
      kind: "prev",
    });
    events.push({
      id: `mock-${service.id}-next`,
      term_id: service.id,
      event_date: toIsoDate(nextDate),
      event_type: "다음 결제",
      label: `${service.name} 다음 결제`,
      source: "mock",
      kind: "next",
    });

    // Suppress unused var warning while keeping lastDate variable for clarity.
    void lastDate;
  }

  return events;
}

export function deriveMockEvents(services, billing, today = new Date()) {
  const out = [];
  services.forEach((service) => {
    const record = billing[service.id];
    if (!record) return;
    out.push(...deriveServiceEvents(service, record, today));
  });
  return out;
}

export const EVENT_KIND_STYLES = {
  start: { dot: "bg-gray-400", badge: "bg-gray-50 text-gray-600 border-gray-200" },
  prev: { dot: "bg-blue-300", badge: "bg-blue-50 text-blue-500 border-blue-100" },
  next: { dot: "bg-blue-600", badge: "bg-blue-100 text-blue-700 border-blue-200" },
};
