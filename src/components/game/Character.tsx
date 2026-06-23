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

// Slot positions as percentages of the character box.
// Each slot can stack multiple accessories with a small offset.
const SLOT_POS: Record<AccessoryDef["slot"], { top: string; left: string; dx: number; dy: number }> = {
  head: { top: "4%", left: "50%", dx: 22, dy: 0 },
  neck: { top: "44%", left: "50%", dx: 20, dy: 0 },
  ring: { top: "70%", left: "62%", dx: 18, dy: 4 },
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

  // Group equipped by slot to stack neatly
  const bySlot: Record<string, AccessoryDef[]> = { head: [], neck: [], ring: [] };
  for (const id of equipped) {
    const a = ACCESSORIES[id];
    if (a) bySlot[a.slot].push(a);
  }

  const emojiSize = Math.round(size * 0.18);

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
        className={flipping ? "animate-flip" : ""}
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

        {/* Equipped accessory overlays — render on top of the sprite */}
        {(Object.keys(bySlot) as Array<AccessoryDef["slot"]>).map((slot) => {
          const items = bySlot[slot];
          if (!items.length) return null;
          const pos = SLOT_POS[slot];
          return items.map((a, i) => {
            const offset = i - (items.length - 1) / 2;
            return (
              <span
                key={`${slot}-${a.id}`}
                aria-hidden
                title={a.name}
                style={{
                  position: "absolute",
                  top: pos.top,
                  left: pos.left,
                  transform: `translate(calc(-50% + ${offset * pos.dx}px), ${offset * pos.dy}px)`,
                  fontSize: emojiSize,
                  lineHeight: 1,
                  filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.45))",
                  pointerEvents: "none",
                  animation: "accessoryFloat 2.6s ease-in-out infinite",
                }}
              >
                {a.emoji}
              </span>
            );
          });
        })}
      </div>

      <style>{`
        @keyframes accessoryFloat {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -2px; }
        }
      `}</style>
    </button>
  );
}
