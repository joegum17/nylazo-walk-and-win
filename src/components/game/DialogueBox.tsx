import { useEffect, useRef, useState } from "react";
import { playChibiBlip, speakThai, stopSpeak, unlockAudio } from "@/lib/game/audio";

type Speaker = "adios" | "annie";

interface Line { speaker: Speaker; text: string; voiced?: boolean }

// Two heroes — Adios (boy) and Annie (girl) — take turns telling the new traveler
// about Nylazo. They alternate so the player sees both characters speak.
const LINES: Line[] = [
  {
    speaker: "adios",
    text:
      "เฮ้! นักผจญภัยหน้าใหม่ใช่ไหม? ฉันชื่อ Adios เป็นนักผจญภัยรุ่นพี่ที่นี่ ยินดีต้อนรับสู่ หมู่บ้าน Nylazo (ไน-ลา-โซ) นะ! ชาวบ้านชอบแซวกันว่ามาจาก 'No Lazy' เพราะถ้าขี้เกียจอยู่นิ่งๆ ที่นี่ ได้โดนพวกบอสคาบไปกินแน่ๆ ฮ่าๆ!",
  },
  {
    speaker: "annie",
    text:
      "สวัสดีจ้า~ ฉัน Annie เองนะ! สภาพอากาศแถวนี้แปรปรวนสุดๆ เดี๋ยวร้อนเดี๋ยวหนาว ปรับตัวไม่ทันก็ป่วยกันยกหมู่บ้านเลย แถมอาหารช่วงนี้ก็มีแต่ซุปมันฝรั่งจืดๆ กินจนหน้าจะเป็นมันฝรั่งอยู่แล้ว!",
  },
  {
    speaker: "adios",
    text:
      "ที่ Annie พูดน่ะไม่ได้เว่อร์เลยนะ รอบๆ Nylazo มี 'บอสใหญ่' 5 ตัว สลับกันมาป่วนพวกเราไม่เว้นแต่ละวัน — บอสไฟ บอสลม บอสเมฆ บอสสไลม์ และบอสน้ำแข็ง! ปวดหัวสุดๆ",
  },
  {
    speaker: "annie",
    text:
      "เพราะอย่างนี้แหละ เราถึงต้องการคนช่วย! ในเมื่อเธอมาถึงที่นี่แล้ว แถมท่าทางก็ดูมีฝีมือ... มาร่วมมือกับเราปกป้องหมู่บ้าน Nylazo กันเถอะนะ! สัญญาเลยว่าจะสนุกแน่ๆ",
    voiced: true,
  },
  {
    speaker: "adios",
    text:
      "เอาล่ะ! ก่อนเริ่มผจญภัย จำไว้นะ — ทำเควสต์ประจำวันให้ครบทั้ง 5 อย่าง แล้วจะได้เข้าตีบอส ชนะบอสได้เครื่องประดับเอาไว้สวม วันละ 1 ตัวเท่านั้น! พร้อมแล้วก็ลุยเลย!",
  },
];

interface Props { onDone: () => void }

export function DialogueBox({ onDone }: Props) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const timerRef = useRef<number | null>(null);

  const line = LINES[i];
  const full = line.text;
  const isVoiced = !!line.voiced;
  const isLast = i === LINES.length - 1;
  const done = shown >= full.length;
  const isAnnie = line.speaker === "annie";

  useEffect(() => {
    setShown(0);
    stopSpeak();
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }

    if (isVoiced) {
      speakThai(full, { female: isAnnie });
      const total = 7000;
      const step = Math.max(20, Math.floor(total / full.length));
      let k = 0;
      timerRef.current = window.setInterval(() => {
        k += 1;
        setShown((s) => Math.min(full.length, s + 1));
        if (k >= full.length && timerRef.current) window.clearInterval(timerRef.current);
      }, step);
    } else {
      let k = 0;
      timerRef.current = window.setInterval(() => {
        k += 1;
        setShown((s) => Math.min(full.length, s + 1));
        if (k % 2 === 0) playChibiBlip(k + i * 7, isAnnie);
        if (k >= full.length && timerRef.current) window.clearInterval(timerRef.current);
      }, 35);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      stopSpeak();
    };
  }, [i, full, isVoiced, isAnnie]);

  function next() {
    unlockAudio();
    if (!done) {
      setShown(full.length);
      stopSpeak();
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }
    if (isLast) { stopSpeak(); onDone(); }
    else setI(i + 1);
  }

  const speakerName = isAnnie ? "Annie" : "Adios";
  const speakerEmoji = isAnnie ? "👧" : "👦";
  const accent = isAnnie ? "#c2185b" : "#1565c0";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center sm:pb-0"
      role="dialog"
      aria-modal="true"
      onClick={next}
    >
      <div
        className="parchment-panel w-full max-w-2xl rounded-2xl p-5 sm:p-6"
        onClick={(e) => { e.stopPropagation(); next(); }}
        style={{ borderLeft: `6px solid ${accent}` }}
      >
        <div className="mb-3 flex items-center gap-3">
          <div
            className="grid h-12 w-12 place-items-center rounded-full text-2xl"
            style={{ background: accent, color: "var(--parchment)" }}
          >
            {speakerEmoji}
          </div>
          <div>
            <div className="font-display text-lg leading-none" style={{ color: accent }}>
              {speakerName} {isAnnie ? "(ผู้หญิง)" : "(ผู้ชาย)"}
            </div>
            <div className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-thai)" }}>
              {isVoiced ? "(เสียงพากย์)" : "(พูดด้วยน้ำเสียงคุ้นเคย)"}
            </div>
          </div>
        </div>
        <p
          className="whitespace-pre-line text-[15px] leading-relaxed"
          style={{ fontFamily: "var(--font-body), var(--font-thai)", color: "var(--ink)" }}
        >
          {full.slice(0, shown)}
          {!done && <span className="ml-0.5 inline-block animate-pulse">▍</span>}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{i + 1} / {LINES.length}</div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
            style={{ background: accent }}
          >
            {!done ? "▸▸" : isLast ? "เริ่มผจญภัย" : "ถัดไป ▸"}
          </button>
        </div>
      </div>
    </div>
  );
}
