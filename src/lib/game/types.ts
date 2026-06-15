export type Gender = "boy" | "girl";
export type Item = "ดาบ" | "โล่" | "เปลือกกล้วย";
export type BossKey = "fire" | "wind" | "cloud" | "slime" | "ice";

export interface QuestState {
  id: string;
  completed: boolean;
  progress: number; // for step quests
}

export interface DayState {
  date: string; // YYYY-MM-DD
  quests: QuestState[];
  items: Item[];
  steps: number;
  bossDefeatedToday: boolean;
  dialogueSeen: boolean;
  locked: boolean; // locked after level up
  weatherBoss: BossKey;
}

export interface PlayerState {
  gender: Gender;
  level: number;
  shields: number;
}
