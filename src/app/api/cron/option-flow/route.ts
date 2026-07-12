import { NextResponse } from "next/server";
import { fetchCboeOptionReport } from "@/lib/option-flow/cboe";
import { buildDailyOptionFlowReport, getNewYorkDateParts } from "@/lib/option-flow/report";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSymbols(): string[] {
  const value = process.env.OPTION_FLOW_SYMBOLS ?? "SPY,QQQ";
  return value
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
}

function isAuthorized(request: Request): boolean {
  const secrets = [process.env.OPTION_FLOW_CRON_SECRET, process.env.CRON_SECRET].filter(
    (value): value is string => Boolean(value)
  );

  if (secrets.length === 0 && process.env.NODE_ENV !== "production") return true;
  if (secrets.length === 0) return false;

  const auth = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  return secrets.some((secret) => auth === `Bearer ${secret}` || headerSecret === secret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const ny = getNewYorkDateParts(now);

  const symbols = getSymbols();
  const settled = await Promise.allSettled(symbols.map((symbol) => fetchCboeOptionReport(symbol)));
  const summaries = settled.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  const errors = settled.flatMap((result, index) =>
    result.status === "rejected"
      ? [`${symbols[index]}: ${result.reason instanceof Error ? result.reason.message : "unknown error"}`]
      : []
  );

  const report = buildDailyOptionFlowReport({
    reportDate: ny.date,
    requestedSymbols: symbols,
    summaries,
    errors,
    generatedAt: now.toISOString(),
  });

  const supabase = createAdminClient();
  const { error } = await supabase.from("option_flow_reports").upsert(
    {
      report_date: report.reportDate,
      source: report.source,
      symbols,
      status: report.status,
      scheduled_time_zone: report.timezone,
      fetched_at: report.generatedAt,
      report,
      errors,
      updated_at: now.toISOString(),
    },
    { onConflict: "report_date,source" }
  );

  if (error) {
    return NextResponse.json({ error: error.message, report }, { status: 500 });
  }

  return NextResponse.json({ ok: true, report });
}
