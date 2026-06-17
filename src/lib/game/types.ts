export type Gender = "boy" | "girl";
export type Item = "ดาบ" | "โล่" | "เปลือกกล้วย";
export type BossKey = "fire" | "wind" | "cloud" | "slime" | "ice";
export type Mode = "normal" | "hard";

export interface QuestState {
  id: string;
  completed: boolean;
  progress: number;
  startedAt?: number;
}

export interface DayState {
  date: string;
  mode: Mode;
  quests: QuestState[];
  items: Item[];
  steps: number;
  bossDefeatedToday: boolean;
  dialogueSeen: boolean; // legacy/per-day flag, kept for migration
  locked: boolean;
  weatherBoss: BossKey;
  variantBoss?: boolean;
}

export interface PlayerState {
  gender: Gender;
  level: number;
  shields: number;
  dialogueSeen?: boolean;       // global one-time intro dialogue
  accessories?: string[];        // owned accessory ids
  equipped?: string[];           // currently equipped accessory ids
}
