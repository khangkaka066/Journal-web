export interface OptionFlowLevel {
  symbol: string;
  label: string;
  value: number;
}

export interface OptionFlowManualInput {
  symbol: string;
  spotPrice: number | null;
  rawText: string;
  levels: OptionFlowLevel[];
  createdAt?: string;
}

export const DEFAULT_QQQ_LEVELS: OptionFlowLevel[] = [
  { symbol: "QQQ", label: "Call Resistance", value: 800 },
  { symbol: "QQQ", label: "Put Support", value: 715 },
  { symbol: "QQQ", label: "HVL", value: 721 },
  { symbol: "QQQ", label: "1D Min", value: 712.19 },
  { symbol: "QQQ", label: "1D Max", value: 735.97 },
  { symbol: "QQQ", label: "Call Resistance 0DTE", value: 725 },
  { symbol: "QQQ", label: "Put Support 0DTE", value: 715 },
  { symbol: "QQQ", label: "HVL 0DTE", value: 727 },
  { symbol: "QQQ", label: "Gamma Wall 0DTE", value: 725 },
  { symbol: "QQQ", label: "GEX 1", value: 730 },
  { symbol: "QQQ", label: "GEX 2", value: 735 },
  { symbol: "QQQ", label: "GEX 3", value: 726 },
  { symbol: "QQQ", label: "GEX 4", value: 733 },
  { symbol: "QQQ", label: "GEX 5", value: 729 },
  { symbol: "QQQ", label: "GEX 6", value: 740 },
  { symbol: "QQQ", label: "GEX 7", value: 710 },
  { symbol: "QQQ", label: "GEX 8", value: 711 },
  { symbol: "QQQ", label: "GEX 9", value: 705 },
  { symbol: "QQQ", label: "GEX 10", value: 745 },
];

export const DEFAULT_QQQ_LEVELS_TEXT =
  "$QQQ: Call Resistance, 800, Put Support, 715, HVL, 721, 1D Min, 712.19, 1D Max, 735.97, Call Resistance 0DTE, 725, Put Support 0DTE, 715, HVL 0DTE, 727, Gamma Wall 0DTE, 725, GEX 1, 730, GEX 2, 735, GEX 3, 726, GEX 4, 733, GEX 5, 729, GEX 6, 740, GEX 7, 710, GEX 8, 711, GEX 9, 705, GEX 10, 745";

export function parseOptionFlowLevels(rawText: string, fallbackSymbol = "QQQ"): OptionFlowManualInput {
  const trimmed = rawText.trim();
  const symbolMatch = trimmed.match(/^\$?([A-Z]{1,6})\s*:/i);
  const symbol = (symbolMatch?.[1] ?? fallbackSymbol).toUpperCase();
  const body = symbolMatch ? trimmed.slice(symbolMatch[0].length) : trimmed;
  const parts = body
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const levels: OptionFlowLevel[] = [];

  for (let index = 0; index < parts.length - 1; index += 2) {
    const label = parts[index];
    const value = Number(parts[index + 1]?.replace(/[$,%]/g, ""));
    if (!label || !Number.isFinite(value)) continue;
    levels.push({ symbol, label, value });
  }

  return {
    symbol,
    spotPrice: null,
    rawText: trimmed,
    levels,
  };
}
