import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import villageBg from "@/assets/village-bg.webp.asset.json";
import { Character } from "@/components/game/Character";
import { ItemRing } from "@/components/game/ItemRing";
import { DialogueBox } from "@/components/game/DialogueBox";
import { QuestBoard } from "@/components/game/QuestBoard";
import { useAuth } from "@/hooks/useAuth";
import { useSteps } from "@/hooks/useSteps";
import { useWeather } from "@/hooks/useWeather";
import { loadDay, loadPlayer, randomItem, saveDay, savePlayer, todayStr, freshDay } from "@/lib/game/storage";
import type { DayState, Gender, PlayerState } from "@/lib/game/types";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nylazo: No Lazy — เกมเดินสู้บอส" },
      { name: "description", content: "หน้าหลักหมู่บ้านไนลาโซ — ทำเควสต์ เก็บไอเทม แล้วเข้าตีบอส" },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const weather = useWeather();
  const [player, setPlayer] = useState<PlayerState>(() => loadPlayer());
  const [day, setDay] = useState<DayState>(() => loadDay(weather.boss));
  const { steps, setSteps, permission, request } = useSteps(day.steps);
  const [levelBurst, setLevelBurst] = useState(false);

  // Redirect to auth
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  // Sync weather boss into day state once weather resolves (only if no quests completed yet)
  useEffect(() => {
    if (!weather.loaded) return;
    setDay((d) => (d.weatherBoss === weather.boss ? d : { ...d, weatherBoss: weather.boss }));
  }, [weather.loaded, weather.boss]);

  // Persist
  useEffect(() => { saveDay({ ...day, steps }); }, [day, steps]);
  useEffect(() => { savePlayer(player); }, [player]);

  // Daily reset if date changed
  useEffect(() => {
    if (day.date !== todayStr()) {
      const fresh = freshDay(weather.boss);
      setDay(fresh);
      setSteps(0);
    }
  }, [day.date, weather.boss, setSteps]);

  const dialogueOpen = !day.dialogueSeen;
  const blocked = dialogueOpen || day.locked;

  function dismissDialogue() {
    setDay((d) => ({ ...d, dialogueSeen: true }));
  }

  function flip() {
    setPlayer((p) => ({ ...p, gender: p.gender === "boy" ? "girl" : ("boy" as Gender) }));
  }

  function completeQuest(id: string) {
    setDay((d) => {
      if (d.locked) return d;
      const updated = d.quests.map((q) => (q.id === id && !q.completed ? { ...q, completed: true } : q));
      const drop = randomItem();
      toast.success(`สำเร็จ! ได้รับไอเทม: ${drop}`);
      return { ...d, quests: updated, items: [...d.items, drop] };
    });
  }

  async function enterBoss() {
    const allDone = day.quests.filter((q) => q.completed).length >= 5;
    if (!allDone || day.bossDefeatedToday) return;
    nav({ to: "/battle" });
  }

  // Listen for win event from /battle (via storage)
  useEffect(() => {
    function onWin() {
      setDay((d) => {
        if (d.bossDefeatedToday) return d;
        return { ...d, bossDefeatedToday: true };
      });
      setPlayer((p) => {
        const newShields = p.shields + 1;
        const need = p.level;
        if (newShields >= need) {
          setLevelBurst(true);
          setTimeout(() => setLevelBurst(false), 1200);
          setDay((d) => ({ ...d, locked: true }));
          toast.success(`✨ Level Up! เลเวล ${p.level + 1}`);
          const next = { gender: p.gender, level: p.level + 1, shields: newShields - need };
          syncProfile(next, steps);
          return next;
        }
        const next = { ...p, shields: newShields };
        syncProfile(next, steps);
        return next;
      });
    }
    window.addEventListener("nylazo:boss-win", onWin);
    return () => window.removeEventListener("nylazo:boss-win", onWin);
  }, [steps]);

  async function syncProfile(p: PlayerState, totalSteps: number) {
    if (!user) return;
    try {
      await supabase.from("profiles").upsert({
        id: user.id,
        display_name:
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split("@")[0] ??
          "Traveler",
        level: p.level,
        shields: p.shields,
        total_steps: totalSteps,
      });
    } catch { /* non-fatal */ }
  }

  const ringSize = useMemo(() => 320, []);

  if (loading || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--parchment)]">
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(244,235,225,0.4) 0%, rgba(244,235,225,0.8) 60%, var(--parchment-deep) 100%), url(${villageBg.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
        fontFamily: "var(--font-thai)",
      }}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--parchment)]/85 px-4 py-2 backdrop-blur">
        <Link to="/" className="font-display text-lg font-extrabold tracking-wider">Nylazo</Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-[var(--moss)] px-3 py-1 font-bold text-[var(--parchment)]">
            ⚔️ Lv. {player.level}
          </span>
          <span className="rounded-full bg-[var(--wood)] px-3 py-1 font-bold text-[var(--parchment)]">
            🛡️ {player.shields}/{player.level}
          </span>
          <Link
            to="/leaderboard"
            className="rounded-full border border-[var(--border)] bg-white px-3 py-1 font-semibold"
          >
            🏆 อันดับ
          </Link>
          <button
            onClick={() => supabase.auth.signOut().then(() => nav({ to: "/auth" }))}
            className="rounded-full border border-[var(--border)] bg-white px-2 py-1"
            aria-label="ออกจากระบบ"
          >
            ออก
          </button>
        </div>
      </header>

      {/* Hero area */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-black tracking-wider">หมู่บ้าน Nylazo</h1>
          <p className="text-xs text-muted-foreground">
            {weather.loaded
              ? `อากาศ ${weather.tempC?.toFixed(0) ?? "?"}°C · บอสวันนี้: ${day.weatherBoss.toUpperCase()}`
              : "กำลังตรวจสภาพอากาศ..."}
          </p>
        </div>

        {/* Character + Ring */}
        <div className="relative my-4 grid place-items-center" style={{ height: ringSize + 20, width: ringSize + 20 }}>
          <ItemRing items={day.items} size={ringSize} />
          <Character gender={player.gender} onFlip={blocked ? undefined : flip} size={200} />
          {levelBurst && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-5xl animate-burst">
              ✨ LEVEL UP ✨
            </div>
          )}
        </div>

        {/* Step counter / permission */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-full bg-[var(--parchment)]/90 px-3 py-1 font-semibold shadow-sm">
            👣 ก้าววันนี้: <b>{steps}</b>
          </span>
          {permission === "prompt" && (
            <button
              type="button"
              onClick={request}
              className="rounded-full bg-[var(--moss)] px-3 py-1 font-bold text-[var(--parchment)]"
            >
              เปิดเซ็นเซอร์นับก้าว
            </button>
          )}
          {permission === "denied" && <span className="text-destructive">ไม่อนุญาตเซ็นเซอร์</span>}
          {permission === "unsupported" && <span>เบราว์เซอร์นี้ไม่รองรับเซ็นเซอร์</span>}
          {/* Manual +50 steps button for testing on desktop */}
          <button
            type="button"
            onClick={() => setSteps((s) => s + 50)}
            className="rounded-full border border-dashed border-[var(--border)] bg-white px-2 py-1 text-[10px] text-muted-foreground"
            disabled={blocked}
          >
            +50 ก้าว (ทดสอบ)
          </button>
        </div>

        {/* Quest board */}
        <div className="w-full pb-10">
          <QuestBoard
            day={day}
            boss={day.weatherBoss}
            onComplete={completeQuest}
            onEnterBoss={enterBoss}
            disabled={blocked}
          />
          {day.locked && (
            <p className="mt-3 text-center text-xs italic text-muted-foreground">
              🔒 วันนี้ผ่านการเลเวลอัปแล้ว เควสต์จะปลดล็อกอีกครั้งในวันถัดไป
            </p>
          )}
        </div>
      </section>

      {dialogueOpen && <DialogueBox onDone={dismissDialogue} />}
    </main>
  );
}
