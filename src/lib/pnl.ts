import type { Direction } from "./types";

export function computePnl(params: {
  entryPrice: number;
  exitPrice: number;
  direction: Direction;
  quantity: number;
  pointValue: number;
  fees: number;
}): number {
  const { entryPrice, exitPrice, direction, quantity, pointValue, fees } = params;
  const sign = direction === "long" ? 1 : -1;
  return (exitPrice - entryPrice) * sign * quantity * pointValue - fees;
}

export function computeRMultiple(pnl: number, risk: number | null | undefined): number | null {
  if (risk == null || risk <= 0) return null;
  return pnl / risk;
}
