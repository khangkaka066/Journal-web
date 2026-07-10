import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  computeStats,
  equityCurve,
  dailyPnl,
  learningInsights,
  ruleBreakInsights,
} from "@/lib/stats";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { LearningInsightsPanel } from "@/components/dashboard/learning-insights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: trades }, { data: profile }] = await Promise.all([
    supabase
      .from("trades")
      .select("pnl, entry_time, exit_time, setup, strategy, mistakes, mistake_tags, rule_breaks, screenshot_urls")
      .order("entry_time", { ascending: true }),
    supabase.from("profiles").select("timezone").eq("id", user!.id).single(),
  ]);

  const tz = profile?.timezone ?? "UTC";
  const all = trades ?? [];
  const stats = computeStats(all, tz);
  const curve = equityCurve(all, tz);
  const daily = dailyPnl(all, tz);
  const insights = learningInsights(all);
  const ruleBreaks = ruleBreakInsights(all);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-xl border bg-card/75 p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            {all.length} recorded trade{all.length === 1 ? "" : "s"}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review performance and drawdown.
            </p>
          </div>
        </div>
        <Button render={<Link href="/trades/new" />}>
          <Plus className="size-4" />
          New trade
        </Button>
      </div>

      {all.length === 0 && (
        <div className="rounded-xl border border-dashed bg-card/60 p-8 text-center text-muted-foreground">
          No trades yet —{" "}
          <Link href="/trades/new" className="underline">
            log your first trade
          </Link>{" "}
          to see your stats.
        </div>
      )}

      <StatTiles stats={stats} />

      <LearningInsightsPanel insights={insights} ruleBreaks={ruleBreaks} />

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
