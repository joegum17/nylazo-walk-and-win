import { useEffect, useMemo, useRef, useState } from "react";
import { BOSSES } from "@/lib/game/bosses";
import { Character } from "./Character";
import type { BossKey, Gender } from "@/lib/game/types";

interface Props {
  boss: BossKey;
  gender: Gender;
  steps: number;
  variant?: boolean;
  equippedBonus?: number;
  equipped?: string[];
  onWin: () => void;
  onFlee: () => void;
}

interface FloatDmg { id: number; value: number; x: number; color: string; }

function seasonalSecret() {
  const m = new Date().getMonth();
  if (m === 11 || m === 0 || m === 1) return { label: "เงาฤดูหนาวศักดิ์สิทธิ์", hue: 220, emoji: "🌨️" };
  if (m >= 2 && m <= 4) return { label: "ราชาดอกไม้บานพรั่ง", hue: 320, emoji: "🌸" };
  if (m >= 5 && m <= 7) return { label: "ปีศาจมรสุมเดือด", hue: 28, emoji: "☀️" };
  return { label: "ภูตเก็บเกี่ยวสีทอง", hue: 45, emoji: "🍂" };
}

// Skill-check zones across 0..100. The narrow red center is the "perfect" hit.
// width sums to 100. multipliers tuned so red is a big payoff, miss is weak.
const ZONES = [
  { from: 0,   to: 18,  color: "#94a3b8", label: "พลาด",   mult: 0.35 },
  { from: 18,  to: 38,  color: "#fde68a", label: "พอใช้",  mult: 0.85 },
  { from: 38,  to: 46,  color: "#fb923c", label: "ดี",     mult: 1.4  },
  { from: 46,  to: 54,  color: "#dc2626", label: "เป๊ะ!",  mult: 2.6  },
  { from: 54,  to: 62,  color: "#fb923c", label: "ดี",     mult: 1.4  },
  { from: 62,  to: 82,  color: "#fde68a", label: "พอใช้",  mult: 0.85 },
  { from: 82,  to: 100, color: "#94a3b8", label: "พลาด",   mult: 0.35 },
];

function zoneAt(pos: number) {
  return ZONES.find((z) => pos >= z.from && pos < z.to) ?? ZONES[ZONES.length - 1];
}

const PLAYER_HP_MAX = 100;

export function BossArena({
  boss, gender, steps, variant = false, equippedBonus = 0,
  equipped = [], onWin, onFlee,
}: Props) {
  const def = BOSSES[boss];
  const isVariant = variant;
  const secret = useMemo(() => seasonalSecret(), []);
  const hpMax = isVariant ? Math.floor(def.hp * 1.5) : def.hp;
  const [hp, setHp] = useState(hpMax);
  const [playerHp, setPlayerHp] = useState(PLAYER_HP_MAX);
  const [shake, setShake] = useState(false);
  const [playerHurt, setPlayerHurt] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [floats, setFloats] = useState<FloatDmg[]>([]);
  const [hitFx, setHitFx] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const idRef = useRef(0);

  // Animated meter marker 0..100
  const [meter, setMeter] = useState(0);
  const meterRef = useRef(0);
  const dirRef = useRef(1);
  const rafRef = useRef<number | null>(null);

  const baseDamage = Math.max(25, Math.floor(30 + steps / 10) + equippedBonus);

  // Drive the meter via rAF for smooth oscillation
  useEffect(() => {
    if (won) return;
    let last = performance.now();
    const speed = 110; // units per second
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      let next = meterRef.current + dirRef.current * speed * dt;
      if (next >= 100) { next = 100; dirRef.current = -1; }
      if (next <= 0)   { next = 0;   dirRef.current = 1;  }
      meterRef.current = next;
      setMeter(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [won]);

  function bossCounter() {
    if (won) return;
    // very light counter-attack: 1..3 base (+1 for variant boss)
    const dmg = 1 + Math.floor(Math.random() * 3) + (isVariant ? 1 : 0);
    setPlayerHurt(true);
    setTimeout(() => setPlayerHurt(false), 350);
    setPlayerHp((h) => Math.max(0, h - dmg));
    const id = ++idRef.current;
    setFloats((arr) => [...arr, { id, value: dmg, x: 8 + Math.random() * 14, color: "#dc2626" }]);
    setTimeout(() => setFloats((arr) => arr.filter((f) => f.id !== id)), 900);
  }

  function attack() {
    if (won) return;
    const z = zoneAt(meterRef.current);
    const dealt = Math.floor((baseDamage + Math.random() * 12) * z.mult);

    setAttacking(true);
    setShake(true);
    setHitFx(z.label);
    setTimeout(() => setShake(false), 400);
    setTimeout(() => setAttacking(false), 450);
    setTimeout(() => setHitFx(null), 600);

    setHp((h) => Math.max(0, h - dealt));
    const id = ++idRef.current;
    setFloats((arr) => [...arr, { id, value: dealt, x: 50 + Math.random() * 25, color: z.color }]);
    setTimeout(() => setFloats((arr) => arr.filter((f) => f.id !== id)), 900);

    // Boss counter-attacks ~70% of the time, slight delay
    if (Math.random() < 0.7) setTimeout(bossCounter, 380);
  }

  useEffect(() => {
    if (hp === 0 && !won) {
      setWon(true);
      setTimeout(onWin, 1400);
    }
  }, [hp, won, onWin]);

  useEffect(() => {
    if (playerHp === 0 && !won) {
      // player KO — flee back home
      setTimeout(onFlee, 900);
    }
  }, [playerHp, won, onFlee]);

  const hpPct = (hp / hpMax) * 100;
  const playerPct = (playerHp / PLAYER_HP_MAX) * 100;

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

        {/* Player HP */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-semibold">❤️ พลังชีวิตคุณ</span>
          <span className="text-muted-foreground">{playerHp}/{PLAYER_HP_MAX}</span>
        </div>
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full border" style={{ background: "var(--muted)" }}>
          <div className="h-full rounded-full transition-[width] duration-200"
            style={{ width: `${playerPct}%`,
              background: playerPct > 50 ? "linear-gradient(90deg,#16a34a,#22c55e)" : playerPct > 20 ? "linear-gradient(90deg,#eab308,#f59e0b)" : "linear-gradient(90deg,#b91c1c,#ef4444)" }} />
        </div>
      </div>

      <div className={`relative mx-auto mt-6 flex w-full max-w-2xl flex-1 items-end justify-between overflow-hidden rounded-2xl border-2 border-[var(--wood-deep)] p-4 ${playerHurt ? "animate-shake" : ""}`}
        style={{ minHeight: 360, background: "linear-gradient(180deg, oklch(0.84 0.07 200) 0%, oklch(0.86 0.08 130) 70%, oklch(0.55 0.10 100) 100%)" }}>
        {effectLayer}

        <div className={`relative z-10 ${attacking ? "animate-attack" : ""}`}>
          <Character gender={gender} size={140} equipped={equipped} />
          <div className="mt-1 text-center text-xs font-semibold" style={{ color: "var(--ink)" }}>คุณ</div>
          {floats.filter((f) => f.x < 30).map((f) => (
            <div key={f.id} className="pointer-events-none absolute text-xl font-black"
              style={{ left: `${f.x}%`, top: 10, color: f.color,
                textShadow: "0 2px 0 #000", animation: "dmg-pop 0.9s ease-out forwards" }}>
              -{f.value}
            </div>
          ))}
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
              {floats.filter((f) => f.x >= 30).map((f) => (
                <div key={f.id} className="pointer-events-none absolute text-2xl font-black"
                  style={{ left: `${f.x}%`, top: 30, color: f.color,
                    textShadow: "0 0 6px #b91c1c, 0 2px 0 #000", animation: "dmg-pop 0.9s ease-out forwards" }}>
                  -{f.value}
                </div>
              ))}
              {hitFx && (
                <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-yellow-200">
                  {hitFx}
                </div>
              )}
            </>
          ) : (
            <div className="grid h-[180px] w-[180px] place-items-center animate-burst text-6xl">✨</div>
          )}
        </div>
      </div>

      {/* Skill-check meter */}
      <div className="mx-auto mt-4 w-full max-w-xl">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="font-semibold">🎯 จังหวะโจมตี — กดตอนหมุดทับแถบสีแดง!</span>
          <span className="text-muted-foreground">เป๊ะ x2.6 · ดี x1.4 · พอใช้ x0.85 · พลาด x0.35</span>
        </div>
        <div className="relative h-6 w-full overflow-hidden rounded-full border-2 border-[var(--wood-deep)] shadow-inner">
          <div className="flex h-full w-full">
            {ZONES.map((z, i) => (
              <div key={i} style={{ width: `${z.to - z.from}%`, background: z.color }} />
            ))}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute top-[-4px] h-[calc(100%+8px)] w-[3px] rounded bg-black"
            style={{ left: `calc(${meter}% - 1.5px)`, boxShadow: "0 0 6px rgba(0,0,0,0.6)" }}
          />
        </div>
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-xl items-center justify-between gap-3">
        <button type="button" onClick={onFlee}
          className="rounded-full border border-[var(--wood-deep)] bg-[var(--parchment-deep)] px-4 py-2 text-sm font-semibold">
          ← หนี
        </button>
        <button type="button" onClick={attack} disabled={won}
          className="flex-1 rounded-full py-3 font-display text-lg font-extrabold text-parchment shadow-lg disabled:opacity-50"
          style={{ background: "linear-gradient(180deg,#8b1e1e,#5a1010)", color: "var(--parchment)" }}>
          ⚔️ โจมตี! (พลังพื้นฐาน {baseDamage}+)
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
