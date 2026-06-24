import type { BossKey } from "./types";

export type AccessorySlot = "eyes" | "body" | "head";

export interface AccessoryDef {
  id: string;
  name: string;
  emoji: string;
  slot: AccessorySlot;
  bonus: number;
  fromBoss: BossKey;
  flavor: string;
}

export const ACCESSORIES: Record<string, AccessoryDef> = {
  sunglasses: {
    id: "sunglasses",
    name: "แว่นกันแดด",
    emoji: "🕶️",
    slot: "eyes",
    bonus: 12,
    fromBoss: "fire",
    flavor: "บังแดดอสูรไฟ — มองทะลุเปลวเพลิงได้",
  },
  raincoat: {
    id: "raincoat",
    name: "เสื้อกันฝน",
    emoji: "🧥",
    slot: "body",
    bonus: 10,
    fromBoss: "cloud",
    flavor: "กันฝนเมฆดราม่า ไม่เปียกไม่หนาว",
  },
  pink_bow: {
    id: "pink_bow",
    name: "โบว์สีชมพู",
    emoji: "🎀",
    slot: "head",
    bonus: 9,
    fromBoss: "slime",
    flavor: "ผูกบนหัวฝั่งขวา เพิ่มเสน่ห์ +∞",
  },
};

// Map each boss to a guaranteed accessory drop (5 bosses → 3 items, repeats OK).
const BOSS_DROP: Record<BossKey, string> = {
  fire: "sunglasses",
  ice: "sunglasses",
  cloud: "raincoat",
  wind: "raincoat",
  slime: "pink_bow",
};

export function dropFromBoss(boss: BossKey): AccessoryDef {
  return ACCESSORIES[BOSS_DROP[boss]] ?? ACCESSORIES.sunglasses;
}
