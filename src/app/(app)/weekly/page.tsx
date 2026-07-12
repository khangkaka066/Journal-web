import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, Camera, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  computeStats,
  learningInsights,
  ruleBreakInsights,
  weekTrades,
} from "@/lib/stats";
import { LearningInsightsPanel } from "@/components/dashboard/learning-insights";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { AiCoachPanel } from "@/components/ai/ai-coach-panel";
import { SavedAiReviews } from "@/components/ai/saved-ai-reviews";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WeeklyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: trades }, { data: profile }, { data: aiReviews }] = await Promise.all([
    supabase
      .from("trades")
      .select(
        "pnl, entry_time, exit_time, setup, strategy, mistakes, mistake_tags, rule_breaks, screenshot_urls"
      )
      .order("entry_time", { ascending: true }),
    supabase.from("profiles").select("timezone").eq("id", user!.id).single(),
    supabase
      .from("ai_reviews")
      .select("*")
      .eq("user_id", user!.id)
      .is("trade_id", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const tz = profile?.timezone ?? "UTC";
  const now = new Date();
  const weeklyTrades = weekTrades(trades ?? [], tz, now);
  const stats = computeStats(weeklyTrades, tz, now);
  const insights = learningInsights(weeklyTrades);
  const ruleBreaks = ruleBreakInsights(weeklyTrades);
  const weekLabel = formatInTimeZone(now, tz, "'Week of' MMM d, yyyy");
  const screenshotCount = weeklyTrades.reduce(
    (sum, trade) => sum + (trade.screenshot_urls?.length ?? 0),
    0
  );
  const unreviewedCount = weeklyTrades.filter(
    (trade) =>
      (trade.mistake_tags?.length ?? 0) === 0 &&
      (trade.rule_breaks?.length ?? 0) === 0 &&
      !trade.mistakes
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-xl border bg-card/75 p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4 text-primary" />
            {weekLabel}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Weekly review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compress the week into rules, lessons, and one next improvement.
          </p>
        </div>
        <Button render={<Link href="/trades/new" />}>
          <Plus className="size-4" />
          New trade
        </Button>
      </div>

      {weeklyTrades.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/60 p-8 text-center text-muted-foreground">
          No trades this week yet.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card/75">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Review coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tabular-nums">
                  {weeklyTrades.length - unreviewedCount}/{weeklyTrades.length}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  trades have mistake tags, rule breaks, or notes
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/75">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Screenshots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-2xl font-semibold tabular-nums">
                  <Camera className="size-5 text-primary" />
                  {screenshotCount}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  chart captures attached this week
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/75">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Next focus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-semibold">
                  {ruleBreaks[0]?.name ?? insights.mistakeInsights[0]?.name ?? "Keep collecting data"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  highest-signal item from this week&apos;s review
                </div>
              </CardContent>
            </Card>
          </div>

          <StatTiles stats={stats} />
          <AiCoachPanel
            title="AI weekly coach"
            description="Ask OpenRouter to convert this week's journal data into study feedback."
            actions={[
              {
                mode: "weekly_review",
                title: "Weekly review",
                description: "Summarize the week, process leak, repeatable behavior, and next rule.",
              },
              {
                mode: "mistake_patterns",
                title: "Mistake patterns",
                description: "Cluster repeated mistakes and suggest prevention rules.",
              },
              {
                mode: "study_plan",
                title: "Study plan",
                description: "Create a focused practice plan from recent trades.",
              },
            ]}
          />
          <SavedAiReviews reviews={aiReviews ?? []} />
          <LearningInsightsPanel insights={insights} ruleBreaks={ruleBreaks} />
        </>
      )}
    </div>
  );
}
