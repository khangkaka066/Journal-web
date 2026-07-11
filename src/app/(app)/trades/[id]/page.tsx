import { notFound } from "next/navigation";
import { PencilLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TradeForm } from "@/components/trades/trade-form";
import { ScreenshotGallery, type ScreenshotView } from "@/components/trades/screenshot-gallery";
import { AiCoachPanel } from "@/components/ai/ai-coach-panel";

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: trade }, { data: instruments }, { data: reviewPreset }] = await Promise.all([
    supabase.from("trades").select("*").eq("id", id).single(),
    supabase.from("instruments").select("*").order("symbol"),
    supabase.from("review_presets").select("*").eq("user_id", user!.id).maybeSingle(),
  ]);

  if (!trade) notFound();

  let screenshots: ScreenshotView[] = [];
  if (trade.screenshot_urls.length > 0) {
    const { data } = await supabase.storage
      .from("screenshots")
      .createSignedUrls(trade.screenshot_urls, 60 * 60);

    screenshots = (data ?? []).flatMap((item) => {
      if (!item.path || !item.signedUrl) return [];
      return [{ path: item.path, url: item.signedUrl }];
    });
  }

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
      <ScreenshotGallery screenshots={screenshots} />
      <AiCoachPanel
        title="AI trade coach"
        description="Use OpenRouter to debrief this trade and review attached chart screenshots."
        actions={[
          {
            mode: "trade_debrief",
            title: "Trade debrief",
            description: "Review thesis, execution, rules, and one lesson.",
            tradeId: trade.id,
          },
          {
            mode: "screenshot_review",
            title: "Screenshot review",
            description: screenshots.length
              ? "Review chart context from uploaded screenshots."
              : "Attach screenshots first for visual review.",
            tradeId: trade.id,
          },
        ]}
      />
      <TradeForm instruments={instruments ?? []} trade={trade} reviewPreset={reviewPreset} />
    </div>
  );
}
