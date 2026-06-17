import type { BossKey } from "./types";

export interface AccessoryDef {
  id: string;
  name: string;
  emoji: string;
  slot: "neck" | "ring" | "head";
  bonus: number; // flat damage bonus when equipped
  fromBoss: BossKey;
  flavor: string;
}

export const ACCESSORIES: Record<string, AccessoryDef> = {
  fire_amulet: {
    id: "fire_amulet",
    name: "สร้อยเปลวเพลิง",
    emoji: "🔥",
    slot: "neck",
    bonus: 12,
    fromBoss: "fire",
    flavor: "ตกผลึกจากเขี้ยวอสูรไฟ — อุ่นมือเมื่อต่อสู้",
  },
  wind_ring: {
    id: "wind_ring",
    name: "แหวนสายลม",
    emoji: "🌪️",
    slot: "ring",
    bonus: 10,
    fromBoss: "wind",
    flavor: "เบาเหมือนขนนก เร่งจังหวะการโจมตี",
  },
  cloud_earring: {
    id: "cloud_earring",
    name: "ต่างหูสายฝน",
    emoji: "💧",
    slot: "head",
    bonus: 9,
    fromBoss: "cloud",
    flavor: "หยาดน้ำค้างบรรจุพลังเมฆฝน",
  },
  slime_brooch: {
    id: "slime_brooch",
    name: "เข็มกลัดยาเขียว",
    emoji: "🧪",
    slot: "neck",
    bonus: 10,
    fromBoss: "slime",
    flavor: "กลั่นจากเมือกบอสสไลม์ — เผ็ดร้อนไม่กลัวเชื้อโรค",
  },
  ice_crown: {
    id: "ice_crown",
    name: "มงกุฎน้ำแข็ง",
    emoji: "❄️",
    slot: "head",
    bonus: 14,
    fromBoss: "ice",
    flavor: "เย็นจับใจ ทุกการตีติดเศษน้ำแข็ง",
  },
};

export function dropFromBoss(boss: BossKey): AccessoryDef {
  const list = Object.values(ACCESSORIES).filter((a) => a.fromBoss === boss);
  return list[Math.floor(Math.random() * list.length)] ?? ACCESSORIES.fire_amulet;
}
