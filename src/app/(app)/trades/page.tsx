import { createClient } from "@/lib/supabase/server";
import { TradeTable } from "@/components/trades/trade-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";

export default async function TradesPage() {
  const supabase = await createClient();
  const { data: trades } = await supabase
    .from("trades")
    .select("*, instruments(symbol, point_value)")
    .order("entry_time", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-xl border bg-card/75 p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ReceiptText className="size-4 text-primary" />
            Trade ledger
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Trades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter your memory by keeping each execution clean and searchable.
          </p>
        </div>
        <Button render={<Link href="/trades/new" />}>
          <Plus className="size-4" />
          New trade
        </Button>
      </div>
      {trades && trades.length > 0 ? (
        <TradeTable trades={trades} />
      ) : (
        <div className="rounded-xl border border-dashed bg-card/60 p-12 text-center text-muted-foreground">
          No trades yet.{" "}
          <Link href="/trades/new" className="underline">
            Log your first trade
          </Link>
        </div>
      )}
    </div>
  );
}
