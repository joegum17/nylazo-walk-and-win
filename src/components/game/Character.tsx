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
  eyes: { top: "32%", left: "50%", sizeMul: 0.26 },
  body: { top: "58%", left: "50%", sizeMul: 0.55 },
  head: { top: "8%",  left: "72%", sizeMul: 0.24 },
};

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
                fontSize: Math.round(size * pos.sizeMul),
                lineHeight: 1,
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.45))",
                pointerEvents: "none",
              }}
            >
              {a.emoji}
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
