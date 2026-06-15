import { useEffect, useRef, useState } from "react";

/**
 * Web-based pedometer using DeviceMotion. Detects vertical acceleration peaks.
 * Works on mobile browsers after user grants motion permission.
 * Falls back gracefully (returns 0) when sensor unavailable.
 */
export function useSteps(initial = 0) {
  const [steps, setSteps] = useState(initial);
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied" | "unsupported">(
    "prompt",
  );
  const lastPeakRef = useRef(0);
  const lastMagRef = useRef(9.81);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("DeviceMotionEvent" in window)) {
      setPermission("unsupported");
    }
  }, []);

  useEffect(() => {
    setSteps(initial);
  }, [initial]);

  async function request() {
    if (typeof window === "undefined") return;
    const DME = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
    try {
      if (DME?.requestPermission) {
        const res = await DME.requestPermission();
        setPermission(res === "granted" ? "granted" : "denied");
      } else {
        setPermission("granted");
      }
    } catch {
      setPermission("denied");
    }
  }

  useEffect(() => {
    if (permission !== "granted") return;
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      const now = Date.now();
      const delta = mag - lastMagRef.current;
      lastMagRef.current = mag;
      // step detection: strong vertical spike + min 300ms gap
      if (delta > 2.5 && now - lastPeakRef.current > 300) {
        lastPeakRef.current = now;
        setSteps((s) => s + 1);
      }
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [permission]);

  return { steps, setSteps, permission, request };
}
