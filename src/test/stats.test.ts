import { describe, it, expect } from "vitest";
import {
  computeStats,
  equityCurve,
  dailyPnl,
  learningInsights,
  ruleBreakInsights,
  stopDoingInsights,
  weekTrades,
} from "@/lib/stats";
import { computePnl, computeRMultiple } from "@/lib/pnl";
import { deriveSession } from "@/lib/sessions";
import { FIXTURE } from "./fixtures/trades";

const TZ = "America/New_York";
const NOW = new Date("2026-06-11T20:00:00Z");

describe("computeStats", () => {
  const s = computeStats(FIXTURE, TZ, NOW);

  it("totals", () => {
    expect(s.totalPnl).toBe(425);
    expect(s.totalTrades).toBe(10);
  });

  it("win rate = 5/10", () => {
    expect(s.winRate).toBeCloseTo(0.5);
  });

  it("profit factor = 700/275", () => {
    expect(s.profitFactor).toBeCloseTo(700 / 275);
  });

  it("expectancy = 42.5", () => {
    expect(s.expectancy).toBeCloseTo(42.5);
  });

  it("avg win 140, avg loss -55", () => {
    expect(s.avgWin).toBeCloseTo(140);
    expect(s.avgLoss).toBeCloseTo(-55);
  });

  it("largest win/loss", () => {
    expect(s.largestWin).toBe(300);
    expect(s.largestLoss).toBe(-100);
  });

  it("max drawdown", () => {
    // equity: 100,50,250,200,150,450,350,400,450,425 ; peak-to-trough max = 250-150=100
    expect(s.maxDrawdown).toBe(100);
  });

  it("current streak = 1 loss", () => {
    expect(s.streak).toEqual({ type: "loss", count: 1 });
  });

  it("weekly pnl = trades in ISO week of Jun 8-14 (-100+50+50-25 = -25)", () => {
    expect(s.weeklyPnl).toBe(-25);
  });

  it("monthly pnl = all June trades", () => {
    expect(s.monthlyPnl).toBe(425);
  });

  it("empty array → nulls/zeros, no NaN", () => {
    const e = computeStats([], TZ, NOW);
    expect(e.totalPnl).toBe(0);
    expect(e.winRate).toBeNull();
    expect(e.profitFactor).toBeNull();
    expect(e.expectancy).toBeNull();
    expect(e.avgWin).toBeNull();
    expect(e.avgLoss).toBeNull();
    expect(e.maxDrawdown).toBe(0);
    expect(e.streak).toBeNull();
    expect(Object.values(e).some((v) => typeof v === "number" && Number.isNaN(v))).toBe(false);
  });

  it("all winners → profitFactor null (no losses)", () => {
    const w = computeStats(
      [{ pnl: 10, entry_time: "2026-06-01T00:00:00Z", exit_time: "2026-06-01T01:00:00Z" }],
      TZ,
      NOW
    );
    expect(w.profitFactor).toBeNull();
    expect(w.streak).toEqual({ type: "win", count: 1 });
  });
});

describe("equityCurve", () => {
  it("cumulative and sorted", () => {
    const c = equityCurve(FIXTURE, TZ);
    expect(c[0].equity).toBe(100);
    expect(c[c.length - 1].equity).toBe(425);
    expect(c.length).toBe(10);
  });

  it("empty → []", () => {
    expect(equityCurve([], TZ)).toEqual([]);
  });
});

describe("dailyPnl", () => {
  it("groups same-day trades", () => {
    const d = dailyPnl(FIXTURE, TZ);
    expect(d["2026-06-01"]).toEqual({ pnl: 50, count: 2 });
    expect(d["2026-06-05"]).toEqual({ pnl: 300, count: 1 });
  });
});

describe("learningInsights", () => {
  const trades = [
    {
      pnl: 100,
      entry_time: "2026-06-01T14:00:00Z",
      exit_time: "2026-06-01T15:00:00Z",
      setup: "CISD",
      strategy: "NY AM",
      mistakes: "chased, late entry",
    },
    {
      pnl: -50,
      entry_time: "2026-06-02T14:00:00Z",
      exit_time: "2026-06-02T15:00:00Z",
      setup: "iFVG",
      strategy: "NY AM",
      mistakes: "chased",
    },
    {
      pnl: 150,
      entry_time: "2026-06-03T14:00:00Z",
      exit_time: "2026-06-03T15:00:00Z",
      setup: "CISD",
      strategy: "London continuation",
      mistakes: "",
    },
    {
      pnl: 75,
      entry_time: "2026-06-04T14:00:00Z",
      exit_time: "2026-06-04T15:00:00Z",
      setup: "iFVG",
      strategy: "NY AM",
      mistakes: "late entry",
    },
  ];

  it("ranks setup by winrate then sample size", () => {
    const insights = learningInsights(trades);
    expect(insights.setupPerformance[0]).toMatchObject({
      name: "CISD",
      trades: 2,
      wins: 2,
      winRate: 1,
      totalPnl: 250,
    });
  });

  it("ranks strategy by most wins", () => {
    const insights = learningInsights(trades);
    expect(insights.strategyPerformance[0].name).toBe("NY AM");
    expect(insights.strategyPerformance[0].wins).toBe(2);
    expect(insights.strategyPerformance[0].trades).toBe(3);
  });

  it("extracts repeated mistakes from comma/newline separated text", () => {
    const insights = learningInsights(trades);
    expect(insights.mistakeInsights[0]).toMatchObject({
      name: "Chased Entry",
      count: 2,
      lossCount: 1,
      totalPnl: 50,
    });
  });

  it("prefers structured mistake tags over free text", () => {
    const insights = learningInsights([
      {
        pnl: -25,
        entry_time: "2026-06-01T14:00:00Z",
        exit_time: "2026-06-01T15:00:00Z",
        mistakes: "messy text",
        mistake_tags: ["Moved stop"],
      },
    ]);
    expect(insights.mistakeInsights[0].name).toBe("Moved Stop");
  });

  it("summarizes rule breaker cost", () => {
    const rules = ruleBreakInsights([
      {
        pnl: -100,
        entry_time: "2026-06-01T14:00:00Z",
        exit_time: "2026-06-01T15:00:00Z",
        rule_breaks: ["No invalidation"],
      },
      {
        pnl: 50,
        entry_time: "2026-06-02T14:00:00Z",
        exit_time: "2026-06-02T15:00:00Z",
        rule_breaks: ["No invalidation"],
      },
    ]);
    expect(rules[0]).toMatchObject({
      name: "No Invalidation",
      count: 2,
      lossCount: 1,
      totalPnl: -50,
    });
  });

  it("prioritizes the costliest stop-doing behavior", () => {
    const stopDoing = stopDoingInsights([
      {
        pnl: -120,
        entry_time: "2026-06-01T14:00:00Z",
        exit_time: "2026-06-01T15:00:00Z",
        mistake_tags: ["Moved stop"],
        rule_breaks: ["No invalidation"],
      },
      {
        pnl: 20,
        entry_time: "2026-06-02T14:00:00Z",
        exit_time: "2026-06-02T15:00:00Z",
        mistake_tags: ["Moved stop"],
      },
      {
        pnl: -30,
        entry_time: "2026-06-03T14:00:00Z",
        exit_time: "2026-06-03T15:00:00Z",
        rule_breaks: ["Outside killzone"],
      },
    ]);

    expect(stopDoing[0]).toMatchObject({
      name: "No Invalidation",
      source: "Rule",
      totalPnl: -120,
    });
  });

  it("filters trades to the active week", () => {
    const weekly = weekTrades(FIXTURE, TZ, NOW);
    expect(weekly).toHaveLength(4);
    expect(weekly.reduce((sum, trade) => sum + trade.pnl, 0)).toBe(-25);
  });
});

describe("pnl", () => {
  it("NQ long 2pts x1 = $40", () => {
    expect(
      computePnl({ entryPrice: 20000, exitPrice: 20002, direction: "long", quantity: 1, pointValue: 20, fees: 0 })
    ).toBe(40);
  });

  it("short with fees", () => {
    expect(
      computePnl({ entryPrice: 5000, exitPrice: 4990, direction: "short", quantity: 2, pointValue: 50, fees: 8 })
    ).toBe(992);
  });

  it("r multiple", () => {
    expect(computeRMultiple(200, 100)).toBe(2);
    expect(computeRMultiple(200, null)).toBeNull();
    expect(computeRMultiple(200, 0)).toBeNull();
  });
});

describe("deriveSession (NY local time)", () => {
  it("09:30 NY = new_york", () => {
    expect(deriveSession("2026-06-01T13:30:00Z")).toBe("new_york"); // EDT = UTC-4
  });
  it("04:00 NY = london", () => {
    expect(deriveSession("2026-06-01T08:00:00Z")).toBe("london");
  });
  it("20:00 NY = asia", () => {
    expect(deriveSession("2026-06-02T00:00:00Z")).toBe("asia");
  });
});
