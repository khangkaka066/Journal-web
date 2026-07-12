import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { askOpenRouter } from "@/lib/ai/openrouter";
import type { DailyOptionFlowReport } from "./report";
import {
  DEFAULT_QQQ_LEVELS,
  DEFAULT_QQQ_LEVELS_TEXT,
  type OptionFlowLevel,
  type OptionFlowManualInput,
} from "./levels";

export interface OptionFlowAiPlan {
  generatedAt: string;
  model: string;
  knowledgeSource: string;
  manualInput: OptionFlowManualInput;
  levels: OptionFlowLevel[];
  content: string;
}

const KNOWLEDGE_PATH = "docs/option_flow_knowledge.md";

function compactKnowledge(content: string): string {
  const sections = content
    .split(/\n## /)
    .filter((section) =>
      [
        "2. Volume vs Open Interest vs Premium",
        "3. Put/Call Ratio",
        "5. Phân biệt đầu cơ vs phòng hộ",
        "6. Dealer positioning",
        "7. 0DTE",
        "12. Ngưỡng định lượng",
        "13. Quy trình đọc flow",
        "16. Bộ luật suy luận",
        "17. Schema dữ liệu crawl",
      ].some((title) => section.startsWith(title))
    )
    .map((section) => `## ${section.trim()}`);

  return sections.join("\n\n").slice(0, 18000);
}

function slimReport(report: DailyOptionFlowReport) {
  return {
    reportDate: report.reportDate,
    generatedAt: report.generatedAt,
    aggregate: report.aggregate,
    narrative: report.narrative,
    summaries: report.summaries.map((summary) => ({
      symbol: summary.symbol,
      underlyingLast: summary.underlyingLast,
      underlyingPrevClose: summary.underlyingPrevClose,
      underlyingChangePct: summary.underlyingChangePct,
      totalContracts: summary.totalContracts,
      callVolume: summary.callVolume,
      putVolume: summary.putVolume,
      callOpenInterest: summary.callOpenInterest,
      putOpenInterest: summary.putOpenInterest,
      putCallVolumeRatio: summary.putCallVolumeRatio,
      putCallOpenInterestRatio: summary.putCallOpenInterestRatio,
      callPremiumEstimate: summary.callPremiumEstimate,
      putPremiumEstimate: summary.putPremiumEstimate,
      netPremiumBias: summary.netPremiumBias,
      averageIv: summary.averageIv,
      topVolume: summary.topVolume.slice(0, 8),
      unusualVolume: summary.unusualVolume.slice(0, 8),
      keyStrikes: summary.keyStrikes.slice(0, 10),
      notes: summary.notes,
    })),
    errors: report.errors,
  };
}

export async function buildOptionFlowAiPlan(
  report: DailyOptionFlowReport,
  manualInput?: OptionFlowManualInput | null
): Promise<OptionFlowAiPlan | null> {
  if (!process.env.OPENROUTER_API_KEY) return null;

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  const rawKnowledge = await readFile(join(process.cwd(), KNOWLEDGE_PATH), "utf8");
  const knowledge = compactKnowledge(rawKnowledge);
  const input = manualInput ?? {
    symbol: "QQQ",
    spotPrice: null,
    rawText: DEFAULT_QQQ_LEVELS_TEXT,
    levels: DEFAULT_QQQ_LEVELS,
  };
  const levels = input.levels.length > 0 ? input.levels : DEFAULT_QQQ_LEVELS;

  const content = await askOpenRouter({
    model,
    maxTokens: 2200,
    messages: [
      {
        role: "system",
        content:
          "You are an options-flow trading coach. Create educational, conditional if-then trading plans only. Do not promise profits, do not give certainty, and do not tell the user to buy or sell immediately. Always include invalidation and risk controls.",
      },
      {
        role: "user",
        content: `Use the knowledge base, yesterday's option chain snapshot, and the QQQ levels to create a detailed trading plan for today's session.

Output in concise Vietnamese Markdown with these sections:
1. Market Context
2. Key Levels
3. Main Scenario
4. Bullish Plan
5. Bearish Plan
6. Chop / No Trade Conditions
7. Risk Controls
8. What To Journal After The Session

Rules:
- Every trade idea must be conditional if-then.
- Use the supplied current price and levels: call resistance, put support, HVL, 1D min/max, 0DTE walls, gamma wall, and GEX ladder.
- Compare the levels with the CBOE snapshot values.
- Explain the mechanism using OI, put/call ratio, premium, gamma wall, pinning, 0DTE, vanna/charm only when supported by data.
- Mention that this is educational planning, not financial advice.

KNOWLEDGE BASE:
${knowledge}

QQQ LEVELS:
${JSON.stringify(levels, null, 2)}

USER INPUT:
${JSON.stringify(input, null, 2)}

OPTION FLOW SNAPSHOT:
${JSON.stringify(slimReport(report), null, 2)}`,
      },
    ],
  });

  return {
    generatedAt: new Date().toISOString(),
    model,
    knowledgeSource: KNOWLEDGE_PATH,
    manualInput: input,
    levels,
    content,
  };
}
