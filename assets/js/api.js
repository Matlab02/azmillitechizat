const API_URL = new URL("../../api/index.php", import.meta.url);
let csrfToken = "";

export function setCsrf(token = "") { csrfToken = token; }
export function getCsrf() { return csrfToken; }

export async function api(route, options = {}) {
  const url = new URL(API_URL);
  url.searchParams.set("route", route);
  Object.entries(options.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  const headers = new Headers(options.headers || {});
  const init = { method: options.method || "GET", credentials: "same-origin", headers, signal: options.signal };
  if (options.body instanceof FormData) init.body = options.body;
  else if (options.body !== undefined) { headers.set("Content-Type", "application/json"); init.body = JSON.stringify(options.body); }
  if (init.method !== "GET" && csrfToken) headers.set("X-CSRF-Token", csrfToken);
  const response = await fetch(url, init);
  let payload;
  try { payload = await response.json(); } catch { payload = { message: "Server cavabı oxunmadı." }; }
  if (payload.csrf) setCsrf(payload.csrf);
  if (!response.ok) {
    const error = new Error(payload.message || "Sorğu tamamlanmadı.");
    error.status = response.status;
    error.errors = payload.errors || {};
    throw error;
  }
  return payload;
}

export async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const result = await api("auth.session");
  setCsrf(result.csrf);
  return csrfToken;
}
