"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/stats";

export function EquityCurve({ data }: { data: EquityPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No closed trades yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeOpacity={0.08} vertical={false} />
        <XAxis
          dataKey="index"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${v}`}
          width={64}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(i) => {
            const p = data[Number(i) - 1];
            return p ? `Trade #${i} · ${p.date}` : `Trade #${i}`;
          }}
          formatter={(v) => [`$${Number(v).toFixed(2)}`, "Equity"]}
        />
        <ReferenceLine y={0} stroke="#71717a" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="equity"
          stroke="#34d399"
          strokeWidth={2}
          fill="url(#equityFill)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
