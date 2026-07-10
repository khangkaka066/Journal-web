import { AlertTriangle, Brain, ShieldAlert, Target } from "lucide-react";
import type { LearningInsights, RuleBreakInsight, StopDoingInsight } from "@/lib/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function money(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function pct(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

function pnlClass(value: number) {
  if (value === 0) return "text-muted-foreground";
  return value > 0 ? "text-emerald-400" : "text-red-400";
}

function EmptyRow({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{text}</div>;
}

export function LearningInsightsPanel({
  insights,
  ruleBreaks = [],
  stopDoing = [],
}: {
  insights: LearningInsights;
  ruleBreaks?: RuleBreakInsight[];
  stopDoing?: StopDoingInsight[];
}) {
  const topSetup = insights.setupPerformance[0];
  const topStrategy = insights.strategyPerformance[0];
  const topMistake = insights.mistakeInsights[0];
  const topRuleBreak = ruleBreaks[0];
  const topStop = stopDoing[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        <Card className="bg-card/75">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="size-4 text-primary" />
              Best setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSetup ? (
              <div>
                <div className="font-semibold">{topSetup.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {pct(topSetup.winRate)} winrate · {topSetup.trades} trades
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Add setup names to trades.</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/75">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="size-4 text-primary" />
              Most winning strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topStrategy ? (
              <div>
                <div className="font-semibold">{topStrategy.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {topStrategy.wins} wins · {pct(topStrategy.winRate)} winrate
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Add strategy names to trades.</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/75">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 text-primary" />
              Most repeated mistake
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topMistake ? (
              <div>
                <div className="font-semibold">{topMistake.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {topMistake.count} times · {topMistake.lossCount} losses
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Split mistakes with commas or new lines.</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/75">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldAlert className="size-4 text-primary" />
              Costliest rule break
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topRuleBreak ? (
              <div>
                <div className="font-semibold">{topRuleBreak.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {topRuleBreak.count} times · {money(topRuleBreak.totalPnl)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Mark broken rules in trades.</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/75">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 text-destructive" />
              Stop doing first
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topStop ? (
              <div>
                <div className="font-semibold">{topStop.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {topStop.source} · {money(topStop.totalPnl)} total
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Tag mistakes and rule breaks.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <InsightList
          title="Setup winrate"
          empty="No setup data yet."
          rows={insights.setupPerformance.slice(0, 5).map((item) => ({
            name: item.name,
            meta: `${pct(item.winRate)} · ${item.trades} trades · ${item.wins}W/${item.losses}L`,
            value: money(item.totalPnl),
            valueClassName: pnlClass(item.totalPnl),
          }))}
        />
        <InsightList
          title="Strategy wins"
          empty="No strategy data yet."
          rows={insights.strategyPerformance.slice(0, 5).map((item) => ({
            name: item.name,
            meta: `${item.wins} wins · ${pct(item.winRate)} · ${item.trades} trades`,
            value: money(item.totalPnl),
            valueClassName: pnlClass(item.totalPnl),
          }))}
        />
        <InsightList
          title="Mistake patterns"
          empty="No mistake patterns yet."
          rows={insights.mistakeInsights.slice(0, 5).map((item) => ({
            name: item.name,
            meta: `${item.count} times · ${item.lossCount} losses · avg ${money(item.avgPnl)}`,
            value: money(item.totalPnl),
            valueClassName: pnlClass(item.totalPnl),
          }))}
        />
        <InsightList
          title="Rule breaker cost"
          empty="No rule breaks tagged yet."
          rows={ruleBreaks.slice(0, 5).map((item) => ({
            name: item.name,
            meta: `${item.count} times · ${item.lossCount} losses · ${pct(item.winRate)} winrate`,
            value: money(item.totalPnl),
            valueClassName: pnlClass(item.totalPnl),
          }))}
        />
      </div>
      <InsightList
        title="What to stop doing"
        empty="No negative behavior patterns yet."
        rows={stopDoing.slice(0, 6).map((item) => ({
          name: item.name,
          meta: `${item.source} · ${item.count} times · ${item.lossCount} losses · ${pct(item.winRate)} winrate`,
          value: money(item.totalPnl),
          valueClassName: pnlClass(item.totalPnl),
        }))}
      />
    </div>
  );
}

function InsightList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { name: string; meta: string; value: string; valueClassName: string }[];
}) {
  return (
    <Card className="bg-card/75">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <EmptyRow text={empty} />
        ) : (
          rows.map((row) => (
            <div key={row.name} className="rounded-lg border bg-background/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{row.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{row.meta}</div>
                </div>
                <div className={`shrink-0 text-sm font-semibold tabular-nums ${row.valueClassName}`}>
                  {row.value}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
