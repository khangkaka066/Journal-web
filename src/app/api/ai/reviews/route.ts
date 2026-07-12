import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SaveAiReviewRequest {
  tradeId?: string;
  mode?: string;
  title?: string;
  content?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SaveAiReviewRequest;
  const mode = body.mode?.trim();
  const title = body.title?.trim();
  const content = body.content?.trim();

  if (!mode || !title || !content) {
    return NextResponse.json({ error: "Missing review fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("ai_reviews").insert({
    user_id: user.id,
    trade_id: body.tradeId || null,
    mode,
    title,
    content,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
