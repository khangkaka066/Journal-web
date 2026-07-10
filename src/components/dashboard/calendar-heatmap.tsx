"use client";

import { useState } from "react";
import type { DailyPnl } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function cellColor(pnl: number, maxAbs: number): string {
  if (pnl === 0) return "bg-muted";
  const t = Math.min(Math.abs(pnl) / maxAbs, 1);
  const level = t > 0.66 ? 3 : t > 0.33 ? 2 : 1;
  if (pnl > 0)
    return ["bg-emerald-950", "bg-emerald-800", "bg-emerald-500"][level - 1];
  return ["bg-red-950", "bg-red-800", "bg-red-500"][level - 1];
}

export function CalendarHeatmap({ daily }: { daily: DailyPnl }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const first = new Date(month.y, month.m, 1);
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7; // Monday-based
  const maxAbs = Math.max(1, ...Object.values(daily).map((d) => Math.abs(d.pnl)));

  const cells: ({ date: string; day: number } | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      date: `${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
      day: i + 1,
    })),
  ];

  const label = first.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}
          >
            ←
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}
          >
            →
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-muted-foreground">
            {d}
          </div>
        ))}
        <TooltipProvider>
          {cells.map((c, i) =>
            c === null ? (
              <div key={`e${i}`} />
            ) : (
              <Tooltip key={c.date}>
                <TooltipTrigger
                  render={<div />}
                >
                  <div
                    className={`flex aspect-square items-center justify-center rounded text-[10px] ${
                      daily[c.date] ? cellColor(daily[c.date].pnl, maxAbs) : "bg-muted/40"
                    } ${daily[c.date] && Math.abs(daily[c.date].pnl) / maxAbs > 0.66 ? "text-background" : "text-muted-foreground"}`}
                  >
                    {c.day}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {daily[c.date]
                    ? `${c.date} · $${daily[c.date].pnl.toFixed(2)} · ${daily[c.date].count} trade${daily[c.date].count > 1 ? "s" : ""}`
                    : `${c.date} · no trades`}
                </TooltipContent>
              </Tooltip>
            )
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}
