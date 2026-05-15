import { API_BASE_URL } from "../config";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail =
      typeof data === "object" && data?.detail
        ? JSON.stringify(data.detail)
        : String(data || "Request failed");
    throw new Error(detail);
  }
  return data;
}

export const api = {
  healthCheck: () => request("/health"),

  listTerms: ({ domain, status } = {}) => {
    const query = new URLSearchParams();
    if (domain) query.set("domain", domain);
    if (status) query.set("status", status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/terms${suffix}`);
  },

  getTerm: (termId) => request(`/terms/${termId}`),

  uploadTerm: ({ serviceName, subscribedAt, file }) => {
    const formData = new FormData();
    formData.append("service_name", serviceName);
    if (subscribedAt) formData.append("subscribed_at", subscribedAt);
    formData.append("file", file);
    return request("/terms/upload", { method: "POST", body: formData });
  },

  updateTerm: ({ termId, file }) => {
    const formData = new FormData();
    formData.append("file", file);
    return request(`/terms/${termId}/update`, {
      method: "POST",
      body: formData,
    });
  },

  searchTerm: ({ termId, query, topK = 5 }) =>
    request(`/terms/${termId}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: topK }),
    }),

  listCalendarEvents: ({ userId, month }) =>
    request(
      `/calendar?user_id=${encodeURIComponent(userId)}&month=${encodeURIComponent(month)}`,
    ),

  getNotifications: ({ userId, status }) => {
    const query = new URLSearchParams({ user_id: userId });
    if (status) query.set("status", status);
    return request(`/notifications?${query.toString()}`);
  },

  markNotificationRead: ({ notificationId, userId }) =>
    request(
      `/notifications/${notificationId}/read?user_id=${encodeURIComponent(userId)}`,
      { method: "PATCH" },
    ),
};
