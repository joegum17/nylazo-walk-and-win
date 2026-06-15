import { useEffect, useState } from "react";
import { BASE_QUESTS, specialQuestFor } from "@/lib/game/quests";
import type { DayState, BossKey } from "@/lib/game/types";
import { msUntilMidnight } from "@/lib/game/storage";

interface Props {
  day: DayState;
  boss: BossKey;
  onComplete: (questId: string) => void;
  onEnterBoss: () => void;
  disabled?: boolean;
}

function hourNow() { return new Date().getHours(); }

function fmtCountdown(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h} ชม. ${m} นาที`;
}

export function QuestBoard({ day, boss, onComplete, onEnterBoss, disabled }: Props) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const special = specialQuestFor(boss);
  const allRows = [
    ...BASE_QUESTS.map((q) => ({ id: q.id, title: q.title, detail: q.detail, opensAt: q.opensAt, type: q.type, target: q.target })),
    { id: "special", title: special.title, detail: special.detail, opensAt: 0, type: "special" as const, target: undefined },
  ];

  const completedCount = day.quests.filter((q) => q.completed).length;
  const allDone = completedCount >= 5;

  return (
    <div className="wood-plank rounded-2xl p-4 sm:p-5" style={{ fontFamily: "var(--font-board), var(--font-thai)" }}>
      <div className="mb-3 flex items-center justify-between gap-2 text-parchment">
        <h2 className="font-display text-xl font-bold" style={{ color: "var(--parchment)" }}>
          📜 กระดานเควสต์ประจำวัน
        </h2>
        <span className="rounded-full bg-black/30 px-3 py-1 text-xs" style={{ color: "var(--parchment)" }}>
          รีเฟรชใน {fmtCountdown(msUntilMidnight())}
        </span>
      </div>

      <ul className="space-y-2">
        {allRows.map((row) => {
          const state = day.quests.find((s) => s.id === row.id)!;
          const opened = hourNow() >= row.opensAt;
          const done = state.completed;
          const progressLabel =
            row.type === "steps" && row.target
              ? ` (${Math.min(day.steps, row.target)}/${row.target} ก้าว)`
              : "";
          return (
            <li
              key={row.id}
              className="flex flex-col gap-2 rounded-xl bg-[oklch(0.94_0.025_80)] p-3 shadow-inner sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{done ? "✅" : opened ? "🪵" : "⏳"}</span>
                  <span className="font-semibold" style={{ color: "var(--ink)" }}>
                    {row.title}
                    <span className="text-xs text-muted-foreground">{progressLabel}</span>
                  </span>
                </div>
                <p className="ml-7 text-xs text-muted-foreground">
                  {opened ? row.detail : `ปลดล็อกเวลา ${String(row.opensAt).padStart(2, "0")}:00 น.`}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled || done || !opened || (row.type === "steps" && row.target ? day.steps < row.target : false)}
                onClick={() => onComplete(row.id)}
                className="shrink-0 rounded-full px-4 py-1.5 text-xs font-bold shadow disabled:opacity-50"
                style={{ background: done ? "var(--muted)" : "var(--moss)", color: "var(--parchment)" }}
              >
                {done ? "สำเร็จ" : row.type === "checkin" ? "เช็คอิน" : row.type === "steps" ? "เก็บรางวัล" : "ทำภารกิจ"}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onEnterBoss}
        disabled={disabled || !allDone || day.bossDefeatedToday}
        className="mt-4 w-full rounded-xl py-3 font-display text-lg font-bold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: allDone && !day.bossDefeatedToday ? "linear-gradient(180deg, #b8860b, #8b6508)" : "var(--muted)",
          color: "var(--parchment)",
        }}
      >
        {day.bossDefeatedToday ? "🏆 ชนะบอสวันนี้แล้ว" : `⚔️ เข้าสู่ด่านบอส (${completedCount}/5)`}
      </button>
    </div>
  );
}
