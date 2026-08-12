export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000";

const TOKEN_KEY = "mp_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Device {
  id: string;
  name: string;
  platform: string;
  status: "online" | "offline";
  last_seen_at: string | null;
}

export interface PairingStart {
  code: string;
  expires_at: string;
  ws_claim_url: string;
}

export const api = {
  register: (email: string, password: string) =>
    request<TokenResponse>("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<TokenResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  listDevices: () => request<Device[]>("/api/devices"),
  getDevice: (id: string) => request<Device>(`/api/devices/${id}`),
  pairStart: () => request<PairingStart>("/api/devices/pair/start", { method: "POST" }),
  pairStatus: (code: string) => request<Device | null>(`/api/devices/pair/status/${code}`),
};
