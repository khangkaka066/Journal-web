import type { DashboardStats } from "@/lib/stats";
import { Card, CardContent } from "@/components/ui/card";

function money(v: number | null): string {
  if (v == null) return "N/A";
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

function pct(v: number | null): string {
  return v == null ? "N/A" : `${(v * 100).toFixed(1)}%`;
}

function polarity(v: number | null): string {
  if (v == null || v === 0) return "";
  return v > 0 ? "text-emerald-400" : "text-red-400";
}

export function StatTiles({ stats }: { stats: DashboardStats }) {
  const tiles: { label: string; value: string; className?: string }[] = [
    { label: "Total PnL", value: money(stats.totalPnl), className: polarity(stats.totalPnl) },
    { label: "Win rate", value: pct(stats.winRate) },
    {
      label: "Profit factor",
      value: stats.profitFactor == null ? "N/A" : stats.profitFactor.toFixed(2),
    },
    { label: "Expectancy", value: money(stats.expectancy), className: polarity(stats.expectancy) },
    { label: "Avg winner", value: money(stats.avgWin) },
    { label: "Avg loser", value: money(stats.avgLoss) },
    { label: "Total trades", value: String(stats.totalTrades) },
    { label: "Max drawdown", value: money(-stats.maxDrawdown), className: polarity(-stats.maxDrawdown) },
    { label: "Largest win", value: money(stats.largestWin) },
    { label: "Largest loss", value: money(stats.largestLoss) },
    {
      label: "Streak",
      value: stats.streak ? `${stats.streak.count} ${stats.streak.type}${stats.streak.count > 1 ? "s" : ""}` : "N/A",
      className: stats.streak ? (stats.streak.type === "win" ? "text-emerald-400" : "text-red-400") : "",
    },
    { label: "This week", value: money(stats.weeklyPnl), className: polarity(stats.weeklyPnl) },
    { label: "This month", value: money(stats.monthlyPnl), className: polarity(stats.monthlyPnl) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <Card key={t.label} className="border-border/70 bg-card/75 py-3 shadow-sm">
          <CardContent className="px-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              {t.label}
            </div>
            <div className={`mt-1 text-xl font-semibold tabular-nums ${t.className ?? ""}`}>
              {t.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
