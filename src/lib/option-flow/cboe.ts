export interface OptionContract {
  symbol: string;
  optionSymbol: string;
  expiration: string;
  optionType: "call" | "put";
  strike: number;
  bid: number;
  ask: number;
  mid: number;
  last: number;
  prevClose: number;
  volume: number;
  openInterest: number;
  iv: number | null;
  delta: number | null;
  gamma: number | null;
}

export interface SymbolOptionReport {
  symbol: string;
  source: "cboe";
  underlyingLast: number | null;
  underlyingPrevClose: number | null;
  underlyingChangePct: number | null;
  underlyingAsOf: string | null;
  totalContracts: number;
  callVolume: number;
  putVolume: number;
  callOpenInterest: number;
  putOpenInterest: number;
  putCallVolumeRatio: number | null;
  putCallOpenInterestRatio: number | null;
  callPremiumEstimate: number;
  putPremiumEstimate: number;
  netPremiumBias: "bullish" | "bearish" | "mixed";
  averageIv: number | null;
  topVolume: OptionContract[];
  unusualVolume: Array<OptionContract & { volumeToOpenInterest: number }>;
  keyStrikes: Array<{
    strike: number;
    callVolume: number;
    putVolume: number;
    callOpenInterest: number;
    putOpenInterest: number;
    premiumEstimate: number;
  }>;
  notes: string[];
}

interface CboePayload {
  data?: {
    options?: unknown[];
    current_price?: unknown;
    close?: unknown;
    prev_day_close?: unknown;
    volume?: unknown;
    iv30?: unknown;
    as_of?: unknown;
  };
  timestamp?: string;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%]/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asNullableNumber(value: unknown): number | null {
  const parsed = asNumber(value);
  return parsed === 0 && (value == null || value === "") ? null : parsed;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readField(row: Record<string, unknown>, names: string[]): unknown {
  for (const name of names) {
    if (row[name] != null) return row[name];
  }
  return undefined;
}

function parseOptionSymbol(optionSymbol: string, fallbackSymbol: string) {
  const compact = optionSymbol.replace(/\s+/g, "").toUpperCase();
  const match = compact.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);

  if (!match) {
    return null;
  }

  const [, root, yymmdd, cp, strikeRaw] = match;
  const year = Number(`20${yymmdd.slice(0, 2)}`);
  const month = Number(yymmdd.slice(2, 4));
  const day = Number(yymmdd.slice(4, 6));
  const expiration = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    symbol: root || fallbackSymbol,
    expiration,
    optionType: cp === "C" ? "call" as const : "put" as const,
    strike: Number(strikeRaw) / 1000,
  };
}

function normalizeContract(rowValue: unknown, fallbackSymbol: string): OptionContract | null {
  if (!rowValue || typeof rowValue !== "object") return null;
  const row = rowValue as Record<string, unknown>;
  const optionSymbol = asString(readField(row, ["option", "option_symbol", "symbol"]));
  const parsed = parseOptionSymbol(optionSymbol, fallbackSymbol);

  const optionTypeText = asString(readField(row, ["option_type", "type", "call_put"])).toLowerCase();
  const optionType =
    parsed?.optionType ?? (optionTypeText.startsWith("p") ? "put" : optionTypeText.startsWith("c") ? "call" : null);
  const strike = parsed?.strike ?? asNumber(readField(row, ["strike", "strike_price"]));
  const expiration = parsed?.expiration ?? asString(readField(row, ["expiration", "expiration_date", "expiry"]));

  if (!optionType || !strike || !expiration) return null;

  const bid = asNumber(readField(row, ["bid", "bid_price"]));
  const ask = asNumber(readField(row, ["ask", "ask_price"]));
  const last = asNumber(readField(row, ["last_trade_price", "last", "last_price"]));
  const mid = bid > 0 && ask > 0 ? (bid + ask) / 2 : last;

  return {
    symbol: parsed?.symbol ?? fallbackSymbol,
    optionSymbol,
    expiration,
    optionType,
    strike,
    bid,
    ask,
    mid,
    last,
    prevClose: asNumber(readField(row, ["prev_day_close", "previous_close", "prev_close"])),
    volume: asNumber(readField(row, ["volume", "vol"])),
    openInterest: asNumber(readField(row, ["open_interest", "openInterest", "oi"])),
    iv: asNullableNumber(readField(row, ["iv", "implied_volatility"])),
    delta: asNullableNumber(readField(row, ["delta"])),
    gamma: asNullableNumber(readField(row, ["gamma"])),
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function ratio(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return numerator / denominator;
}

function premium(contract: OptionContract): number {
  const price = contract.mid || contract.last || contract.prevClose;
  return price * contract.volume * 100;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function trimContract(contract: OptionContract): OptionContract {
  return {
    ...contract,
    bid: round(contract.bid),
    ask: round(contract.ask),
    mid: round(contract.mid),
    last: round(contract.last),
    prevClose: round(contract.prevClose),
    iv: contract.iv == null ? null : round(contract.iv, 4),
    delta: contract.delta == null ? null : round(contract.delta, 4),
    gamma: contract.gamma == null ? null : round(contract.gamma, 6),
  };
}

function classifyBias(callPremium: number, putPremium: number, pcr: number | null): SymbolOptionReport["netPremiumBias"] {
  if (callPremium > putPremium * 1.2 && (pcr == null || pcr < 0.9)) return "bullish";
  if (putPremium > callPremium * 1.2 && (pcr == null || pcr > 1.1)) return "bearish";
  return "mixed";
}

export async function fetchCboeOptionReport(symbolInput: string): Promise<SymbolOptionReport> {
  const symbol = symbolInput.trim().toUpperCase();
  const response = await fetch(
    `https://cdn.cboe.com/api/global/delayed_quotes/options/${encodeURIComponent(symbol)}.json`,
    {
      cache: "no-store",
      headers: {
        accept: "application/json",
        "user-agent": "TradingJournal/1.0 option-flow-report",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`${symbol}: CBOE request failed with ${response.status}`);
  }

  const payload = (await response.json()) as CboePayload;
  const data = payload.data ?? {};
  const contracts = (data.options ?? [])
    .map((row) => normalizeContract(row, symbol))
    .filter((contract): contract is OptionContract => Boolean(contract));

  if (contracts.length === 0) {
    throw new Error(`${symbol}: no option contracts returned by CBOE`);
  }

  const calls = contracts.filter((contract) => contract.optionType === "call");
  const puts = contracts.filter((contract) => contract.optionType === "put");
  const callVolume = sum(calls.map((contract) => contract.volume));
  const putVolume = sum(puts.map((contract) => contract.volume));
  const callOpenInterest = sum(calls.map((contract) => contract.openInterest));
  const putOpenInterest = sum(puts.map((contract) => contract.openInterest));
  const putCallVolumeRatio = ratio(putVolume, callVolume);
  const callPremiumEstimate = sum(calls.map(premium));
  const putPremiumEstimate = sum(puts.map(premium));

  const ivValues = contracts.flatMap((contract) => (contract.iv == null || contract.iv <= 0 ? [] : [contract.iv]));
  const strikeMap = new Map<number, SymbolOptionReport["keyStrikes"][number]>();

  for (const contract of contracts) {
    const current = strikeMap.get(contract.strike) ?? {
      strike: contract.strike,
      callVolume: 0,
      putVolume: 0,
      callOpenInterest: 0,
      putOpenInterest: 0,
      premiumEstimate: 0,
    };

    if (contract.optionType === "call") {
      current.callVolume += contract.volume;
      current.callOpenInterest += contract.openInterest;
    } else {
      current.putVolume += contract.volume;
      current.putOpenInterest += contract.openInterest;
    }
    current.premiumEstimate += premium(contract);
    strikeMap.set(contract.strike, current);
  }

  const topVolume = [...contracts]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 12)
    .map(trimContract);

  const unusualVolume = [...contracts]
    .filter((contract) => contract.volume > 0 && contract.openInterest > 0)
    .map((contract) => ({
      ...trimContract(contract),
      volumeToOpenInterest: round(contract.volume / contract.openInterest, 2),
    }))
    .sort((a, b) => b.volumeToOpenInterest - a.volumeToOpenInterest)
    .slice(0, 12);

  const keyStrikes = [...strikeMap.values()]
    .sort((a, b) => {
      const aScore = a.callVolume + a.putVolume + a.callOpenInterest + a.putOpenInterest;
      const bScore = b.callVolume + b.putVolume + b.callOpenInterest + b.putOpenInterest;
      return bScore - aScore;
    })
    .slice(0, 12)
    .map((strike) => ({
      ...strike,
      strike: round(strike.strike, 3),
      premiumEstimate: round(strike.premiumEstimate),
    }));

  const underlyingLast = asNullableNumber(data.current_price ?? data.close);
  const underlyingPrevClose = asNullableNumber(data.prev_day_close);

  return {
    symbol,
    source: "cboe",
    underlyingLast,
    underlyingPrevClose,
    underlyingChangePct:
      underlyingLast != null && underlyingPrevClose
        ? round(((underlyingLast - underlyingPrevClose) / underlyingPrevClose) * 100, 2)
        : null,
    underlyingAsOf: asString(data.as_of) || payload.timestamp || null,
    totalContracts: contracts.length,
    callVolume,
    putVolume,
    callOpenInterest,
    putOpenInterest,
    putCallVolumeRatio: putCallVolumeRatio == null ? null : round(putCallVolumeRatio, 2),
    putCallOpenInterestRatio: ratio(putOpenInterest, callOpenInterest) == null
      ? null
      : round(ratio(putOpenInterest, callOpenInterest) ?? 0, 2),
    callPremiumEstimate: round(callPremiumEstimate),
    putPremiumEstimate: round(putPremiumEstimate),
    netPremiumBias: classifyBias(callPremiumEstimate, putPremiumEstimate, putCallVolumeRatio),
    averageIv: ivValues.length ? round(sum(ivValues) / ivValues.length, 4) : null,
    topVolume,
    unusualVolume,
    keyStrikes,
    notes: [
      "CBOE data is a delayed option chain snapshot, not true tick-by-tick order flow.",
      "Premium uses mid price when bid/ask exists, otherwise last or previous close.",
      "Use this report as market context and backtest input, not as a standalone signal.",
    ],
  };
}
