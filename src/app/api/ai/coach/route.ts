import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { weekTrades } from "@/lib/stats";
import { askOpenRouter } from "@/lib/ai/openrouter";
import { buildAiCoachPrompt, type AiCoachMode } from "@/lib/ai/prompts";

const MODES = new Set<AiCoachMode>([
  "weekly_review",
  "trade_debrief",
  "mistake_patterns",
  "screenshot_review",
  "study_plan",
]);

interface CoachRequest {
  mode?: AiCoachMode;
  tradeId?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CoachRequest;
  const mode = body.mode;

  if (!mode || !MODES.has(mode)) {
    return NextResponse.json({ error: "Invalid AI coach mode" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: profile }, { data: trades }] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", user.id).single(),
    supabase
      .from("trades")
      .select(
        "pnl, entry_time, exit_time, setup, strategy, mistakes, mistake_tags, rule_breaks, screenshot_urls"
      )
      .order("entry_time", { ascending: true }),
  ]);

  const timezone = profile?.timezone ?? "UTC";
  const allTrades = trades ?? [];
  const promptTrades =
    mode === "weekly_review" ? weekTrades(allTrades, timezone, new Date()) : allTrades;

  let trade = null;
  let imageUrls: string[] = [];

  if (mode === "trade_debrief" || mode === "screenshot_review") {
    if (!body.tradeId) {
      return NextResponse.json({ error: "tradeId is required" }, { status: 400 });
    }

    const { data } = await supabase
      .from("trades")
      .select("*")
      .eq("id", body.tradeId)
      .eq("user_id", user.id)
      .single();

    if (!data) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    trade = data;

    if (mode === "screenshot_review" && data.screenshot_urls.length > 0) {
      const { data: signed } = await supabase.storage
        .from("screenshots")
        .createSignedUrls(data.screenshot_urls.slice(0, 3), 60 * 10);

      imageUrls = (signed ?? []).flatMap((item) =>
        item.signedUrl ? [item.signedUrl] : []
      );
    }
  }

  const prompt = buildAiCoachPrompt({
    mode,
    trades: promptTrades,
    trade: trade ?? undefined,
    timezone,
  });

  const userMessage =
    mode === "screenshot_review" && imageUrls.length > 0
      ? {
          role: "user" as const,
          content: [
            { type: "text" as const, text: prompt.user },
            ...imageUrls.map((url) => ({
              type: "image_url" as const,
              image_url: { url },
            })),
          ],
        }
      : { role: "user" as const, content: prompt.user };

  try {
    const output = await askOpenRouter({
      messages: [
        { role: "system", content: prompt.system },
        userMessage,
      ],
      apiKey: body.openRouterApiKey?.trim(),
      model: body.openRouterModel?.trim(),
    });

    return NextResponse.json({ output });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI request failed" },
      { status: 500 }
    );
  }
}
