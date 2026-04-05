const API_ORIGIN =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5001" : "");

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `Request failed (${response.status})`);
  }

  return response.json();
}

export const api = {
  // ── Deals ─────────────────────────────────────────────
  deals: {
    getAll: ()            => request("/api/deals"),
    getOne: (id)          => request(`/api/deals/${id}`),
    create: (payload)     => request("/api/deals", { method: "POST", body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/deals/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (id)          => request(`/api/deals/${id}`, { method: "DELETE" }),
    markFollowUp: (id)    => request(`/api/deals/${id}/followup`, { method: "PUT" }),
    addNote: (id, text)   => request(`/api/deals/${id}/notes`, { method: "POST", body: JSON.stringify({ text }) }),
  },

  // ── Income ────────────────────────────────────────────
  income: {
    getAll: ()        => request("/api/income"),
    create: (payload) => request("/api/income", { method: "POST", body: JSON.stringify(payload) }),
    delete: (id)      => request(`/api/income/${id}`, { method: "DELETE" }),
  },

  // ── Invoices ──────────────────────────────────────────
  invoices: {
    getAll: ()            => request("/api/invoices"),
    getOne: (id)          => request(`/api/invoices/${id}`),
    create: (payload)     => request("/api/invoices", { method: "POST", body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/invoices/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  },

  // ── Dashboard ─────────────────────────────────────────
  dashboard: {
    getStats: () => request("/api/dashboard/stats"),
  },

  // ── AI ────────────────────────────────────────────────
  ai: {
    scanContract:    (payload) => request("/api/ai/scan-contract",    { method: "POST", body: JSON.stringify(payload) }),
    benchmarkRate:   (payload) => request("/api/ai/benchmark-rate",   { method: "POST", body: JSON.stringify(payload) }),
    researchBrand:   (payload) => request("/api/ai/research-brand",   { method: "POST", body: JSON.stringify(payload) }),
    rewriteReminder: (payload) => request("/api/ai/rewrite-reminder", { method: "POST", body: JSON.stringify(payload) }),
    forecastCash:    (payload) => request("/api/ai/forecast-cash",    { method: "POST", body: JSON.stringify(payload) }),
  },

  // ── Legacy shims (keep old code working) ──────────────
  getDeals:      () => request("/api/deals"),
  createDeal:    (p) => request("/api/deals", { method: "POST", body: JSON.stringify(p) }),
  updateDeal:    (id, p) => request(`/api/deals/${id}`, { method: "PUT", body: JSON.stringify(p) }),
  getIncome:     () => request("/api/income"),
  createIncome:  (p) => request("/api/income", { method: "POST", body: JSON.stringify(p) }),
  createInvoice: (p) => request("/api/invoices", { method: "POST", body: JSON.stringify(p) }),
  getInvoice:    (id) => request(`/api/invoices/${id}`),
  updateInvoice: (id, p) => request(`/api/invoices/${id}`, { method: "PUT", body: JSON.stringify(p) }),
};
