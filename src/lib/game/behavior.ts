// Player behavior tracking — dynamic quest scheduling based on login history.
//
// Rules:
// 1. Record account creation date (first run) to compute AccountAgeDays.
// 2. Log every login (timestamp + dayOfWeek + secondsAfterMidnight), keep last 14 days.
// 3. New-player safeguard: while AccountAgeDays <= 7, force default open hour (05:00).
// 4. From day 8+, compute average login time per weekday and open quests
//    1 hour BEFORE that average for the matching weekday.

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday … 6 = Saturday

export interface LoginEntry {
  ts: number;         // ms epoch
  dow: DayOfWeek;
  sec: number;        // seconds after local midnight
}

const ACCOUNT_KEY = "nylazo:accountCreated";   // ISO date string of first run
const LOG_KEY = "nylazo:loginLog";              // LoginEntry[]
const LAST_LOGIN_KEY = "nylazo:lastLoginDay";   // YYYY-MM-DD, to dedupe per-day logs

const MAX_LOG_DAYS = 14;
const DEFAULT_OPEN_HOUR = 5;       // 05:00 — fallback before day 8 or when no data
const NEW_PLAYER_GRACE_DAYS = 7;   // first week locked to default

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function secondsAfterMidnight(d = new Date()): number {
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

export function getAccountCreatedAt(): number {
  if (typeof window === "undefined") return Date.now();
  const raw = localStorage.getItem(ACCOUNT_KEY);
  if (raw) {
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) return t;
  }
  const now = Date.now();
  localStorage.setItem(ACCOUNT_KEY, new Date(now).toISOString());
  return now;
}

export function getAccountAgeDays(): number {
  const created = getAccountCreatedAt();
  const ms = Date.now() - created;
  return Math.max(1, Math.floor(ms / 86_400_000) + 1); // day 1 on the day of signup
}

export function isNewPlayer(): boolean {
  return getAccountAgeDays() <= NEW_PLAYER_GRACE_DAYS;
}

function loadLog(): LoginEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as LoginEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveLog(log: LoginEntry[]) {
  if (typeof window === "undefined") return;
  const cutoff = Date.now() - MAX_LOG_DAYS * 86_400_000;
  const trimmed = log.filter((e) => e.ts >= cutoff).slice(-MAX_LOG_DAYS * 4);
  localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
}

/** Record a login. Only one entry per local day (the first login of the day wins,
 *  matching "what time did the player arrive today"). */
export function recordLogin(now = new Date()): LoginEntry | null {
  if (typeof window === "undefined") return null;
  getAccountCreatedAt(); // ensure stamped
  const dayKey = todayKey();
  const last = localStorage.getItem(LAST_LOGIN_KEY);
  if (last === dayKey) return null;
  const entry: LoginEntry = {
    ts: now.getTime(),
    dow: now.getDay() as DayOfWeek,
    sec: secondsAfterMidnight(now),
  };
  const log = loadLog();
  log.push(entry);
  saveLog(log);
  localStorage.setItem(LAST_LOGIN_KEY, dayKey);
  return entry;
}

/** Average login time (seconds after midnight) for a given weekday,
 *  or null if no data exists for that weekday. */
export function getAverageLoginTime(dow: DayOfWeek): number | null {
  const entries = loadLog().filter((e) => e.dow === dow);
  if (entries.length === 0) return null;
  const sum = entries.reduce((acc, e) => acc + e.sec, 0);
  return Math.round(sum / entries.length);
}

/** Hour (0-23) at which today's quests should open.
 *  - First 7 days → DEFAULT_OPEN_HOUR (05:00)
 *  - Day 8+ → avg login hour for today's weekday minus 1 hour
 *  - No data for that weekday → DEFAULT_OPEN_HOUR */
export function getTodayQuestOpenHour(now = new Date()): number {
  if (isNewPlayer()) return DEFAULT_OPEN_HOUR;
  const avg = getAverageLoginTime(now.getDay() as DayOfWeek);
  if (avg == null) return DEFAULT_OPEN_HOUR;
  const avgHour = Math.floor(avg / 3600);
  const opens = avgHour - 1;
  if (opens < 0) return 0;
  if (opens > 23) return 23;
  return opens;
}

/** Convenience: are today's quests currently open according to dynamic schedule? */
export function isQuestOpenNow(now = new Date()): boolean {
  return now.getHours() >= getTodayQuestOpenHour(now);
}

export const BEHAVIOR_CONSTANTS = {
  DEFAULT_OPEN_HOUR,
  NEW_PLAYER_GRACE_DAYS,
  MAX_LOG_DAYS,
};
