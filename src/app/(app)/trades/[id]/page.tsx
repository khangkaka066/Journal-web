import { notFound } from "next/navigation";
import { PencilLine } from "lucide-react";
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
      <div className="rounded-xl border bg-card/75 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PencilLine className="size-4 text-primary" />
          Trade review
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit trade</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update execution details and keep the lesson attached to the record.
        </p>
      </div>
      <TradeForm instruments={instruments ?? []} trade={trade} />
    </div>
  );
}
