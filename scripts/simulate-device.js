#!/usr/bin/env node
// Stand-in for a physical Android phone: claims a pairing code printed by the
// web dashboard's "Connect Device" screen, then streams fake-but-realistic
// battery/memory/disk/CPU samples over the device WebSocket every 2s - exactly
// like the real Expo app does while it's in the foreground. Useful for
// verifying the device -> Redis -> dashboard WebSocket path without needing
// hardware. Pure Node.js (native fetch + WebSocket, Node 22+) - no deps.
//
// Usage:
//   node scripts/simulate-device.js --code 123456
//   node scripts/simulate-device.js --code 123456 --api-base http://localhost:8000

function parseArgs(argv) {
  const args = { apiBase: "http://localhost:8000", wsBase: "ws://localhost:8000", intervalMs: 2000 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--code") args.code = argv[++i];
    else if (arg === "--api-base") args.apiBase = argv[++i];
    else if (arg === "--ws-base") args.wsBase = argv[++i];
    else if (arg === "--interval") args.intervalMs = Number(argv[++i]) * 1000;
  }
  if (!args.code) {
    console.error("Usage: node simulate-device.js --code <6-digit-pairing-code> [--api-base url] [--ws-base url] [--interval seconds]");
    process.exit(1);
  }
  return args;
}

async function claim(apiBase, code) {
  const res = await fetch(`${apiBase}/api/devices/pair/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, name: "Simulated Android device", platform: "android" }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to claim pairing code ${code}: ${res.status} ${detail}`);
  }
  return res.json();
}

function randomWalk(value, min, max, jitter) {
  const next = value + (Math.random() - 0.5) * jitter;
  return Math.min(max, Math.max(min, next));
}

function stream(wsBase, deviceId, deviceToken, intervalMs) {
  const ws = new WebSocket(`${wsBase}/ws/device/${deviceId}?token=${deviceToken}`);
  let freeDiskMb = 42_000;
  let cpuPercent = 20;
  let timer = null;

  ws.addEventListener("open", () => {
    console.log(`Connected as device ${deviceId}. Streaming every ${intervalMs / 1000}s. Ctrl+C to stop.`);
    timer = setInterval(() => {
      freeDiskMb = randomWalk(freeDiskMb, 5_000, 60_000, 100);
      cpuPercent = randomWalk(cpuPercent, 0, 100, 30);
      const payload = {
        battery_level: Math.round((Math.random() * 0.8 + 0.2) * 100) / 100,
        battery_state: Math.random() > 0.5 ? "unplugged" : "charging",
        total_memory_mb: 8192,
        free_disk_mb: Math.round(freeDiskMb),
        total_disk_mb: 128_000,
        cpu_load_estimate_percent: Math.round(cpuPercent),
        device_model: "Simulated Pixel",
        os_version: "14",
        ts: new Date().toISOString(),
      };
      ws.send(JSON.stringify(payload));
      console.log("sent", payload);
    }, intervalMs);
  });

  ws.addEventListener("close", () => {
    if (timer) clearInterval(timer);
  });

  ws.addEventListener("error", (event) => {
    console.error("WebSocket error:", event.message ?? event);
  });

  process.on("SIGINT", () => {
    if (timer) clearInterval(timer);
    ws.close();
    console.log("\nStopped.");
    process.exit(0);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const claimed = await claim(args.apiBase, args.code);
  stream(args.wsBase, claimed.device_id, claimed.device_token, args.intervalMs);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
