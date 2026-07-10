import { formatInTimeZone } from "date-fns-tz";

export interface StatsTrade {
  pnl: number;
  exit_time: string | null;
  entry_time: string;
  instrument_id?: string | null;
  session?: string | null;
  setup?: string | null;
  strategy?: string | null;
  mistakes?: string | null;
  mistake_tags?: string[] | null;
  rule_breaks?: string[] | null;
  screenshot_urls?: string[] | null;
}

export interface DashboardStats {
  totalPnl: number;
  totalTrades: number;
  winRate: number | null;
  profitFactor: number | null;
  expectancy: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  largestWin: number | null;
  largestLoss: number | null;
  maxDrawdown: number;
  streak: { type: "win" | "loss"; count: number } | null;
  weeklyPnl: number;
  monthlyPnl: number;
}

function tradeTime(t: StatsTrade): number {
  return new Date(t.exit_time ?? t.entry_time).getTime();
}

export function sortByExit(trades: StatsTrade[]): StatsTrade[] {
  return [...trades].sort((a, b) => tradeTime(a) - tradeTime(b));
}

export function computeStats(
  trades: StatsTrade[],
  timezone: string,
  now: Date = new Date()
): DashboardStats {
  const sorted = sortByExit(trades);
  const n = sorted.length;
  const pnls = sorted.map((t) => t.pnl);

  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const grossProfit = wins.reduce((a, b) => a + b, 0);
  const grossLoss = losses.reduce((a, b) => a + b, 0); // negative
  const totalPnl = pnls.reduce((a, b) => a + b, 0);

  // max drawdown on running equity, peak starts at 0
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const p of pnls) {
    equity += p;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }

  // current streak: newest → oldest, matching sign of latest non-zero trade
  let streak: DashboardStats["streak"] = null;
  for (let i = n - 1; i >= 0; i--) {
    const p = pnls[i];
    if (p === 0) {
      if (streak) break;
      continue;
    }
    const type = p > 0 ? "win" : "loss";
    if (!streak) streak = { type, count: 1 };
    else if (streak.type === type) streak.count++;
    else break;
  }

  // weekly/monthly PnL in user timezone
  const weekKey = isoWeekKey(now, timezone);
  const monthKey = formatInTimeZone(now, timezone, "yyyy-MM");
  let weeklyPnl = 0;
  let monthlyPnl = 0;
  for (const t of sorted) {
    const d = new Date(t.exit_time ?? t.entry_time);
    if (isoWeekKey(d, timezone) === weekKey) weeklyPnl += t.pnl;
    if (formatInTimeZone(d, timezone, "yyyy-MM") === monthKey) monthlyPnl += t.pnl;
  }

  return {
    totalPnl,
    totalTrades: n,
    winRate: n ? wins.length / n : null,
    profitFactor: grossLoss < 0 ? grossProfit / Math.abs(grossLoss) : null,
    expectancy: n ? totalPnl / n : null,
    avgWin: wins.length ? grossProfit / wins.length : null,
    avgLoss: losses.length ? grossLoss / losses.length : null,
    largestWin: wins.length ? Math.max(...wins) : null,
    largestLoss: losses.length ? Math.min(...losses) : null,
    maxDrawdown,
    streak,
    weeklyPnl,
    monthlyPnl,
  };
}

function isoWeekKey(date: Date, timezone: string): string {
  // ISO week: shift to Thursday of the same week in user tz
  const local = formatInTimeZone(date, timezone, "yyyy-MM-dd");
  const [y, m, d] = local.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${week}`;
}

export interface EquityPoint {
  index: number;
  date: string;
  equity: number;
}

export function equityCurve(trades: StatsTrade[], timezone: string): EquityPoint[] {
  const sorted = sortByExit(trades);
  let equity = 0;
  return sorted.map((t, i) => {
    equity += t.pnl;
    return {
      index: i + 1,
      date: formatInTimeZone(new Date(t.exit_time ?? t.entry_time), timezone, "yyyy-MM-dd"),
      equity,
    };
  });
}

export interface DailyPnl {
  [date: string]: { pnl: number; count: number };
}

export function dailyPnl(trades: StatsTrade[], timezone: string): DailyPnl {
  const map: DailyPnl = {};
  for (const t of trades) {
    const key = formatInTimeZone(new Date(t.exit_time ?? t.entry_time), timezone, "yyyy-MM-dd");
    if (!map[key]) map[key] = { pnl: 0, count: 0 };
    map[key].pnl += t.pnl;
    map[key].count++;
  }
  return map;
}

export interface GroupPerformance {
  name: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
}

export interface MistakeInsight {
  name: string;
  count: number;
  lossCount: number;
  avgPnl: number;
  totalPnl: number;
}

export interface LearningInsights {
  setupPerformance: GroupPerformance[];
  strategyPerformance: GroupPerformance[];
  mistakeInsights: MistakeInsight[];
}

export interface RuleBreakInsight {
  name: string;
  count: number;
  lossCount: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
}

export interface StopDoingInsight {
  name: string;
  source: "Mistake" | "Rule";
  count: number;
  lossCount: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
}

function cleanLabel(value: string | null | undefined): string | null {
  const cleaned = value?.trim().replace(/\s+/g, " ");
  return cleaned || null;
}

function groupPerformance(
  trades: StatsTrade[],
  getLabel: (trade: StatsTrade) => string | null | undefined
): GroupPerformance[] {
  const groups = new Map<string, StatsTrade[]>();

  for (const trade of trades) {
    const label = cleanLabel(getLabel(trade));
    if (!label) continue;

    groups.set(label, [...(groups.get(label) ?? []), trade]);
  }

  return [...groups.entries()]
    .map(([name, group]) => {
      const wins = group.filter((trade) => trade.pnl > 0).length;
      const losses = group.filter((trade) => trade.pnl < 0).length;
      const totalPnl = group.reduce((sum, trade) => sum + trade.pnl, 0);

      return {
        name,
        trades: group.length,
        wins,
        losses,
        winRate: wins / group.length,
        totalPnl,
        avgPnl: totalPnl / group.length,
      };
    })
    .sort(
      (a, b) =>
        b.winRate - a.winRate ||
        b.trades - a.trades ||
        b.totalPnl - a.totalPnl ||
        a.name.localeCompare(b.name)
    );
}

function mistakeLabels(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(/[,;\n]/)
    .map((part) => cleanLabel(part))
    .filter((part): part is string => Boolean(part));
}

export function learningInsights(trades: StatsTrade[]): LearningInsights {
  const mistakeGroups = new Map<string, StatsTrade[]>();

  for (const trade of trades) {
    const mistakes = trade.mistake_tags?.length
      ? trade.mistake_tags
      : mistakeLabels(trade.mistakes);

    for (const mistake of mistakes) {
      mistakeGroups.set(mistake, [...(mistakeGroups.get(mistake) ?? []), trade]);
    }
  }

  return {
    setupPerformance: groupPerformance(trades, (trade) => trade.setup),
    strategyPerformance: groupPerformance(trades, (trade) => trade.strategy).sort(
      (a, b) =>
        b.wins - a.wins ||
        b.winRate - a.winRate ||
        b.totalPnl - a.totalPnl ||
        a.name.localeCompare(b.name)
    ),
    mistakeInsights: [...mistakeGroups.entries()]
      .map(([name, group]) => {
        const totalPnl = group.reduce((sum, trade) => sum + trade.pnl, 0);

        return {
          name,
          count: group.length,
          lossCount: group.filter((trade) => trade.pnl < 0).length,
          avgPnl: totalPnl / group.length,
          totalPnl,
        };
      })
      .sort(
        (a, b) =>
          b.count - a.count ||
          b.lossCount - a.lossCount ||
          a.avgPnl - b.avgPnl ||
          a.name.localeCompare(b.name)
      ),
  };
}

export function ruleBreakInsights(trades: StatsTrade[]): RuleBreakInsight[] {
  const groups = new Map<string, StatsTrade[]>();

  for (const trade of trades) {
    for (const rule of trade.rule_breaks ?? []) {
      const label = cleanLabel(rule);
      if (!label) continue;
      groups.set(label, [...(groups.get(label) ?? []), trade]);
    }
  }

  return [...groups.entries()]
    .map(([name, group]) => {
      const wins = group.filter((trade) => trade.pnl > 0).length;
      const lossCount = group.filter((trade) => trade.pnl < 0).length;
      const totalPnl = group.reduce((sum, trade) => sum + trade.pnl, 0);

      return {
        name,
        count: group.length,
        lossCount,
        winRate: wins / group.length,
        totalPnl,
        avgPnl: totalPnl / group.length,
      };
    })
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.totalPnl - b.totalPnl ||
        b.lossCount - a.lossCount ||
        a.name.localeCompare(b.name)
    );
}

export function stopDoingInsights(trades: StatsTrade[]): StopDoingInsight[] {
  const groups = new Map<string, { source: StopDoingInsight["source"]; trades: StatsTrade[] }>();

  for (const trade of trades) {
    const mistakes = trade.mistake_tags?.length
      ? trade.mistake_tags
      : mistakeLabels(trade.mistakes);

    for (const mistake of mistakes) {
      const label = cleanLabel(mistake);
      if (!label) continue;
      const key = `Mistake:${label}`;
      groups.set(key, {
        source: "Mistake",
        trades: [...(groups.get(key)?.trades ?? []), trade],
      });
    }

    for (const rule of trade.rule_breaks ?? []) {
      const label = cleanLabel(rule);
      if (!label) continue;
      const key = `Rule:${label}`;
      groups.set(key, {
        source: "Rule",
        trades: [...(groups.get(key)?.trades ?? []), trade],
      });
    }
  }

  return [...groups.entries()]
    .map(([key, value]) => {
      const name = key.split(":").slice(1).join(":");
      const wins = value.trades.filter((trade) => trade.pnl > 0).length;
      const lossCount = value.trades.filter((trade) => trade.pnl < 0).length;
      const totalPnl = value.trades.reduce((sum, trade) => sum + trade.pnl, 0);

      return {
        name,
        source: value.source,
        count: value.trades.length,
        lossCount,
        winRate: wins / value.trades.length,
        totalPnl,
        avgPnl: totalPnl / value.trades.length,
      };
    })
    .sort(
      (a, b) =>
        a.totalPnl - b.totalPnl ||
        b.lossCount - a.lossCount ||
        b.count - a.count ||
        a.name.localeCompare(b.name)
    );
}

export function weekTrades(
  trades: StatsTrade[],
  timezone: string,
  now: Date = new Date()
): StatsTrade[] {
  const currentWeek = isoWeekKey(now, timezone);
  return trades.filter((trade) => {
    const date = new Date(trade.exit_time ?? trade.entry_time);
    return isoWeekKey(date, timezone) === currentWeek;
  });
}
