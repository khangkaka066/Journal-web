const ALIASES: Record<string, string> = {
  chase: "Chased Entry",
  chased: "Chased Entry",
  "chased entry": "Chased Entry",
  "late entry": "Late Entry",
  "entered late": "Late Entry",
  "early entry": "Early Entry",
  "entered early": "Early Entry",
  "moved stop": "Moved Stop",
  "move stop": "Moved Stop",
  oversize: "Oversized",
  oversized: "Oversized",
  revenge: "Revenge Trade",
  "revenge trade": "Revenge Trade",
  "no htf pda": "No HTF PDA",
  "htf pda missing": "No HTF PDA",
  "no invalidation": "No Invalidation",
  "outside killzone": "Outside Killzone",
  "against htf bias": "Against HTF Bias",
  "no displacement": "No Displacement",
};

const UPPERCASE_WORDS = new Set(["HTF", "PDA", "FVG", "IFVG", "CISD", "BOS", "MSS"]);

function titleWord(word: string) {
  const upper = word.toUpperCase();
  if (UPPERCASE_WORDS.has(upper)) return upper === "IFVG" ? "iFVG" : upper;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function normalizeTag(value: string | null | undefined): string | null {
  const cleaned = value?.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;

  const key = cleaned.toLowerCase();
  if (ALIASES[key]) return ALIASES[key];

  return cleaned
    .split(" ")
    .map(titleWord)
    .join(" ");
}

export function normalizeTags(values: string[]): string[] {
  return [...new Set(values.map(normalizeTag).filter((value): value is string => Boolean(value)))];
}

export function parseTagInput(value: string): string[] {
  return normalizeTags(value.split(/[,;\n]/));
}
