import { TIMEZONE } from './config';

export type Quarter = 1 | 2 | 3 | 4;

export interface TempoTick {
  weekday: number; // 1–7 (Mon=1 ... Sun=7) to match Notion's formatDate(..., "d")
  hour: number; // 0–23
  quarter: Quarter;
}

export interface ParsedTempo {
  ticks: TempoTick[];
}

/**
 * Parse a Tempo CSV string like "1.11.2, 3.9.1" into structured ticks.
 *
 * The format is strictly `weekday.hour.quarter` where:
 * - weekday is 1–7 (Mon=1 ... Sun=7)
 * - hour is 0–23
 * - quarter is 1–4 (15-minute blocks)
 *
 * If any entry is malformed or out of range, we treat the entire Tempo as invalid
 * and return null so that callers can no-op for that notification.
 */
export function parseTempo(raw: string | null | undefined): ParsedTempo | null {
  if (!raw) return null;

  const entries = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (entries.length === 0) return null;

  const ticks: TempoTick[] = [];

  for (const entry of entries) {
    const match = /^(\d{1,2})\.(\d{1,2})\.(\d)$/.exec(entry);
    if (!match) {
      return null;
    }

    const weekday = Number(match[1]);
    const hour = Number(match[2]);
    const quarterNum = Number(match[3]) as Quarter;

    if (weekday < 1 || weekday > 7) {
      return null;
    }
    if (hour < 0 || hour > 23) {
      return null;
    }
    if (![1, 2, 3, 4].includes(quarterNum)) {
      return null;
    }

    ticks.push({ weekday, hour, quarter: quarterNum });
  }

  if (ticks.length === 0) return null;

  return { ticks };
}

/**
 * Compute the "current tick" in the configured timezone.
 *
 * This mirrors the Notion formula logic:
 * - weekday: 1–7 (Mon=1 ... Sun=7)
 * - hour: 0–23
 * - quarter: 1–4 (15-minute buckets)
 */
export function getCurrentTick(timeZone: string = TIMEZONE): TempoTick {
  const now = new Date();

  // Derive the local time in the target timezone using toLocaleString.
  const localeString = now.toLocaleString('en-US', { timeZone });
  const zoned = new Date(localeString);

  const jsWeekday = zoned.getDay(); // 0–6, Sun=0
  const weekday = ((jsWeekday + 6) % 7) + 1; // 1–7, Mon=1

  const hour = zoned.getHours();
  const minute = zoned.getMinutes();

  let quarter: Quarter;
  if (minute < 15) quarter = 1;
  else if (minute < 30) quarter = 2;
  else if (minute < 45) quarter = 3;
  else quarter = 4;

  return { weekday, hour, quarter };
}

/**
 * Returns true if the given parsed tempo includes the provided current tick.
 */
export function isDueThisTick(tempo: ParsedTempo, current: TempoTick): boolean {
  return tempo.ticks.some(
    (tick) =>
      tick.weekday === current.weekday &&
      tick.hour === current.hour &&
      tick.quarter === current.quarter
  );
}


