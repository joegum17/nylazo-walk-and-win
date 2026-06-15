import { useEffect, useState } from "react";
import { pickBossFromWeather } from "@/lib/game/bosses";
import type { BossKey } from "@/lib/game/types";

interface WeatherData {
  tempC?: number;
  rain?: number;
  windKph?: number;
  snow?: number;
  pm25?: number;
  boss: BossKey;
  loaded: boolean;
}

export function useWeather(): WeatherData {
  const [data, setData] = useState<WeatherData>({
    boss: pickBossFromWeather({}),
    loaded: false,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setData((d) => ({ ...d, loaded: true }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m,snowfall&hourly=european_aqi_pm2_5&timezone=auto&forecast_days=1`;
          const r = await fetch(url);
          const j = await r.json();
          const c = j.current ?? {};
          const pm25 = j.hourly?.european_aqi_pm2_5?.[0] ?? 0;
          const w = {
            tempC: c.temperature_2m,
            rain: c.precipitation,
            windKph: c.wind_speed_10m,
            snow: c.snowfall,
            pm25,
          };
          setData({ ...w, boss: pickBossFromWeather(w), loaded: true });
        } catch {
          setData((d) => ({ ...d, loaded: true }));
        }
      },
      () => setData((d) => ({ ...d, loaded: true })),
      { timeout: 6000 },
    );
  }, []);

  return data;
}
