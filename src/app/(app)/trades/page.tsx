import { createClient } from "@/lib/supabase/server";
import { TradeTable } from "@/components/trades/trade-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TradesPage() {
  const supabase = await createClient();
  const { data: trades } = await supabase
    .from("trades")
    .select("*, instruments(symbol, point_value)")
    .order("entry_time", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trades</h1>
        <Button render={<Link href="/trades/new" />}>+ New trade</Button>
      </div>
      {trades && trades.length > 0 ? (
        <TradeTable trades={trades} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No trades yet.{" "}
          <Link href="/trades/new" className="underline">
            Log your first trade
          </Link>
        </div>
      )}
    </div>
  );
}
