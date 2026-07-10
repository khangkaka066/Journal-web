import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeStats, equityCurve, dailyPnl } from "@/lib/stats";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: trades }, { data: profile }] = await Promise.all([
    supabase
      .from("trades")
      .select("pnl, entry_time, exit_time")
      .order("entry_time", { ascending: true }),
    supabase.from("profiles").select("timezone").eq("id", user!.id).single(),
  ]);

  const tz = profile?.timezone ?? "UTC";
  const all = trades ?? [];
  const stats = computeStats(all, tz);
  const curve = equityCurve(all, tz);
  const daily = dailyPnl(all, tz);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      {all.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No trades yet —{" "}
          <Link href="/trades/new" className="underline">
            log your first trade
          </Link>{" "}
          to see your stats.
        </div>
      )}

      <StatTiles stats={stats} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Equity curve</CardTitle>
          </CardHeader>
          <CardContent>
            <EquityCurve data={curve} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Daily PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarHeatmap daily={daily} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
