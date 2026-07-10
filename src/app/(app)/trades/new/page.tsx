import { createClient } from "@/lib/supabase/server";
import { TradeForm } from "@/components/trades/trade-form";

export default async function NewTradePage() {
  const supabase = await createClient();
  const { data: instruments } = await supabase
    .from("instruments")
    .select("*")
    .order("symbol");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New trade</h1>
      <TradeForm instruments={instruments ?? []} />
    </div>
  );
}
