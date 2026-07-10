import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TradeForm } from "@/components/trades/trade-form";

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: trade }, { data: instruments }] = await Promise.all([
    supabase.from("trades").select("*").eq("id", id).single(),
    supabase.from("instruments").select("*").order("symbol"),
  ]);

  if (!trade) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit trade</h1>
      <TradeForm instruments={instruments ?? []} trade={trade} />
    </div>
  );
}
