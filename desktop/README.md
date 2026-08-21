# desktop

An Electron + React + TypeScript app that observes the *local machine's* system metrics
(CPU, memory, disk, load average, uptime, OS info, network interfaces) and shows them live in a
dashboard UI. Standalone boilerplate — it doesn't talk to `backend/`, `frontend/`, or `mobile/`,
and doesn't share a pnpm workspace with them (own `package.json` + lockfile, same convention as
`frontend/`/`mobile/`).

```
desktop/
  electron.vite.config.ts    main/preload/renderer build config (electron-vite)
  electron-builder.yml         Linux packaging (AppImage)
  src/
    shared/
      ipc-channels.ts           IPC channel name constants (single source of truth)
      types/                     SystemMetrics + per-domain types, MetricsApi contract
    main/
      index.ts                   app lifecycle: create window, register IPC, dispose on close
      window.ts                   BrowserWindow creation (contextIsolation/sandbox flags)
      metrics/
        collector.interface.ts     MetricCollector<T> — one method, collect(): Promise<T>
        cpu.collector.ts            os.cpus(), delta-sampled across poll ticks
        memory.collector.ts          /proc/meminfo on Linux, os.totalmem/freemem elsewhere
        disk.collector.ts             fs.promises.statfs('/')
        load-average.collector.ts      os.loadavg()
        uptime.collector.ts             os.uptime() + process.uptime()
        os-info.collector.ts             hostname/platform/arch/release, process.versions
        network.collector.ts              os.networkInterfaces()
        system-metrics.service.ts          collectAll() — runs every collector concurrently
        metrics-poller.ts                   generic start/stop/subscribe scheduler
        collectors.factory.ts                composition root: the one place all 7 classes are named
      ipc/
        metrics.ipc.ts                        wires the poller to ipcMain/webContents
    preload/
      index.ts                                 contextBridge-exposed, typed window.metricsApi
    renderer/
      index.html
      src/
        App.tsx, main.tsx
        hooks/useSystemMetrics.ts                fetch-on-mount + subscribe, owns all IPC lifecycle
        components/                               one purely-presentational panel per metric domain
        utils/format.ts                            byte/percent/duration formatting helpers
```

## Running it

```bash
cd desktop
pnpm install
pnpm dev              # electron-vite dev server + hot reload
```

```bash
pnpm typecheck         # tsc --noEmit against tsconfig.node.json and tsconfig.web.json
pnpm lint               # eslint . (flat config)
pnpm build                # production build -> out/{main,preload,renderer}
pnpm build:linux           # build + electron-builder --linux -> release/*.AppImage
```

## Why every metric collector implements the same one-method interface

`MetricCollector<T> { collect(): Promise<T> }` is deliberately the smallest interface that works.
Each of the 7 collectors (`CpuCollector`, `MemoryCollector`, ...) is a standalone class with zero
Electron imports, so it can be unit-tested with plain Node — no Electron runtime, no mocking
`ipcMain`. `SystemMetricsService` takes a *named* map of collectors
(`{ cpu, memory, disk, loadAverage, uptime, osInfo, network }`, each typed as `MetricCollector<T>`)
rather than a loose array, so the assembled `SystemMetrics` snapshot stays exhaustively
type-checked — adding or renaming a metric is a compiler error at the call site, not a runtime
surprise. `metrics.ipc.ts` is the only file in `main/metrics/` that imports `electron` at all; it
builds one `SystemMetricsService` instance (via `collectors.factory.ts`) for the app's lifetime and
reuses it for both the 2-second poll ticks and the one-off `getSnapshot()` request — that's load
bearing, not incidental: `CpuCollector` keeps the previous `os.cpus()` sample as instance state to
compute delta-based usage, so two separate instances would each start their own (wrong) baseline.

## Where each metric actually comes from

No `systeminformation`-style dependency — everything is Node/Electron built-ins or Linux's own
`/proc` pseudo-filesystem, which is what "available in Linux by default" means here.

| Metric | Source | Notes |
| --- | --- | --- |
| CPU usage (per-core + aggregate) | `os.cpus()` | Cumulative since-boot tick counts — usage is a delta between two poll ticks, so the **first** tick after launch reports `null`/`—`, not a misleading `0%`. |
| Memory (total/free/available/buffers/cached/swap) | `/proc/meminfo` (Linux) | `MemAvailable` is what `free -h` calls "available" (accounts for reclaimable cache) — more accurate than `os.freemem()`, which only reports raw free pages. Falls back to `os.totalmem()`/`os.freemem()` on non-Linux. |
| Disk (root filesystem) | `fs.promises.statfs('/')` | Node's `statvfs(2)` wrapper — async, no shell-out. A failed `statfs` call (e.g. unusual mount) returns a zeroed snapshot rather than rejecting the whole `SystemMetrics` payload. |
| Load average | `os.loadavg()` | Linux-native concept; always `[0, 0, 0]` on Windows by Node's own design. |
| Uptime | `os.uptime()`, `process.uptime()` | System uptime and this app's own process uptime, shown separately. |
| OS info | `os.hostname/platform/arch/release/type/userInfo`, `process.versions` | `os.userInfo()` can throw in containers with no matching `/etc/passwd` entry — caught, falls back to `$USER`/`$LOGNAME`. |
| Network interfaces | `os.networkInterfaces()` | Static list (name/address/family/mac) — no throughput/rate. Internal/loopback interfaces are filtered out in the UI. |

## IPC

`preload/index.ts` exposes exactly one thing to the renderer via `contextBridge`:
`window.metricsApi` (`getSnapshot(): Promise<SystemMetrics>` and
`onUpdate(cb): () => void`) — never the raw `ipcRenderer`. The `BrowserWindow` runs with
`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Channel names live once in
`shared/ipc-channels.ts` and the `SystemMetrics`/`MetricsApi` types live once in `shared/types/`,
imported by main, preload, and renderer alike — no magic strings, no duplicated interfaces
drifting out of sync across the three build targets.

## Known boilerplate limitations (by design, not oversights)

- **Single `BrowserWindow` assumption** — `ipcMain.handle` is registered once in `metrics.ipc.ts`
  against one captured window. Multi-window support would mean broadcasting to
  `BrowserWindow.getAllWindows()` instead.
- **No network throughput** — interface *listing* only; adding rx/tx rate would mean parsing
  `/proc/net/dev` and delta-sampling it the same way `CpuCollector` does for CPU time.
- **No packaging icon** — `electron-builder.yml` omits `icon:`; electron-builder falls back to a
  default with a build-time warning. Add `resources/icon.png` and wire it in when a real asset
  exists.
- **Linux-first** — memory/disk collectors have non-Linux fallbacks so the app doesn't crash
  elsewhere, but they're not the point of this app; it's built to show what a Linux box exposes
  by default.
