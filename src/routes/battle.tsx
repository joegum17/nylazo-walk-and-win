import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BossArena } from "@/components/game/BossArena";
import { useAuth } from "@/hooks/useAuth";
import { loadDay, loadPlayer } from "@/lib/game/storage";
import type { DayState, PlayerState } from "@/lib/game/types";
import villageBg from "@/assets/village-bg.webp.asset.json";

export const Route = createFileRoute("/battle")({
  head: () => ({
    meta: [
      { title: "ฉากต่อสู้บอส — Nylazo: No Lazy" },
      { name: "description", content: "ฟันบอสด้วยพลังจากจำนวนก้าวที่เดินจริงในวันนี้" },
    ],
  }),
  component: Battle,
});

function Battle() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [day, setDay] = useState<DayState | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDay(loadDay("fire"));
    setPlayer(loadPlayer());
  }, []);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  if (!day || !player) {
    return <main className="grid min-h-screen place-items-center">กำลังเข้าสู่ฉากต่อสู้...</main>;
  }

  // Block re-entry if already defeated today
  if (day.bossDefeatedToday) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div className="parchment-panel rounded-2xl p-6">
          <div className="text-4xl">🏆</div>
          <p className="mt-2 font-semibold">วันนี้พิชิตบอสไปแล้ว</p>
          <p className="text-xs text-muted-foreground">กลับมาใหม่พรุ่งนี้ตอนเควสต์รีเฟรช</p>
          <button
            onClick={() => nav({ to: "/" })}
            className="mt-4 rounded-full bg-[var(--moss)] px-4 py-2 text-sm font-bold text-[var(--parchment)]"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(244,235,225,0.5), rgba(244,235,225,0.85)), url(${villageBg.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "var(--font-thai)",
      }}
    >
      <BossArena
        boss={day.weatherBoss}
        gender={player.gender}
        steps={day.steps}
        onWin={() => {
          window.dispatchEvent(new CustomEvent("nylazo:boss-win"));
          // small delay so index page can update before redirect
          setTimeout(() => nav({ to: "/" }), 800);
        }}
        onFlee={() => nav({ to: "/" })}
      />
    </main>
  );
}
