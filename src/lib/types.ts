export type Direction = "long" | "short";
export type Session = "asia" | "london" | "new_york";

export interface TradeChecklist {
  entryModels?: string[];
  context?: string[];
  confirmation?: string[];
  execution?: string[];
  review?: string[];
}

export interface Instrument {
  id: string;
  user_id: string | null;
  symbol: string;
  point_value: number;
  tick_size: number;
}

export interface Trade {
  id: string;
  user_id: string;
  instrument_id: string;
  direction: Direction;
  entry_price: number;
  exit_price: number;
  quantity: number;
  entry_time: string; // ISO UTC
  exit_time: string | null;
  fees: number;
  pnl: number;
  pnl_overridden: boolean;
  risk: number | null;
  r_multiple: number | null;
  session: Session | null;
  setup: string | null;
  strategy: string | null;
  confidence: number | null;
  emotion_before: string | null;
  emotion_after: string | null;
  mistakes: string | null;
  lessons: string | null;
  trade_checklist: TradeChecklist;
  tags: string[];
  screenshot_urls: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  instruments?: Pick<Instrument, "symbol" | "point_value">;
}

export interface Profile {
  id: string;
  timezone: string;
  base_currency: string;
}
