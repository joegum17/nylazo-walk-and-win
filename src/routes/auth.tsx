import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import villageBg from "@/assets/village-bg.webp.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ — Nylazo: No Lazy" },
      { name: "description", content: "ล็อกอินเข้าหมู่บ้านไนลาโซเพื่อเริ่มการผจญภัย" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/" });
    });
  }, [nav]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("สมัครสำเร็จ! เช็คอีเมลยืนยัน (ถ้ามี) แล้วลองล็อกอิน");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (res.error) throw res.error;
      if (!res.redirected) nav({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ล็อกอินไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative grid min-h-screen place-items-center p-4"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(244,235,225,0.6), rgba(244,235,225,0.9)), url(${villageBg.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="parchment-panel w-full max-w-sm rounded-2xl p-6">
        <h1 className="text-center font-display text-3xl font-extrabold tracking-wider">Nylazo</h1>
        <p className="mt-1 text-center text-xs italic text-muted-foreground" style={{ fontFamily: "var(--font-thai)" }}>
          ห้ามขี้เกียจ — เดินจริง ลุยบอสจริง
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleOAuth("google")}
            className="rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-[var(--parchment-deep)] disabled:opacity-50"
          >
            🌐 เข้าสู่ระบบด้วย Google
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleOAuth("apple")}
            className="rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
             เข้าสู่ระบบด้วย Apple
          </button>
        </div>

        <div className="my-5 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-[var(--border)]" />
          หรือใช้อีเมล
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <form onSubmit={handleEmail} className="space-y-2">
          {mode === "signup" && (
            <input
              type="text"
              required
              placeholder="ชื่อในเกม"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
            />
          )}
          <input
            type="email"
            required
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="รหัสผ่าน (≥6 ตัวอักษร)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--moss)] px-4 py-2.5 text-sm font-semibold text-[var(--parchment)] shadow disabled:opacity-50"
          >
            {loading ? "กำลังโหลด..." : mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-3 w-full text-center text-xs text-muted-foreground underline"
        >
          {mode === "signin" ? "ยังไม่มีบัญชี? สมัครเลย" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
        </button>
      </div>
    </main>
  );
}
