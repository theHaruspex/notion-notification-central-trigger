import { TIMEZONE } from './config';

export type Quarter = 1 | 2 | 3 | 4;

export interface TempoSlot {
  hour: number; // 0–23
  quarter: Quarter;
}

export interface ParsedTempo {
  slots: TempoSlot[];
}

/**
 * Parse a Tempo CSV string like "9.1, 14.3, 18.4" into structured slots.
 *
 * The format is strictly `hour.quarter` where:
 * - hour is 0–23
 * - quarter is 1–4
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

  const slots: TempoSlot[] = [];

  for (const entry of entries) {
    const match = /^(\d{1,2})\.(\d)$/.exec(entry);
    if (!match) {
      return null;
    }

    const hour = Number(match[1]);
    const quarterNum = Number(match[2]) as Quarter;

    if (hour < 0 || hour > 23) {
      return null;
    }
    if (![1, 2, 3, 4].includes(quarterNum)) {
      return null;
    }

    slots.push({ hour, quarter: quarterNum });
  }

  if (slots.length === 0) return null;

  return { slots };
}

export interface CurrentSlot extends TempoSlot {}

/**
 * Determine the current hour.quarter in the configured timezone.
 *
 * We assume the Lambda is triggered close to the beginning of a quarter-minute
 * (00, 15, 30, 45) by EventBridge.
 */
export function getCurrentSlot(timeZone: string = TIMEZONE): CurrentSlot {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0';
  const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '0';

  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  const quarterIndex = Math.floor(minute / 15);
  const quarter = (quarterIndex + 1) as Quarter; // 0–3 -> 1–4

  return { hour, quarter };
}

/**
 * Returns true if the given parsed tempo includes the provided current slot.
 */
export function isDueThisTick(tempo: ParsedTempo, current: CurrentSlot): boolean {
  return tempo.slots.some((slot) => slot.hour === current.hour && slot.quarter === current.quarter);
}


