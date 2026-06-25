import { useState } from "react";
import heroBoy from "@/assets/hero-boy.png.asset.json";
import heroGirl from "@/assets/hero-girl.webp.asset.json";
import type { Gender } from "@/lib/game/types";
import { ACCESSORIES, type AccessoryDef } from "@/lib/game/accessories";

interface Props {
  gender: Gender;
  onFlip?: () => void;
  size?: number;
  className?: string;
  equipped?: string[];
}

// Slot positions tuned so accessories sit on the right body parts:
// - eyes: on the face, where the eyes are
// - body: covers the torso (raincoat — larger emoji)
// - head: pinned to the right side of the head (bow)
const SLOT_POS: Record<AccessoryDef["slot"], {
  top: string; left: string; sizeMul: number;
}> = {
  eyes: { top: "33%", left: "50%", sizeMul: 0.36 },
  body: { top: "62%", left: "50%", sizeMul: 0.78 },
  head: { top: "10%", left: "72%", sizeMul: 0.28 },
};

const INK = "#2b1e17";
const INK_SOFT = "#4a342a";

function AccessoryLineArt({ id, size }: { id: string; size: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 100 100",
    fill: "none",
    stroke: INK,
    strokeWidth: 3.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "sunglasses") {
    return (
      <svg {...common}>
        <path d="M8 46 H92" />
        <path d="M14 44 Q12 70 30 70 Q48 70 48 50 Q48 44 42 42 H18 Q14 42 14 46 Z"
          fill="rgba(43,30,23,0.78)" />
        <path d="M86 44 Q88 70 70 70 Q52 70 52 50 Q52 44 58 42 H82 Q86 42 86 46 Z"
          fill="rgba(43,30,23,0.78)" />
        <path d="M20 50 Q24 54 28 52" stroke="#f5e6c8" strokeWidth="2.2" />
        <path d="M60 50 Q64 54 68 52" stroke="#f5e6c8" strokeWidth="2.2" />
      </svg>
    );
  }
  if (id === "raincoat") {
    return (
      <svg {...common}>
        {/* hood */}
        <path d="M28 26 Q50 8 72 26 Q70 36 50 38 Q30 36 28 26 Z"
          fill="#c98a3d" stroke={INK} />
        {/* shoulders + body */}
        <path d="M20 40 Q26 32 38 32 L62 32 Q74 32 80 40 L86 86 Q70 92 50 92 Q30 92 14 86 Z"
          fill="#e8a93d" stroke={INK} />
        {/* center seam / buttons */}
        <path d="M50 38 V90" stroke={INK_SOFT} strokeWidth="2" />
        <circle cx="50" cy="50" r="2" fill={INK} />
        <circle cx="50" cy="62" r="2" fill={INK} />
        <circle cx="50" cy="74" r="2" fill={INK} />
        {/* collar */}
        <path d="M38 32 L50 44 L62 32" stroke={INK} />
        {/* sleeve folds */}
        <path d="M22 48 Q18 60 22 74" stroke={INK_SOFT} strokeWidth="2" />
        <path d="M78 48 Q82 60 78 74" stroke={INK_SOFT} strokeWidth="2" />
      </svg>
    );
  }
  if (id === "pink_bow") {
    return (
      <svg {...common}>
        {/* left loop */}
        <path d="M50 50 Q18 28 14 50 Q18 72 50 50 Z" fill="#f7a8c4" stroke={INK} />
        {/* right loop */}
        <path d="M50 50 Q82 28 86 50 Q82 72 50 50 Z" fill="#f7a8c4" stroke={INK} />
        {/* knot */}
        <ellipse cx="50" cy="50" rx="8" ry="10" fill="#e87aa4" stroke={INK} />
        <path d="M46 46 Q50 50 46 54" stroke={INK} strokeWidth="2" />
        <path d="M54 46 Q50 50 54 54" stroke={INK} strokeWidth="2" />
        {/* tails */}
        <path d="M44 58 Q40 78 34 82" stroke={INK} fill="#f7a8c4" />
        <path d="M56 58 Q60 78 66 82" stroke={INK} fill="#f7a8c4" />
      </svg>
    );
  }
  return null;
}

export function Character({ gender, onFlip, size = 220, className = "", equipped = [] }: Props) {
  const [flipping, setFlipping] = useState(false);
  const src = gender === "boy" ? heroBoy.url : heroGirl.url;

  function handleFlip() {
    if (!onFlip) return;
    setFlipping(true);
    setTimeout(() => {
      onFlip();
      setTimeout(() => setFlipping(false), 300);
    }, 300);
  }

  // Only one item per slot — last one wins if multiple of same slot equipped.
  const bySlot: Partial<Record<AccessoryDef["slot"], AccessoryDef>> = {};
  for (const id of equipped) {
    const a = ACCESSORIES[id];
    if (a) bySlot[a.slot] = a;
  }

  return (
    <button
      type="button"
      onClick={handleFlip}
      disabled={!onFlip}
      aria-label="สลับเพศตัวละคร"
      className={`relative select-none ${className}`}
      style={{ width: size, height: size, perspective: "800px" }}
    >
      <div
        className={flipping ? "animate-flip" : "char-idle"}
        style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", position: "relative" }}
      >
        <img
          src={src}
          alt={gender === "boy" ? "ตัวละครชาย" : "ตัวละครหญิง"}
          width={size}
          height={size}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 6px 8px rgba(43,30,23,0.35)) contrast(1.02) saturate(1.05)",
            WebkitMaskImage:
              "radial-gradient(ellipse 95% 98% at 50% 50%, #000 88%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 95% 98% at 50% 50%, #000 88%, transparent 100%)",
          }}
        />

        {(Object.keys(bySlot) as Array<AccessoryDef["slot"]>).map((slot) => {
          const a = bySlot[slot];
          if (!a) return null;
          const pos = SLOT_POS[slot];
          const px = Math.round(size * pos.sizeMul);
          return (
            <span
              key={slot}
              aria-hidden
              title={a.name}
              style={{
                position: "absolute",
                top: pos.top,
                left: pos.left,
                transform: "translate(-50%, -50%)",
                width: px,
                height: px,
                lineHeight: 0,
                filter: "drop-shadow(0 2px 2px rgba(43,30,23,0.45))",
                pointerEvents: "none",
              }}
            >
              <AccessoryLineArt id={a.id} size={px} />
            </span>
          );
        })}
      </div>

      <style>{`
        @keyframes charIdle {
          0%, 100% { transform: translateY(0) rotate(-1.2deg); }
          25%      { transform: translateY(-4px) rotate(0.8deg); }
          50%      { transform: translateY(-6px) rotate(1.2deg); }
          75%      { transform: translateY(-3px) rotate(-0.6deg); }
        }
        .char-idle { animation: charIdle 2.6s ease-in-out infinite; transform-origin: 50% 90%; }
      `}</style>
    </button>
  );
}
