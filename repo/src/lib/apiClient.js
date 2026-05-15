const API_BASE_URL = "https://upstageaidemo-production.up.railway.app";

export const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("API Request Error:", error);
      return { success: false, error: error.message };
    }
  },

  async get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  },

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  },

  async askQuestion(question, serviceInfo) {
    return this.post("/api/ask", {
      question,
      serviceInfo,
      timestamp: new Date().toISOString(),
    });
  },

  async analyzeTerms(termsContent) {
    return this.post("/api/analyze-terms", {
      content: termsContent,
    });
  },

  async trackChange(serviceId, changeData) {
    return this.post(`/api/services/${serviceId}/changes`, changeData);
  },
};

export default apiClient;
