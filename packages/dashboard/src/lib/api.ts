const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "/api";
const AUTH_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_AUTH_URL) ||
  (API_BASE.endsWith("/api") ? `${API_BASE.slice(0, -4)}/auth` : "/auth");

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function url(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function request(base: string, path: string, options?: RequestInit) {
  const res = await fetch(url(base, path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null
        ? String(
            (data as { message?: unknown; error?: unknown }).message ??
              (data as { error?: unknown }).error ??
              `Request failed: ${res.status}`,
          )
        : String(data || `Request failed: ${res.status}`);
    throw new ApiError(message, res.status, data);
  }
  return data;
}

export const api = {
  get: (path: string) => request(API_BASE, path),
  post: (path: string, body?: unknown) =>
    request(API_BASE, path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body?: unknown) =>
    request(API_BASE, path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => request(API_BASE, path, { method: "DELETE" }),
};

export const authApi = {
  get: (path: string) => request(AUTH_BASE, path),
  post: (path: string, body?: unknown) =>
    request(AUTH_BASE, path, { method: "POST", body: JSON.stringify(body) }),
};

export function authUrl(path: string) {
  return url(AUTH_BASE, path);
}
