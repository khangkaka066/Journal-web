import type { SymbolOptionReport } from "./cboe";

export interface DailyOptionFlowReport {
  reportDate: string;
  generatedAt: string;
  timezone: "America/New_York";
  source: "cboe";
  status: "completed" | "partial" | "failed";
  symbols: string[];
  summaries: SymbolOptionReport[];
  aggregate: {
    callVolume: number;
    putVolume: number;
    putCallVolumeRatio: number | null;
    callPremiumEstimate: number;
    putPremiumEstimate: number;
    netPremiumBias: "bullish" | "bearish" | "mixed";
  };
  narrative: string[];
  errors: string[];
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function ratio(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 100) / 100;
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function classify(callPremium: number, putPremium: number, pcr: number | null) {
  if (callPremium > putPremium * 1.2 && (pcr == null || pcr < 0.9)) return "bullish" as const;
  if (putPremium > callPremium * 1.2 && (pcr == null || pcr > 1.1)) return "bearish" as const;
  return "mixed" as const;
}

export function getNewYorkDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

export function buildDailyOptionFlowReport(params: {
  reportDate: string;
  generatedAt?: string;
  requestedSymbols: string[];
  summaries: SymbolOptionReport[];
  errors: string[];
}): DailyOptionFlowReport {
  const callVolume = sum(params.summaries.map((summary) => summary.callVolume));
  const putVolume = sum(params.summaries.map((summary) => summary.putVolume));
  const callPremiumEstimate = sum(params.summaries.map((summary) => summary.callPremiumEstimate));
  const putPremiumEstimate = sum(params.summaries.map((summary) => summary.putPremiumEstimate));
  const putCallVolumeRatio = ratio(putVolume, callVolume);
  const netPremiumBias = classify(callPremiumEstimate, putPremiumEstimate, putCallVolumeRatio);
  const status =
    params.summaries.length === 0
      ? "failed"
      : params.errors.length > 0
        ? "partial"
        : "completed";

  const strongestVolume = [...params.summaries].sort(
    (a, b) => b.callVolume + b.putVolume - (a.callVolume + a.putVolume)
  )[0];

  const narrative = [
    `Aggregate put/call volume ratio is ${putCallVolumeRatio ?? "n/a"}, with ${money(callPremiumEstimate)} estimated call premium and ${money(putPremiumEstimate)} estimated put premium.`,
    `Net premium bias is ${netPremiumBias}. Treat this as context, then compare it with price action and your own journal plan.`,
    strongestVolume
      ? `${strongestVolume.symbol} has the largest option activity in this report, with ${strongestVolume.callVolume + strongestVolume.putVolume} contracts of volume.`
      : "No usable option contracts were returned.",
    "Focus on repeated confirmation across premium, put/call ratio, key strikes, and the next session result instead of making one-day predictions from a single snapshot.",
  ];

  return {
    reportDate: params.reportDate,
    generatedAt: params.generatedAt ?? new Date().toISOString(),
    timezone: "America/New_York",
    source: "cboe",
    status,
    symbols: params.requestedSymbols,
    summaries: params.summaries,
    aggregate: {
      callVolume,
      putVolume,
      putCallVolumeRatio,
      callPremiumEstimate: Math.round(callPremiumEstimate),
      putPremiumEstimate: Math.round(putPremiumEstimate),
      netPremiumBias,
    },
    narrative,
    errors: params.errors,
  };
}
