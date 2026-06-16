import { useEffect, useMemo, useRef, useState } from "react";
import { BOSSES } from "@/lib/game/bosses";
import { Character } from "./Character";
import type { BossKey, Gender } from "@/lib/game/types";

interface Props {
  boss: BossKey;
  gender: Gender;
  steps: number;
  variant?: boolean;
  onWin: () => void;
  onFlee: () => void;
}

interface FloatDmg { id: number; value: number; x: number; }

// Secret/variant flavor by season — adds spice on top of the base 5 bosses.
function seasonalSecret() {
  const m = new Date().getMonth(); // 0-11
  if (m === 11 || m === 0 || m === 1) return { label: "เงาฤดูหนาวศักดิ์สิทธิ์", hue: 220, emoji: "🌨️" };
  if (m >= 2 && m <= 4) return { label: "ราชาดอกไม้บานพรั่ง", hue: 320, emoji: "🌸" };
  if (m >= 5 && m <= 7) return { label: "ปีศาจมรสุมเดือด", hue: 28, emoji: "☀️" };
  return { label: "ภูตเก็บเกี่ยวสีทอง", hue: 45, emoji: "🍂" };
}

export function BossArena({ boss, gender, steps, variant = false, onWin, onFlee }: Props) {
  const def = BOSSES[boss];
  const isVariant = variant;
  const secret = useMemo(() => seasonalSecret(), []);
  const hpMax = isVariant ? Math.floor(def.hp * 1.5) : def.hp;
  const [hp, setHp] = useState(hpMax);
  const [shake, setShake] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [floats, setFloats] = useState<FloatDmg[]>([]);
  const [won, setWon] = useState(false);
  const idRef = useRef(0);

  const damage = Math.max(25, Math.floor(30 + steps / 10));

  function attack() {
    if (won) return;
    setAttacking(true);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    setTimeout(() => setAttacking(false), 450);

    const dealt = damage + Math.floor(Math.random() * 15);
    setHp((h) => Math.max(0, h - dealt));
    const id = ++idRef.current;
    setFloats((arr) => [...arr, { id, value: dealt, x: 40 + Math.random() * 30 }]);
    setTimeout(() => setFloats((arr) => arr.filter((f) => f.id !== id)), 900);
  }

  useEffect(() => {
    if (hp === 0 && !won) {
      setWon(true);
      setTimeout(onWin, 1400);
    }
  }, [hp, won, onWin]);

  const hpPct = (hp / hpMax) * 100;

  const effectLayer = useMemo(() => {
    if (def.effect === "rain") {
      return Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="absolute w-[2px] rounded bg-sky-200/80"
          style={{ left: `${(i * 2.7) % 100}%`, height: 18, top: "-20px",
            animation: `rain-drop ${0.8 + Math.random() * 0.7}s linear ${Math.random() * 1.5}s infinite` }} />
      ));
    }
    if (def.effect === "snow") {
      return Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="absolute text-white"
          style={{ left: `${(i * 2.1) % 100}%`, top: "-20px", fontSize: 10 + Math.random() * 14,
            animation: `snow-drift ${4 + Math.random() * 3}s linear ${Math.random() * 3}s infinite` }}>❄</div>
      ));
    }
    if (def.effect === "ember") {
      return Array.from({ length: 25 }).map((_, i) => (
        <div key={i} className="absolute h-2 w-2 rounded-full bg-orange-400"
          style={{ left: `${(i * 4) % 100}%`, bottom: 0, boxShadow: "0 0 8px orange",
            animation: `ember-rise ${2 + Math.random() * 2}s ease-out ${Math.random() * 2}s infinite` }} />
      ));
    }
    if (def.effect === "wind") {
      return Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute h-[2px] w-12 rounded bg-white/70"
          style={{ left: `${Math.random() * 80}%`, top: `${10 + Math.random() * 80}%`,
            animation: `attack-dash ${0.8 + Math.random()}s ease-in-out ${Math.random()}s infinite` }} />
      ));
    }
    if (def.effect === "germ") {
      return Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="absolute h-3 w-3 rounded-full bg-lime-400/70"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, filter: "blur(1px)",
            animation: `float-y ${2 + Math.random() * 2}s ease-in-out infinite` }} />
      ));
    }
    return null;
  }, [def.effect]);

  const displayName = isVariant ? `${secret.emoji} ${def.name} — ${secret.label}` : def.name;
  const bossTint = isVariant ? `hue-rotate(${secret.hue}deg) saturate(1.4)` : undefined;

  return (
    <div className="relative flex min-h-[80vh] flex-col p-4">
      <div className="parchment-panel mx-auto w-full max-w-xl rounded-xl p-3">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-display font-bold">{displayName}</span>
          <span className="text-xs text-muted-foreground">HP {hp}/{hpMax}</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full border" style={{ background: "var(--muted)" }}>
          <div className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${hpPct}%`,
              background: hpPct > 50 ? "linear-gradient(90deg,#3a7d44,#5fad56)" : hpPct > 20 ? "linear-gradient(90deg,#c98a14,#e8a93d)" : "linear-gradient(90deg,#8b1e1e,#c23434)" }} />
        </div>
        <p className="mt-1 text-xs italic text-muted-foreground">
          "{def.tagline}"{isVariant && " ★ บอสลับประจำฤดู! HP +50%"}
        </p>
      </div>

      <div className="relative mx-auto mt-6 flex w-full max-w-2xl flex-1 items-end justify-between overflow-hidden rounded-2xl border-2 border-[var(--wood-deep)] p-4"
        style={{ minHeight: 360, background: "linear-gradient(180deg, oklch(0.84 0.07 200) 0%, oklch(0.86 0.08 130) 70%, oklch(0.55 0.10 100) 100%)" }}>
        {effectLayer}

        <div className={`relative z-10 ${attacking ? "animate-attack" : ""}`}>
          <Character gender={gender} size={140} />
          <div className="mt-1 text-center text-xs font-semibold" style={{ color: "var(--ink)" }}>คุณ</div>
        </div>

        <div className={`relative z-10 ${shake ? "animate-shake" : ""}`}>
          {!won ? (
            <>
              <img src={def.img} alt={displayName} width={180} height={180} draggable={false}
                style={{ width: 180, height: 180, objectFit: "contain",
                  filter: `drop-shadow(0 8px 12px rgba(0,0,0,0.35))${bossTint ? ` ${bossTint}` : ""}` }} />
              {isVariant && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                  ★ SECRET
                </div>
              )}
              {floats.map((f) => (
                <div key={f.id} className="pointer-events-none absolute text-2xl font-black"
                  style={{ left: `${f.x}%`, top: 30, color: "#fff",
                    textShadow: "0 0 6px #b91c1c, 0 2px 0 #000", animation: "dmg-pop 0.9s ease-out forwards" }}>
                  -{f.value}
                </div>
              ))}
            </>
          ) : (
            <div className="grid h-[180px] w-[180px] place-items-center animate-burst text-6xl">✨</div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-5 flex w-full max-w-xl items-center justify-between gap-3">
        <button type="button" onClick={onFlee}
          className="rounded-full border border-[var(--wood-deep)] bg-[var(--parchment-deep)] px-4 py-2 text-sm font-semibold">
          ← หนี
        </button>
        <button type="button" onClick={attack} disabled={won}
          className="flex-1 rounded-full py-3 font-display text-lg font-extrabold text-parchment shadow-lg disabled:opacity-50"
          style={{ background: "linear-gradient(180deg,#8b1e1e,#5a1010)", color: "var(--parchment)" }}>
          ⚔️ โจมตี! (พลัง {damage}+)
        </button>
      </div>

      {won && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50">
          <div className="parchment-panel animate-burst rounded-2xl p-6 text-center">
            <div className="text-5xl">🏆</div>
            <h3 className="mt-2 font-display text-2xl font-bold">ชนะแล้ว!</h3>
            <p className="text-sm text-muted-foreground">
              ได้รับ "โล่รางวัล" +1{isVariant && " · โบนัสบอสลับ ★"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
