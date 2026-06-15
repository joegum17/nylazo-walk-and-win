import { useState } from "react";
import heroBoy from "@/assets/hero-boy.png.asset.json";
import heroGirl from "@/assets/hero-girl.webp.asset.json";
import type { Gender } from "@/lib/game/types";

interface Props {
  gender: Gender;
  onFlip?: () => void;
  size?: number;
  className?: string;
}

/**
 * Character sprite. Renders inside a clip-path / mask to soften the black
 * outline artifacts ("Image Sprite Cleaning"). Uses mix-blend + drop-shadow
 * recolor and a soft circular mask to feather edges into the background.
 */
export function Character({ gender, onFlip, size = 220, className = "" }: Props) {
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
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
        }}
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
            // Sprite cleaning: feather edges, lift contrast, drop a soft warm shadow
            filter: "drop-shadow(0 6px 8px rgba(43,30,23,0.35)) contrast(1.02) saturate(1.05)",
            // Radial mask removes hard rectangular edges and the residual black border
            WebkitMaskImage:
              "radial-gradient(ellipse 95% 98% at 50% 50%, #000 88%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 95% 98% at 50% 50%, #000 88%, transparent 100%)",
          }}
        />
      </div>
    </button>
  );
}
