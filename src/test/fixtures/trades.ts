import type { StatsTrade } from "@/lib/stats";

// 10 trades in June 2026 (UTC times), plus clusters on same days.
// pnls: +100, -50, +200, -50, -50, +300, -100, +50, +50, -25  => total +425
export const FIXTURE: StatsTrade[] = [
  { pnl: 100, entry_time: "2026-06-01T14:00:00Z", exit_time: "2026-06-01T15:00:00Z" },
  { pnl: -50, entry_time: "2026-06-01T16:00:00Z", exit_time: "2026-06-01T17:00:00Z" },
  { pnl: 200, entry_time: "2026-06-02T14:00:00Z", exit_time: "2026-06-02T14:30:00Z" },
  { pnl: -50, entry_time: "2026-06-03T14:00:00Z", exit_time: "2026-06-03T15:00:00Z" },
  { pnl: -50, entry_time: "2026-06-04T14:00:00Z", exit_time: "2026-06-04T15:00:00Z" },
  { pnl: 300, entry_time: "2026-06-05T14:00:00Z", exit_time: "2026-06-05T15:00:00Z" },
  { pnl: -100, entry_time: "2026-06-08T14:00:00Z", exit_time: "2026-06-08T15:00:00Z" },
  { pnl: 50, entry_time: "2026-06-09T14:00:00Z", exit_time: "2026-06-09T15:00:00Z" },
  { pnl: 50, entry_time: "2026-06-10T14:00:00Z", exit_time: "2026-06-10T15:00:00Z" },
  { pnl: -25, entry_time: "2026-06-11T14:00:00Z", exit_time: "2026-06-11T15:00:00Z" },
];
