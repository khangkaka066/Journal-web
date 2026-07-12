import type { TradeChecklist } from "@/lib/types";
import { normalizeTags } from "@/lib/tags";

export const REVIEW_PRESETS_KEY = "trade_review_presets";

export const CHECKLIST_GROUPS: {
  key: keyof TradeChecklist;
  title: string;
  items: string[];
}[] = [
  {
    key: "entryModels",
    title: "Entry model",
    items: ["CISD", "iFVG", "FVG mitigation", "Liquidity sweep", "Order block", "Breaker"],
  },
  {
    key: "context",
    title: "Market context",
    items: ["HTF PDA", "Premium/discount", "Draw on liquidity", "Killzone", "News clear"],
  },
  {
    key: "confirmation",
    title: "Confirmation",
    items: ["Absorption", "Exhaustion", "Displacement", "MSS/BOS", "Volume shift"],
  },
  {
    key: "execution",
    title: "Execution discipline",
    items: ["Planned entry", "Stop at invalidation", "Target liquidity", "2R+ available", "No chase"],
  },
  {
    key: "review",
    title: "Review",
    items: ["Followed plan", "Screenshot saved", "Mistake tagged", "Lesson written"],
  },
];

export const EMPTY_CHECKLIST: Required<TradeChecklist> = {
  entryModels: [],
  context: [],
  confirmation: [],
  execution: [],
  review: [],
};

export const DEFAULT_MISTAKE_TAGS = [
  "Chased entry",
  "Late entry",
  "No HTF PDA",
  "Ignored news",
  "Moved stop",
  "Early exit",
  "Oversized",
  "Revenge trade",
  "No liquidity target",
  "Entered in chop",
];

export const DEFAULT_RULE_BREAKS = [
  "No checklist",
  "No invalidation",
  "No 2R available",
  "Outside killzone",
  "Against HTF bias",
  "No displacement",
  "Entered before confirmation",
  "Held past plan",
];

export interface ReviewPresets {
  checklist: Required<TradeChecklist>;
  mistakeTags: string[];
  ruleBreaks: string[];
}

export type ChecklistDrafts = Record<keyof TradeChecklist, string>;

export const DEFAULT_REVIEW_PRESETS: ReviewPresets = {
  checklist: {
    entryModels: CHECKLIST_GROUPS.find((group) => group.key === "entryModels")?.items ?? [],
    context: CHECKLIST_GROUPS.find((group) => group.key === "context")?.items ?? [],
    confirmation: CHECKLIST_GROUPS.find((group) => group.key === "confirmation")?.items ?? [],
    execution: CHECKLIST_GROUPS.find((group) => group.key === "execution")?.items ?? [],
    review: CHECKLIST_GROUPS.find((group) => group.key === "review")?.items ?? [],
  },
  mistakeTags: DEFAULT_MISTAKE_TAGS,
  ruleBreaks: DEFAULT_RULE_BREAKS,
};

export function uniqueItems(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

export function normalizeChecklist(checklist?: TradeChecklist | null): Required<TradeChecklist> {
  return {
    entryModels: checklist?.entryModels ?? [],
    context: checklist?.context ?? [],
    confirmation: checklist?.confirmation ?? [],
    execution: checklist?.execution ?? [],
    review: checklist?.review ?? [],
  };
}

export function mergeChecklistItems(
  base: Required<TradeChecklist>,
  checklist: Required<TradeChecklist>
): Required<TradeChecklist> {
  return {
    entryModels: uniqueItems([...base.entryModels, ...checklist.entryModels]),
    context: uniqueItems([...base.context, ...checklist.context]),
    confirmation: uniqueItems([...base.confirmation, ...checklist.confirmation]),
    execution: uniqueItems([...base.execution, ...checklist.execution]),
    review: uniqueItems([...base.review, ...checklist.review]),
  };
}

export function mergeReviewPresets(
  base: ReviewPresets,
  savedChecklist: Required<TradeChecklist>
): ReviewPresets {
  return {
    checklist: mergeChecklistItems(base.checklist, savedChecklist),
    mistakeTags: uniqueItems(base.mistakeTags),
    ruleBreaks: uniqueItems(base.ruleBreaks),
  };
}

export function parseReviewPresets(
  value?: {
    checklist?: TradeChecklist | null;
    mistakeTags?: string[] | null;
    ruleBreaks?: string[] | null;
  } | null
): ReviewPresets {
  if (!value) return DEFAULT_REVIEW_PRESETS;

  return {
    checklist: normalizeChecklist(value.checklist),
    mistakeTags: normalizeTags(value.mistakeTags ?? []),
    ruleBreaks: normalizeTags(value.ruleBreaks ?? []),
  };
}
