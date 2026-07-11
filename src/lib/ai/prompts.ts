import type { Trade } from "@/lib/types";
import type { StatsTrade } from "@/lib/stats";

export type AiCoachMode =
  | "weekly_review"
  | "trade_debrief"
  | "mistake_patterns"
  | "screenshot_review"
  | "study_plan";

const SYSTEM_PROMPT = `You are an educational trading journal coach.
You help the user review process, risk, rules, emotions, and learning patterns.
Do not provide live trading signals, predictions, guaranteed outcomes, or financial advice.
Use the user's own journal data. Be specific, concise, direct, and practical.
Prefer process improvements over market calls.`;

function formatTrade(trade: Partial<Trade> | StatsTrade) {
  return {
    entry_time: trade.entry_time,
    exit_time: trade.exit_time,
    pnl: trade.pnl,
    setup: trade.setup,
    strategy: trade.strategy,
    mistakes: trade.mistakes,
    mistake_tags: trade.mistake_tags,
    rule_breaks: trade.rule_breaks,
    screenshot_count: trade.screenshot_urls?.length ?? 0,
    notes: "notes" in trade ? trade.notes : undefined,
    lessons: "lessons" in trade ? trade.lessons : undefined,
    confidence: "confidence" in trade ? trade.confidence : undefined,
    session: "session" in trade ? trade.session : undefined,
    direction: "direction" in trade ? trade.direction : undefined,
    risk: "risk" in trade ? trade.risk : undefined,
    r_multiple: "r_multiple" in trade ? trade.r_multiple : undefined,
    trade_checklist: "trade_checklist" in trade ? trade.trade_checklist : undefined,
  };
}

function json(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function buildAiCoachPrompt({
  mode,
  trades,
  trade,
  timezone,
}: {
  mode: AiCoachMode;
  trades: StatsTrade[];
  trade?: Trade;
  timezone: string;
}) {
  const compactTrades = trades.slice(-60).map(formatTrade);
  const base = `Timezone: ${timezone}
Available journal data:
${json(compactTrades)}`;

  if (mode === "weekly_review") {
    return {
      system: SYSTEM_PROMPT,
      user: `${base}

Create an AI weekly review with these sections:
1. What happened this week
2. Biggest process leak
3. Best behavior to repeat
4. One rule for next week
5. One focused drill or replay exercise

Keep it actionable and grounded in the data.`,
    };
  }

  if (mode === "trade_debrief") {
    return {
      system: SYSTEM_PROMPT,
      user: `Review this single trade as a post-trade debrief.
Trade:
${json(trade ? formatTrade(trade) : null)}

Return these sections:
1. Trade thesis recap
2. What was executed well
3. What should be improved
4. Rule or checklist conflict
5. One sentence lesson for the next similar trade`,
    };
  }

  if (mode === "mistake_patterns") {
    return {
      system: SYSTEM_PROMPT,
      user: `${base}

Detect recurring mistake patterns. Group similar wording into clean labels.
Return:
1. Top 3 mistake clusters
2. Evidence from journal tags/notes
3. Cost or frequency when visible
4. A prevention rule for each cluster
5. Which cluster to attack first and why`,
    };
  }

  if (mode === "screenshot_review") {
    return {
      system: SYSTEM_PROMPT,
      user: `Review the provided chart screenshot(s) only as educational post-trade context.
Do not predict future price or give trade recommendations.
Trade:
${json(trade ? formatTrade(trade) : null)}

Use the user's framework if visible or described. Return:
1. What the screenshot appears to show
2. Whether the entry context matches the checklist notes
3. Missing context that cannot be verified from the image
4. One screenshot annotation idea for future journaling
5. One question the trader should answer before repeating this setup`,
    };
  }

  return {
    system: SYSTEM_PROMPT,
    user: `${base}

Create a study plan based on recent journal data.
Return:
1. Main learning objective
2. Setup to focus on
3. Rule to protect
4. 5-day practice plan
5. Metrics to track next week

Keep it realistic and process-based.`,
  };
}
