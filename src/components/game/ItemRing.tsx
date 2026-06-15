import type { Item } from "@/lib/game/types";

interface Props {
  items: Item[];
  size?: number;
}

const ITEM_EMOJI: Record<Item, string> = {
  "ดาบ": "⚔️",
  "โล่": "🛡️",
  "เปลือกกล้วย": "🍌",
};

/**
 * Magic ring circling the character. Always rotates; items orbit and bob.
 */
export function ItemRing({ items, size = 320 }: Props) {
  const radius = size / 2 - 24;
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* glow base */}
      <div
        className="absolute inset-0 rounded-full animate-glow"
        style={{ background: "var(--gradient-magic)" }}
      />
      {/* outer ring */}
      <div
        className="absolute inset-0 rounded-full border-2 animate-ring"
        style={{
          borderColor: "oklch(0.82 0.12 85 / 0.7)",
          boxShadow: "0 0 18px oklch(0.82 0.12 85 / 0.5), inset 0 0 12px oklch(0.82 0.12 85 / 0.4)",
        }}
      />
      {/* inner thin ring counter-rotating */}
      <div
        className="absolute rounded-full border animate-ring-rev"
        style={{
          inset: 14,
          borderColor: "oklch(0.92 0.08 85 / 0.6)",
          borderStyle: "dashed",
        }}
      />
      {/* items */}
      <div className="absolute inset-0 animate-ring">
        {items.map((it, i) => {
          const angle = (i / Math.max(items.length, 1)) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * radius + size / 2;
          const y = Math.sin(angle) * radius + size / 2;
          return (
            <div
              key={`${it}-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
            >
              <div
                className="animate-float text-3xl drop-shadow-md"
                style={{ animationDelay: `${i * 0.2}s` }}
                title={it}
              >
                {ITEM_EMOJI[it]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
