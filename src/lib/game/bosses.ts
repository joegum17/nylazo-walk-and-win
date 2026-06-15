import fireImg from "@/assets/boss-fire.png";
import windImg from "@/assets/boss-wind.png";
import cloudImg from "@/assets/boss-cloud.png";
import slimeImg from "@/assets/boss-slime.png";
import iceImg from "@/assets/boss-ice.png";
import type { BossKey } from "./types";

export interface BossDef {
  key: BossKey;
  name: string;
  img: string;
  hp: number;
  effect: "ember" | "wind" | "rain" | "germ" | "snow";
  tagline: string;
}

export const BOSSES: Record<BossKey, BossDef> = {
  fire:  { key: "fire",  name: "อสูรไฟกวนโอ๊ย",  img: fireImg,  hp: 1500, effect: "ember", tagline: "แดดเมืองไทยยังต้องกราบ" },
  wind:  { key: "wind",  name: "ทอร์นาโดบ้าพลัง", img: windImg,  hp: 1500, effect: "wind",  tagline: "หลังคาบ้านปลิวหาย!" },
  cloud: { key: "cloud", name: "เมฆดราม่าน้ำตาท่วม", img: cloudImg, hp: 1500, effect: "rain",  tagline: "ผ้าที่ตากไม่เคยแห้ง" },
  slime: { key: "slime", name: "สไลม์เชื้อโรค",      img: slimeImg, hp: 1500, effect: "germ",  tagline: "เดินผ่านที่ไหนเน่าที่นั่น" },
  ice:   { key: "ice",   name: "อสูรน้ำแข็งสะท้าน",   img: iceImg,   hp: 1500, effect: "snow",  tagline: "แช่แข็งทั้งหมู่บ้าน" },
};

export function pickBossFromWeather(opts: {
  tempC?: number;
  rain?: number;
  windKph?: number;
  snow?: number;
  pm25?: number;
}): BossKey {
  const { tempC = 28, rain = 0, windKph = 0, snow = 0, pm25 = 0 } = opts;
  if (snow > 0 || tempC < 5) return "ice";
  if (rain > 0.5) return "cloud";
  if (windKph > 30) return "wind";
  if (pm25 > 50) return "slime";
  if (tempC > 32) return "fire";
  // default rotation by weekday
  const order: BossKey[] = ["fire", "wind", "cloud", "slime", "ice"];
  return order[new Date().getDay() % 5];
}
