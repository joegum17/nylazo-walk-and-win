import { createFileRoute, Link } from "@tanstack/react-router";
import villageBg from "@/assets/village-bg.webp.asset.json";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: "เครดิต — Nylazo: No Lazy" },
      { name: "description", content: "เครดิตทีมพัฒนา, อาร์ตเวิร์ก, และแหล่งเสียงประกอบฟรีลิขสิทธิ์ (Royalty-Free / CC0) ที่ใช้ในเกม Nylazo: No Lazy" },
    ],
  }),
  component: Credits,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="parchment-panel rounded-2xl p-5">
      <h2 className="mb-3 font-display text-xl font-bold" style={{ color: "var(--ink)" }}>{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: "var(--ink)" }}>{children}</div>
    </section>
  );
}

function Credits() {
  return (
    <main
      className="min-h-screen px-4 py-6"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(244,235,225,0.7), rgba(244,235,225,0.95)), url(${villageBg.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "var(--font-thai)",
      }}
    >
      <div className="mx-auto max-w-2xl space-y-4">
        <header className="flex items-center justify-between">
          <Link to="/" className="rounded-full border border-[var(--wood-deep)] bg-white/80 px-3 py-1 text-sm font-semibold">
            ← กลับหมู่บ้าน
          </Link>
          <h1 className="font-display text-2xl font-black tracking-wider">📜 เครดิต</h1>
          <span />
        </header>

        <Section title="ทีมพัฒนา (Developers)">
          <p>• Game Design & Story — ทีมงาน Nylazo</p>
          <p>• Frontend Engineering — Lovable AI Agent (React + TanStack Start)</p>
          <p>• Backend & Auth — Lovable Cloud</p>
          <p>• QA & Playtesting — ผู้เล่นกลุ่ม Beta</p>
        </Section>

        <Section title="อาร์ตเวิร์ก (Artwork)">
          <p>• ตัวละครและฉากหลังหมู่บ้าน — ภาพอัปโหลดของผู้สร้าง / สร้างใหม่ด้วย AI</p>
          <p>• สไปรท์บอสทั้ง 5 ตัว — สร้างใหม่ด้วย AI Imagegen (ภายใต้ลิขสิทธิ์ของโปรเจกต์)</p>
          <p>• ไอคอนอีโมจิ — Apple Color Emoji / Twemoji (CC-BY 4.0)</p>
        </Section>

        <Section title="🎵 เสียงประกอบ (Audio Attribution)">
          <p className="italic text-muted-foreground">ขอบคุณผู้ให้บริการเสียงฟรีลิขสิทธิ์ (Royalty-Free / CC0) ทุกท่าน 🙏</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <b>Chibi "Mumi-Mumi" Gibberish SFX</b> — สังเคราะห์เรียลไทม์ด้วย Web Audio API
              (โอเพ่นซอร์ส, ไม่มีลิขสิทธิ์ทับซ้อน)
            </li>
            <li>
              <b>เสียงพากย์ Dialogue ตอนที่ 4 (Climax)</b> — สร้างด้วย Browser Speech Synthesis API
              (เสียง th-TH ฟรีในตัวระบบปฏิบัติการ)
            </li>
            <li>
              <b>Freesound.org</b> — แหล่งอ้างอิงเสียง SFX CC0 (
              <a className="underline" href="https://freesound.org" target="_blank" rel="noreferrer">freesound.org</a>)
            </li>
            <li>
              <b>Pixabay Music</b> — เพลงประกอบฟรีลิขสิทธิ์ (
              <a className="underline" href="https://pixabay.com/music/" target="_blank" rel="noreferrer">pixabay.com/music</a>)
            </li>
            <li>
              <b>OpenGameArt.org</b> — เสียงและดนตรี CC0 สำหรับเกมอินดี้ (
              <a className="underline" href="https://opengameart.org" target="_blank" rel="noreferrer">opengameart.org</a>)
            </li>
            <li>
              <b>Kevin MacLeod (incompetech.com)</b> — เพลง CC-BY 4.0
            </li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            เสียงประกอบทั้งหมดในเกมนี้เป็นไปตามเงื่อนไข Royalty-Free / CC0 / CC-BY เท่านั้น
            หากพบการละเมิดลิขสิทธิ์ โปรดติดต่อทีมพัฒนาเพื่อแก้ไขทันที
          </p>
        </Section>

        <Section title="ไลบรารีและเทคโนโลยี">
          <p>React 19 · TanStack Start · Tailwind CSS · shadcn/ui · Supabase · Open-Meteo Weather API</p>
        </Section>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nylazo: No Lazy — Made with ♥ in Cottagecore
        </p>
      </div>
    </main>
  );
}
