export type Gender = "boy" | "girl";
export type Item = "ดาบ" | "โล่" | "เปลือกกล้วย";
export type BossKey = "fire" | "wind" | "cloud" | "slime" | "ice";
export type Mode = "normal" | "hard";

export interface QuestState {
  id: string;
  completed: boolean;
  progress: number;
  startedAt?: number; // ms epoch — for hard-mode fluid expiration
}

export interface DayState {
  date: string;
  mode: Mode;
  quests: QuestState[];
  items: Item[];
  steps: number;
  bossDefeatedToday: boolean;
  dialogueSeen: boolean;
  locked: boolean;
  weatherBoss: BossKey;
  variantBoss?: boolean; // secret/variant rolled for the boss fight
}

export interface PlayerState {
  gender: Gender;
  level: number;
  shields: number;
}
