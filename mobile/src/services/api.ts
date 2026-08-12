const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_BASE_URL ?? "ws://localhost:8000";

export interface ClaimResponse {
  device_id: string;
  device_token: string;
  ws_device_url: string;
}

export async function claimPairingCode(code: string): Promise<ClaimResponse> {
  const res = await fetch(`${API_BASE_URL}/api/devices/pair/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, name: "Android device", platform: "android" }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? "Failed to claim pairing code");
  }
  return res.json();
}
