import { NextResponse } from "next/server";
import { buildOptionFlowAiPlan } from "@/lib/option-flow/ai-plan";
import type { OptionFlowLevel, OptionFlowManualInput } from "@/lib/option-flow/levels";
import {
  buildCboeOptionReportFromPayload,
  buildCboeOptionReportFromRows,
} from "@/lib/option-flow/cboe";
import { parseCsvRows } from "@/lib/option-flow/csv";
import { buildDailyOptionFlowReport } from "@/lib/option-flow/report";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OptionFlowInputRow {
  symbol: string;
  spot_price: number | string | null;
  raw_text: string;
  levels: OptionFlowLevel[];
  created_at: string;
}

function normalizeManualInput(row?: OptionFlowInputRow | null): OptionFlowManualInput | null {
  if (!row) return null;
  const spotPrice = row.spot_price == null ? null : Number(row.spot_price);

  return {
    symbol: row.symbol,
    spotPrice: Number.isFinite(spotPrice) ? spotPrice : null,
    rawText: row.raw_text,
    levels: Array.isArray(row.levels) ? row.levels : [],
    createdAt: row.created_at,
  };
}

function inferSymbol(fileName: string, fallback: string) {
  const match = fileName.match(/(^|[/_-])([a-z]{1,6})_cboe/i);
  return (match?.[2] ?? fallback).toUpperCase();
}

function parseSnapshot(text: string, fileName: string, symbol: string) {
  if (fileName.endsWith(".csv") || text.trimStart().startsWith("fetched_at_utc,")) {
    return buildCboeOptionReportFromRows(symbol, parseCsvRows(text));
  }

  const payload = JSON.parse(text);
  return buildCboeOptionReportFromPayload(symbol, payload);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const reportDate = String(formData.get("reportDate") ?? "").trim();
  const symbolValue = String(formData.get("symbol") ?? "QQQ").trim().toUpperCase();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Snapshot file is required" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    return NextResponse.json({ error: "reportDate must use YYYY-MM-DD" }, { status: 400 });
  }

  const text = await file.text();
  const symbol = inferSymbol(file.name, symbolValue);
  const admin = createAdminClient();
  const { data: latestInput } = await admin
    .from("option_flow_inputs")
    .select("symbol, spot_price, raw_text, levels, created_at")
    .eq("symbol", symbol)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const manualInput = normalizeManualInput(latestInput as OptionFlowInputRow | null);

  try {
    const summary = parseSnapshot(text, file.name.toLowerCase(), symbol);
    const report = buildDailyOptionFlowReport({
      reportDate,
      requestedSymbols: [symbol],
      summaries: [summary],
      errors: [],
      generatedAt: new Date().toISOString(),
    });
    report.manualInput = manualInput;

    try {
      const aiPlan = await buildOptionFlowAiPlan(report, manualInput);
      report.aiPlan = aiPlan;
      if (!aiPlan) {
        report.errors.push("AI trading plan skipped: set OPENROUTER_API_KEY in Vercel to enable it.");
      }
    } catch (error) {
      report.aiPlan = null;
      report.errors.push(
        `AI trading plan failed: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }

    const { error } = await admin.from("option_flow_reports").upsert(
      {
        report_date: report.reportDate,
        source: "cboe_manual",
        symbols: [symbol],
        status: report.status,
        scheduled_time_zone: report.timezone,
        fetched_at: report.generatedAt,
        report,
        errors: report.errors,
        updated_at: report.generatedAt,
      },
      { onConflict: "report_date,source" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import snapshot" },
      { status: 400 }
    );
  }
}
