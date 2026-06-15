import type { BossKey } from "./types";

export interface QuestDef {
  id: string;
  title: string;
  detail: string;
  opensAt: number; // hour 0-23
  type: "steps" | "checkin" | "special";
  target?: number;
}

export const BASE_QUESTS: QuestDef[] = [
  { id: "am_walk", title: "เดินรอบเช้า (AM Walk)", detail: "เดินอย่างน้อย 300 ก้าว", opensAt: 9, type: "steps", target: 300 },
  { id: "pm_walk", title: "เดินรอบบ่าย (PM Walk)", detail: "เดินอย่างน้อย 300 ก้าว", opensAt: 13, type: "steps", target: 300 },
  { id: "am_fluid", title: "ดื่มน้ำรอบเช้า (AM Fluid)", detail: "ดื่มน้ำให้สดชื่นแล้วเช็คอิน", opensAt: 7, type: "checkin" },
  { id: "pm_fluid", title: "ดื่มน้ำรอบบ่าย (PM Fluid)", detail: "ดื่มน้ำให้สดชื่นแล้วเช็คอิน", opensAt: 15, type: "checkin" },
];

export interface SpecialQuest {
  id: string;
  title: string;
  detail: string;
}

export function specialQuestFor(boss: BossKey): SpecialQuest {
  switch (boss) {
    case "cloud":
      return { id: "special_umbrella", title: "พกร่มมารึยัง?", detail: "ฝนตกเตรียมร่มแล้วเช็คอิน" };
    case "fire":
      return { id: "special_hydrate", title: "ดื่มน้ำดับร้อน!", detail: "อากาศร้อนจัด ดื่มน้ำเย็นสักแก้วแล้วเช็คอิน" };
    case "slime":
      return { id: "special_mask", title: "หาแมสมาใส่!", detail: "ฝุ่นเยอะ/เชื้อโรคชุก ใส่หน้ากากแล้วเช็คอิน" };
    case "ice":
      return { id: "special_warm", title: "หาอุปกรณ์เพิ่มความอบอุ่น", detail: "หาผ้าห่ม/เสื้อกันหนาวแล้วเช็คอิน" };
    case "wind":
      return { id: "special_secure", title: "เก็บของให้แน่นหนา", detail: "พายุแรง เก็บข้าวของกันปลิวแล้วเช็คอิน" };
  }
}
