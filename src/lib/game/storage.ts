import type { DayState, Item, PlayerState, BossKey, Mode } from "./types";
import { questsFor } from "./quests";

const PLAYER_KEY = "nylazo:player";
const MODE_KEY = "nylazo:mode";
const dayKey = (m: Mode) => `nylazo:day:${m}`;

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function loadPlayer(): PlayerState {
  if (typeof window === "undefined") return { gender: "boy", level: 1, shields: 0 };
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { gender: "boy", level: 1, shields: 0 };
}

export function savePlayer(p: PlayerState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYER_KEY, JSON.stringify(p));
}

export function loadMode(): Mode {
  if (typeof window === "undefined") return "normal";
  const m = localStorage.getItem(MODE_KEY);
  return m === "hard" ? "hard" : "normal";
}

export function saveMode(m: Mode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODE_KEY, m);
}

export function freshDay(boss: BossKey, mode: Mode): DayState {
  const defs = questsFor(mode);
  return {
    date: todayStr(),
    mode,
    quests: [
      ...defs.map((q) => ({ id: q.id, completed: false, progress: 0 })),
      { id: "special", completed: false, progress: 0 },
    ],
    items: [],
    steps: 0,
    bossDefeatedToday: false,
    dialogueSeen: false,
    locked: false,
    weatherBoss: boss,
  };
}

export function loadDay(boss: BossKey, mode: Mode): DayState {
  if (typeof window === "undefined") return freshDay(boss, mode);
  try {
    const raw = localStorage.getItem(dayKey(mode));
    if (raw) {
      const parsed: DayState = JSON.parse(raw);
      if (parsed.date === todayStr()) return { ...parsed, mode };
    }
  } catch { /* ignore */ }
  const d = freshDay(boss, mode);
  localStorage.setItem(dayKey(mode), JSON.stringify(d));
  return d;
}

export function saveDay(d: DayState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(dayKey(d.mode), JSON.stringify(d));
}

export function randomItem(): Item {
  const arr: Item[] = ["ดาบ", "โล่", "เปลือกกล้วย"];
  return arr[Math.floor(Math.random() * arr.length)];
}

export function msUntilMidnight(): number {
  const now = new Date();
  const mid = new Date(now);
  mid.setHours(24, 0, 0, 0);
  return mid.getTime() - now.getTime();
}
