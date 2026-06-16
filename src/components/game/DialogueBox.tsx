import { useEffect, useRef, useState } from "react";
import { playChibiBlip, speakThai, stopSpeak } from "@/lib/game/audio";

const LINES: string[] = [
  "อ้าว! หน้าตาไม่คุ้นเลยนี่นา... นักเดินทางหน้าใหม่งั้นเหรอ? ยินดีต้อนรับสู่ หมู่บ้าน Nylazo (ไนลาโซ) นะ! เออ... แล้วก็บอกไว้ก่อนเลยนะว่าชื่อหมู่บ้านน่ะอ่านว่า 'ไน-ลา-โซ' แต่พวกเราชอบแซวกันว่ามาจาก 'No Lazy' (ห้ามขี้เกียจ) เพราะถ้าขี้เกียจอยู่นิ่งๆ ที่นี่ล่ะก็... ได้อดตายหรือไม่ก็โดนพวกบอสคาบไปกินแน่ๆ ฮ่าๆ!",
  "เฮ้อ... พูดถึงเรื่องนี้แล้วก็เหนื่อยใจ สภาพอากาศช่วงนี้มันจะแปรปรวนไปไหนก็ไม่รู้ ปรับตัวไม่ทันจนไข้จะแดกเอา! แถมนอกจากอากาศจะแย่แล้ว อาหารในหมู่บ้านช่วงนี้ก็นะ... มีแต่ซุปมันฝรั่งต้มจืดๆ ชืดๆ กินติดต่อกันมาสามวันจนหน้าฉันจะกลายเป็นมันฝรั่งอยู่แล้วเนี่ย! วัตถุดิบดีๆ ในป่าเหรอ? หึ อย่าหวังเลย ออกไปเก็บก็เสี่ยงชีวิตเกินไป",
  "ที่บอกว่าเสี่ยงน่ะไม่ได้ขู่หรอกนะ เจ้ามาใหม่คงยังไม่รู้ล่ะสิว่าหมู่บ้านเราต้องเจออะไรบ้าง? รอบๆ Nylazo น่ะ มี 'บอสใหญ่' อยู่ 5 ตัว ที่คอยสลับกันมาสร้างความปั่นปวนให้พวกเราไม่เว้นแต่ละวัน... คิดแล้วก็ปวดหัว!",
  "เห็นไหมล่ะ? ชีวิตความเป็นอยู่ของพวกเรามันแขวนอยู่บนเส้นด้ายขนาดไหน สภาพอากาศกับโรคภัยแปรปรวนเพราะไอ้พวกนี้แหละ! แต่บ่นไปก็ไม่ได้ช่วยให้อะไรดีขึ้น! ในเมื่อเจ้ามาถึงที่นี่แล้ว แถมดูทรงแล้วฝีมือก็ไม่น่าจะกระจอก... มาร่วมมือกันหน่อยเป็นไง? มาช่วยพวกเราปกป้องหมู่บ้าน Nylazo แห่งนี้กันเถอะนะ!",
  "วันไหนเจอ 'บอสไฟ': โอ้โห... พี่แกกวนโอ๊ยสุดๆ ตัวเป็นไฟลุกท่วมแต่ดันใส่แว่นกันแดด เท่เฉย! แดดเมืองไทยยังต้องกราบอ่ะ\n\nวันไหนเจอ 'บอสลม': หมุนเป็นพายุทอร์นาโดลูกยักษ์ หลังคาบ้านปลิวหาย!\n\nวันไหนเจอ 'บอสเมฆ': ฝนไหลพรากๆ ผ้าที่ตากไม่เคยแห้ง!\n\nวันไหนเจอ 'บอสสไลม์': ใส่หน้ากากอนามัยแต่ในตัวเขียวอี๋ไปด้วยเชื้อโรค!\n\nวันไหนเจอ 'บอสน้ำแข็ง': แช่แข็งทุกอย่างจนขยับไม่ได้!",
];

// The 4th dialogue (index 3) gets full voice acting.
const CLIMAX_INDEX = 3;

interface Props { onDone: () => void; }

export function DialogueBox({ onDone }: Props) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const timerRef = useRef<number | null>(null);

  const full = LINES[i];
  const isClimax = i === CLIMAX_INDEX;
  const isLast = i === LINES.length - 1;
  const isSerious = i === 2 || i === 3 || i === 4;
  const done = shown >= full.length;

  // Typewriter + audio
  useEffect(() => {
    setShown(0);
    stopSpeak();
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }

    if (isClimax) {
      // Voice-acted climax: speak the whole line, reveal text in sync at a steady rate.
      speakThai(full);
      const total = 6500; // ms estimated speech duration
      const step = Math.max(20, Math.floor(total / full.length));
      let k = 0;
      timerRef.current = window.setInterval(() => {
        k += 1;
        setShown((s) => {
          const ns = Math.min(full.length, s + 1);
          return ns;
        });
        if (k >= full.length) {
          if (timerRef.current) window.clearInterval(timerRef.current);
        }
      }, step);
    } else {
      // Chibi gibberish: blip per char
      let k = 0;
      timerRef.current = window.setInterval(() => {
        k += 1;
        setShown((s) => Math.min(full.length, s + 1));
        if (k % 2 === 0) playChibiBlip(k + i * 7);
        if (k >= full.length) {
          if (timerRef.current) window.clearInterval(timerRef.current);
        }
      }, 35);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      stopSpeak();
    };
  }, [i, full, isClimax]);

  function next() {
    if (!done) {
      // Skip typewriter
      setShown(full.length);
      stopSpeak();
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }
    if (isLast) { stopSpeak(); onDone(); }
    else setI(i + 1);
  }

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
      >
        <div className="mb-3 flex items-center gap-3">
          <div
            className="grid h-12 w-12 place-items-center rounded-full text-2xl"
            style={{ background: isClimax ? "var(--wood-deep)" : "var(--moss)", color: "var(--parchment)" }}
          >
            {isClimax ? "🔥" : isSerious ? "😠" : "🧓"}
          </div>
          <div>
            <div className="font-display text-lg leading-none">ผู้เฒ่าแห่งไนลาโซ</div>
            <div className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-thai)" }}>
              {isClimax ? "(เสียงพากย์เต็มจอ)" : isSerious ? "(หน้าตาจริงจัง)" : "(ยิ้มแย้ม)"}
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
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
          >
            {!done ? "ข้าม ▸▸" : isLast ? "เริ่มผจญภัย" : "ถัดไป ▸"}
          </button>
        </div>
      </div>
    </div>
  );
}
