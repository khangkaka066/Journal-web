import { toZonedTime } from "date-fns-tz";
import type { Session } from "./types";

// Sessions defined by New York local time:
// 18:00–03:00 asia, 03:00–09:30 london, 09:30–18:00 new_york
export function deriveSession(entryTime: Date | string): Session {
  const ny = toZonedTime(new Date(entryTime), "America/New_York");
  const minutes = ny.getHours() * 60 + ny.getMinutes();

  if (minutes >= 18 * 60 || minutes < 3 * 60) return "asia";
  if (minutes < 9 * 60 + 30) return "london";
  return "new_york";
}
