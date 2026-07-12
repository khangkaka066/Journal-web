import { createClient } from "@/lib/supabase/server";
import { TradeForm } from "@/components/trades/trade-form";
import { processAlerts } from "@/lib/stats";
import { BadgePlus } from "lucide-react";

export default async function NewTradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: instruments }, { data: reviewPreset }, { data: trades }] = await Promise.all([
    supabase.from("instruments").select("*").order("symbol"),
    supabase.from("review_presets").select("*").eq("user_id", user!.id).maybeSingle(),
    supabase
      .from("trades")
      .select("pnl, entry_time, exit_time, mistakes, mistake_tags, rule_breaks"),
  ]);
  const alerts = processAlerts(trades ?? []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/75 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BadgePlus className="size-4 text-primary" />
          Fast entry
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New trade</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Required fields first, optional review notes when the session cools down.
        </p>
      </div>
      <TradeForm instruments={instruments ?? []} reviewPreset={reviewPreset} processAlerts={alerts} />
    </div>
  );
}
