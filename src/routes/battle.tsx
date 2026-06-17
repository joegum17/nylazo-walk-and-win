import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BossArena } from "@/components/game/BossArena";
import { useAuth } from "@/hooks/useAuth";
import { loadDay, loadMode, loadPlayer, savePlayer, saveDay } from "@/lib/game/storage";
import type { DayState, PlayerState } from "@/lib/game/types";
import { ACCESSORIES, dropFromBoss } from "@/lib/game/accessories";
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
    const m = loadMode();
    setDay(loadDay("fire", m));
    setPlayer(loadPlayer());
  }, []);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  const equippedBonus = useMemo(() => {
    if (!player?.equipped?.length) return 0;
    return player.equipped.reduce((sum, id) => sum + (ACCESSORIES[id]?.bonus ?? 0), 0);
  }, [player]);

  if (!day || !player) {
    return <main className="grid min-h-screen place-items-center">กำลังเข้าสู่ฉากต่อสู้...</main>;
  }

  if (day.bossDefeatedToday || day.locked) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div className="parchment-panel rounded-2xl p-6">
          <div className="text-4xl">🏆</div>
          <p className="mt-2 font-semibold">วันนี้พิชิตบอสไปแล้ว</p>
          <p className="text-xs text-muted-foreground">กลับมาใหม่พรุ่งนี้ตอนเควสต์รีเฟรช</p>
          <button onClick={() => nav({ to: "/" })}
            className="mt-4 rounded-full bg-[var(--moss)] px-4 py-2 text-sm font-bold text-[var(--parchment)]">
            กลับหน้าหลัก
          </button>
        </div>
      </main>
    );
  }

  function handleWin() {
    if (!day || !player) return;
    // Drop exactly 1 accessory keyed to the boss
    const drop = dropFromBoss(day.weatherBoss);
    const ownedSet = new Set(player.accessories ?? []);
    const alreadyOwned = ownedSet.has(drop.id);
    ownedSet.add(drop.id);

    // Update + persist player (shield + possible level up)
    const newShields = player.shields + 1;
    const leveledUp = newShields >= player.level;
    const nextPlayer: PlayerState = {
      ...player,
      accessories: Array.from(ownedSet),
      equipped: player.equipped ?? [],
      shields: leveledUp ? newShields - player.level : newShields,
      level: leveledUp ? player.level + 1 : player.level,
    };
    savePlayer(nextPlayer);

    // Lock day regardless of level (one boss per day, then locked)
    const nextDay: DayState = { ...day, bossDefeatedToday: true, locked: true };
    saveDay(nextDay);

    toast.success(
      alreadyOwned
        ? `บอสดรอป ${drop.emoji} ${drop.name} (มีอยู่แล้ว)`
        : `ได้รับเครื่องประดับใหม่: ${drop.emoji} ${drop.name}!`,
    );
    if (leveledUp) toast.success(`✨ Level Up! เลเวล ${nextPlayer.level}`);

    setTimeout(() => nav({ to: "/" }), 900);
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
        variant={!!day.variantBoss}
        equippedBonus={equippedBonus}
        onWin={handleWin}
        onFlee={() => nav({ to: "/" })}
      />
    </main>
  );
}
