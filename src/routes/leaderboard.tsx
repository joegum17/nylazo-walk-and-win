import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import villageBg from "@/assets/village-bg.webp.asset.json";

interface Row {
  id: string;
  display_name: string;
  level: number;
  shields: number;
  total_steps: number;
}

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "ลีดเดอร์บอร์ด — Nylazo: No Lazy" },
      { name: "description", content: "อันดับนักผจญภัยเลเวลสูงสุดในหมู่บ้านไนลาโซ 100 อันดับแรก" },
    ],
  }),
  component: Leaderboard,
});

function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, level, shields, total_steps")
        .order("level", { ascending: false })
        .order("shields", { ascending: false })
        .order("total_steps", { ascending: false })
        .limit(100);
      if (!error && data) setRows(data as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <main
      className="min-h-screen p-4"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(244,235,225,0.6), rgba(244,235,225,0.95)), url(${villageBg.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "var(--font-thai)",
      }}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center justify-between">
          <Link to="/" className="text-sm underline">← กลับหมู่บ้าน</Link>
          <h1 className="font-display text-2xl font-black">🏆 ลีดเดอร์บอร์ด</h1>
          <span />
        </div>

        <div className="wood-plank rounded-2xl p-3">
          <div className="rounded-xl bg-[oklch(0.94_0.025_80)] p-3">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">กำลังโหลดอันดับ...</p>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีนักผจญภัย</p>
            ) : (
              <ol className="divide-y divide-[var(--border)]">
                {rows.map((r, i) => {
                  const rank = i + 1;
                  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
                  return (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                      style={{ color: "var(--ink)" }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-10 text-center font-bold">{medal}</span>
                        <span className="truncate font-semibold">{r.display_name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-xs">
                        <span className="rounded-full bg-[var(--moss)] px-2 py-0.5 font-bold text-[var(--parchment)]">
                          Lv. {r.level}
                        </span>
                        <span className="text-muted-foreground">🛡️ {r.shields}</span>
                        <span className="text-muted-foreground">👣 {r.total_steps}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <p className="mt-3 text-center text-xs italic text-muted-foreground">
          เรียงจากเลเวลสูงสุดลงไปยังต่ำสุด (สูงสุด 100 อันดับ)
        </p>
      </div>
    </main>
  );
}
