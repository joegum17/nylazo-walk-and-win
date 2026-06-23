import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import villageBg from "@/assets/village-bg.webp.asset.json";
import { Character } from "@/components/game/Character";
import { ItemRing } from "@/components/game/ItemRing";
import { DialogueBox } from "@/components/game/DialogueBox";
import { QuestBoard } from "@/components/game/QuestBoard";
import { useAuth } from "@/hooks/useAuth";
import { useSteps } from "@/hooks/useSteps";
import { useWeather } from "@/hooks/useWeather";
import {
  loadDay, loadPlayer, randomItem, saveDay, savePlayer, todayStr, freshDay,
  loadMode, saveMode,
} from "@/lib/game/storage";
import type { DayState, Gender, Mode, PlayerState } from "@/lib/game/types";
import { ACCESSORIES } from "@/lib/game/accessories";
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

const MAX_EQUIPPED = 3;

function Home() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const weather = useWeather();
  const [mode, setMode] = useState<Mode>(() => loadMode());
  const [player, setPlayer] = useState<PlayerState>(() => loadPlayer());
  const [day, setDay] = useState<DayState>(() => loadDay(weather.boss, mode));
  const { steps, setSteps, permission, request } = useSteps(day.steps);
  const [devOpen, setDevOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const logoTapsRef = useRef<{ count: number; last: number }>({ count: 0, last: 0 });

  // Real-time sync: keep day.steps in lockstep with the live pedometer counter
  // so QuestBoard's progress bar + "เก็บรางวัล" gating react immediately.
  useEffect(() => {
    setDay((d) => (d.steps === steps ? d : { ...d, steps }));
  }, [steps]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  // Reload day state when mode switches (separate inventories per mode).
  // Dialogue is global (player.dialogueSeen) so it will NOT replay on mode switch.
  useEffect(() => {
    saveMode(mode);
    const d = loadDay(weather.boss, mode);
    setDay(d);
    setSteps(d.steps);
  }, [mode, weather.boss, setSteps]);

  useEffect(() => {
    if (!weather.loaded) return;
    setDay((d) => (d.weatherBoss === weather.boss ? d : { ...d, weatherBoss: weather.boss }));
  }, [weather.loaded, weather.boss]);

  useEffect(() => { saveDay({ ...day, steps }); }, [day, steps]);
  useEffect(() => { savePlayer(player); syncProfile(player, steps); }, [player, steps]);

  useEffect(() => {
    if (day.date !== todayStr()) {
      const fresh = freshDay(weather.boss, mode);
      setDay(fresh);
      setSteps(0);
    }
  }, [day.date, weather.boss, mode, setSteps]);

  const dialogueOpen = !player.dialogueSeen;
  const blocked = dialogueOpen || day.locked || day.bossDefeatedToday;

  function dismissDialogue() {
    setPlayer((p) => ({ ...p, dialogueSeen: true }));
  }

  function flip() {
    setPlayer((p) => ({ ...p, gender: p.gender === "boy" ? "girl" : ("boy" as Gender) }));
  }

  function startQuestTimer(id: string) {
    setDay((d) => ({
      ...d,
      quests: d.quests.map((q) => (q.id === id && !q.startedAt ? { ...q, startedAt: Date.now() } : q)),
    }));
    toast.message("⏱️ เริ่มจับเวลาเควสต์แล้ว!");
  }

  function completeQuest(id: string) {
    setDay((d) => {
      if (d.locked || d.bossDefeatedToday) return d;
      const updated = d.quests.map((q) => (q.id === id && !q.completed ? { ...q, completed: true } : q));
      const drop = randomItem();
      toast.success(`สำเร็จ! ได้รับไอเทม: ${drop}`);
      return { ...d, quests: updated, items: [...d.items, drop] };
    });
  }

  function devForceCompleteAll() {
    setDay((d) => {
      if (d.locked || d.bossDefeatedToday) return d;
      const updated = d.quests.map((q) => ({ ...q, completed: true }));
      const drops = Array.from({ length: 5 }).map(() => randomItem());
      toast.success(`🛠️ DEV: ปลดล็อกครบ 5 เควสต์! รับไอเทม ${drops.join(", ")}`);
      return { ...d, quests: updated, items: [...d.items, ...drops] };
    });
  }

  function tapLogo() {
    const now = Date.now();
    const r = logoTapsRef.current;
    if (now - r.last > 800) r.count = 0;
    r.last = now;
    r.count += 1;
    if (r.count >= 5) {
      r.count = 0;
      setDevOpen(true);
      toast.message("🛠️ Developer Debug Menu เปิดแล้ว");
    }
  }

  async function enterBoss() {
    const allDone = day.quests.filter((q) => q.completed).length >= 5;
    if (!allDone || day.bossDefeatedToday || day.locked) return;
    const variant = Math.random() < 0.15;
    const next = { ...day, steps, variantBoss: variant };
    setDay(next);
    saveDay(next);
    nav({ to: "/battle" });
  }

  function toggleEquip(id: string) {
    setPlayer((p) => {
      const eq = new Set(p.equipped ?? []);
      if (eq.has(id)) {
        eq.delete(id);
      } else {
        if (eq.size >= MAX_EQUIPPED) {
          toast.error(`สวมใส่ได้สูงสุด ${MAX_EQUIPPED} ชิ้น`);
          return p;
        }
        eq.add(id);
      }
      return { ...p, equipped: Array.from(eq) };
    });
  }

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
  const owned = player.accessories ?? [];
  const equipped = new Set(player.equipped ?? []);
  const equippedBonus = (player.equipped ?? []).reduce(
    (s, id) => s + (ACCESSORIES[id]?.bonus ?? 0), 0,
  );

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
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--parchment)]/85 px-4 py-2 backdrop-blur">
        <button
          type="button"
          onClick={tapLogo}
          className="font-display text-lg font-extrabold tracking-wider"
          aria-label="โลโก้เกม (แตะ 5 ครั้งเพื่อเปิดโหมดผู้พัฒนา)"
          title="แตะ 5 ครั้งเพื่อเปิดโหมดผู้พัฒนา"
        >
          Nylazo
        </button>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-[var(--moss)] px-3 py-1 font-bold text-[var(--parchment)]">
            ⚔️ Lv. {player.level}
          </span>
          <span className="rounded-full bg-[var(--wood)] px-3 py-1 font-bold text-[var(--parchment)]">
            🛡️ {player.shields}/{player.level}
          </span>
          <Link to="/leaderboard" className="rounded-full border border-[var(--border)] bg-white px-3 py-1 font-semibold">
            🏆 อันดับ
          </Link>
          <Link to="/credits" className="rounded-full border border-[var(--border)] bg-white px-3 py-1 font-semibold">
            📜 เครดิต
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

      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-black tracking-wider">หมู่บ้าน Nylazo</h1>
          <p className="text-xs text-muted-foreground">
            {weather.loaded
              ? `อากาศ ${weather.tempC?.toFixed(0) ?? "?"}°C · บอสวันนี้: ${day.weatherBoss.toUpperCase()}`
              : "กำลังตรวจสภาพอากาศ..."}
          </p>
        </div>

        <div className="mt-3 inline-flex overflow-hidden rounded-full border border-[var(--wood-deep)] bg-white shadow-sm">
          {(["normal", "hard"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="px-4 py-1.5 text-xs font-bold transition"
              style={{
                background: mode === m ? "var(--wood-deep)" : "transparent",
                color: mode === m ? "var(--parchment)" : "var(--ink)",
              }}
            >
              {m === "normal" ? "🌿 Normal" : "🔥 Hard"}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          กระเป๋าไอเทมโหมด Normal และ Hard แยกขาดจากกัน
        </p>

        <div className="relative my-4 grid place-items-center" style={{ height: ringSize + 20, width: ringSize + 20 }}>
          <ItemRing items={day.items} size={ringSize} />
          <Character gender={player.gender} onFlip={blocked ? undefined : flip} size={200} />
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-full bg-[var(--parchment)]/90 px-3 py-1 font-semibold shadow-sm">
            👣 ก้าววันนี้: <b>{steps}</b>
          </span>
          {permission === "prompt" && (
            <button type="button" onClick={request}
              className="rounded-full bg-[var(--moss)] px-3 py-1 font-bold text-[var(--parchment)]">
              เปิดเซ็นเซอร์นับก้าว
            </button>
          )}
          {permission === "denied" && <span className="text-destructive">ไม่อนุญาตเซ็นเซอร์</span>}
          {permission === "unsupported" && <span>เบราว์เซอร์นี้ไม่รองรับเซ็นเซอร์</span>}
          <button type="button" onClick={() => setSteps((s) => s + 50)}
            className="rounded-full border border-dashed border-[var(--border)] bg-white px-2 py-1 text-[10px] text-muted-foreground"
            disabled={blocked}>
            +50 ก้าว (ทดสอบ)
          </button>
        </div>

        <div className="w-full pb-6">
          <QuestBoard
            day={day}
            boss={day.weatherBoss}
            onComplete={completeQuest}
            onStart={startQuestTimer}
            onEnterBoss={enterBoss}
            disabled={blocked}
          />
          {(day.locked || day.bossDefeatedToday) && (
            <p className="mt-3 text-center text-xs italic text-muted-foreground">
              🔒 วันนี้พิชิตบอสไปแล้ว — เควสต์และการตีบอสจะปลดล็อกอีกครั้งในวันถัดไป
            </p>
          )}
        </div>

        {/* Equipment / Accessories panel */}
        <div className="mb-10 w-full parchment-panel rounded-2xl p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="font-display text-lg font-bold">💍 เครื่องประดับ</h3>
            <span className="text-xs text-muted-foreground">
              สวม {equipped.size}/{MAX_EQUIPPED} · โบนัสรวม +{equippedBonus} พลังตี
            </span>
          </div>
          {owned.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              ยังไม่มีเครื่องประดับ — พิชิตบอสเพื่อรับ 1 ชิ้นต่อวัน
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {owned.map((id) => {
                const a = ACCESSORIES[id];
                if (!a) return null;
                const isOn = equipped.has(id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white/70 p-3"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--parchment-deep)] text-2xl">
                      {a.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold leading-tight">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        +{a.bonus} ดาเมจ · ช่อง {a.slot}
                      </div>
                      <div className="truncate text-[11px] italic text-muted-foreground">{a.flavor}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleEquip(id)}
                      className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold shadow"
                      style={{
                        background: isOn ? "var(--wood-deep)" : "var(--moss)",
                        color: "var(--parchment)",
                      }}
                    >
                      {isOn ? "ถอด" : "สวมใส่"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {dialogueOpen && <DialogueBox onDone={dismissDialogue} />}

      {/* Developer Debug Menu */}
      {devOpen && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setDevOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border-2 border-yellow-500 bg-black/90 p-5 text-yellow-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "ui-monospace, 'SF Mono', monospace" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">🛠️ DEV DEBUG MENU</h2>
              <button onClick={() => setDevOpen(false)} className="rounded bg-yellow-500/20 px-2 text-sm">✕</button>
            </div>
            <p className="mb-3 text-xs opacity-80">โหมดทดลองสำหรับนักพัฒนาเท่านั้น</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => { devForceCompleteAll(); setDevOpen(false); }}
                className="w-full rounded-lg bg-yellow-500 px-3 py-2 text-sm font-bold text-black hover:bg-yellow-400"
              >
                ⚡ Force Complete All Quests (5/5)
              </button>
              <button
                type="button"
                onClick={() => { setSteps((s) => s + 2000); setDevOpen(false); toast.message("🛠️ +2000 steps"); }}
                className="w-full rounded-lg border border-yellow-500 px-3 py-2 text-sm font-semibold"
              >
                +2,000 ก้าว
              </button>
              <button
                type="button"
                onClick={() => { setPlayer((p) => ({ ...p, level: p.level + 1, shields: 0 })); setDevOpen(false); toast.message("🛠️ Level +1"); }}
                className="w-full rounded-lg border border-yellow-500 px-3 py-2 text-sm font-semibold"
              >
                +1 Level
              </button>
              <button
                type="button"
                onClick={() => { setPlayer((p) => ({ ...p, dialogueSeen: false })); setDevOpen(false); toast.message("🛠️ รีเซ็ตบทสนทนา"); }}
                className="w-full rounded-lg border border-yellow-500 px-3 py-2 text-sm font-semibold"
              >
                💬 เล่นบทสนทนาอีกครั้ง
              </button>
              <button
                type="button"
                onClick={() => {
                  const fresh = freshDay(weather.boss, mode);
                  setDay(fresh);
                  setSteps(0);
                  setDevOpen(false);
                  toast.message("🛠️ รีเซ็ตวันใหม่");
                }}
                className="w-full rounded-lg border border-yellow-500 px-3 py-2 text-sm font-semibold"
              >
                ♻️ Reset Today (mode: {mode})
              </button>
            </div>
            <p className="mt-3 text-[10px] opacity-60">เคล็ดลับ: แตะโลโก้ "Nylazo" 5 ครั้งติดเพื่อเปิดเมนูนี้</p>
          </div>
        </div>
      )}
    </main>
  );
}
