import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  computeStats,
  equityCurve,
  dailyPnl,
  learningInsights,
  ruleBreakInsights,
  stopDoingInsights,
  type StatsTrade,
} from "@/lib/stats";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { LearningInsightsPanel } from "@/components/dashboard/learning-insights";
import { MarketDepthScene } from "@/components/dashboard/market-depth-scene";
import {
  DashboardFiltersPanel,
  type DashboardFilters,
} from "@/components/dashboard/dashboard-filters";
import { normalizeTag, normalizeTags } from "@/lib/tags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function asText(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function cleanOptions(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))]
    .sort((a, b) => a.localeCompare(b));
}

function tagOptions(trades: StatsTrade[], key: "mistake_tags" | "rule_breaks"): string[] {
  return normalizeTags(trades.flatMap((trade) => trade[key] ?? []));
}

function filterTrades(trades: StatsTrade[], filters: DashboardFilters): StatsTrade[] {
  const fromTime = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null;
  const toTime = filters.to ? new Date(`${filters.to}T23:59:59`).getTime() : null;

  return trades.filter((trade) => {
    const tradeTime = new Date(trade.exit_time ?? trade.entry_time).getTime();
    if (fromTime != null && tradeTime < fromTime) return false;
    if (toTime != null && tradeTime > toTime) return false;
    if (filters.instrument && trade.instrument_id !== filters.instrument) return false;
    if (filters.session && trade.session !== filters.session) return false;
    if (filters.setup && trade.setup !== filters.setup) return false;
    if (filters.strategy && trade.strategy !== filters.strategy) return false;
    if (filters.mistake && !normalizeTags(trade.mistake_tags ?? []).includes(normalizeTag(filters.mistake) ?? "")) return false;
    if (filters.rule && !normalizeTags(trade.rule_breaks ?? []).includes(normalizeTag(filters.rule) ?? "")) return false;
    return true;
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: DashboardFilters = {
    from: asText(params.from),
    to: asText(params.to),
    instrument: asText(params.instrument),
    session: asText(params.session),
    setup: asText(params.setup),
    strategy: asText(params.strategy),
    mistake: asText(params.mistake),
    rule: asText(params.rule),
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: trades }, { data: profile }, { data: instruments }] = await Promise.all([
    supabase
      .from("trades")
      .select("pnl, entry_time, exit_time, instrument_id, session, setup, strategy, mistakes, mistake_tags, rule_breaks, screenshot_urls")
      .order("entry_time", { ascending: true }),
    supabase.from("profiles").select("timezone").eq("id", user!.id).single(),
    supabase.from("instruments").select("*").order("symbol"),
  ]);

  const tz = profile?.timezone ?? "UTC";
  const all = trades ?? [];
  const filtered = filterTrades(all, filters);
  const stats = computeStats(filtered, tz);
  const curve = equityCurve(filtered, tz);
  const daily = dailyPnl(filtered, tz);
  const insights = learningInsights(filtered);
  const ruleBreaks = ruleBreakInsights(filtered);
  const stopDoing = stopDoingInsights(filtered);
  const setups = cleanOptions(all.map((trade) => trade.setup));
  const strategies = cleanOptions(all.map((trade) => trade.strategy));
  const mistakes = tagOptions(all, "mistake_tags");
  const rules = tagOptions(all, "rule_breaks");

  return (
    <div className="space-y-6">
      <div className="relative min-h-[18rem] overflow-hidden rounded-xl border bg-card/75 p-5 shadow-sm sm:min-h-[20rem] sm:p-6">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-3/5 opacity-95 lg:block">
          <MarketDepthScene />
        </div>
        <div className="relative z-10 flex max-w-2xl flex-col justify-between gap-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            {filtered.length}/{all.length} visible trade{all.length === 1 ? "" : "s"}
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
      </div>

      {all.length === 0 && (
        <div className="rounded-xl border border-dashed bg-card/60 p-8 text-center text-muted-foreground">
          No trades yet.{" "}
          <Link href="/trades/new" className="underline">
            log your first trade
          </Link>{" "}
          to see your stats.
        </div>
      )}

      <DashboardFiltersPanel
        filters={filters}
        instruments={instruments ?? []}
        setups={setups}
        strategies={strategies}
        mistakes={mistakes}
        rules={rules}
      />

      <StatTiles stats={stats} />

      <LearningInsightsPanel insights={insights} ruleBreaks={ruleBreaks} stopDoing={stopDoing} />

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
