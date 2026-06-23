// Royalty-free / CC0 sound synthesis via WebAudio (no external assets).
// Chibi "Mumi-Mumi" gibberish: short sine/triangle blips per character reveal.
// Voiced climax: browser SpeechSynthesis API (built-in, free, no key).

let _ctx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    _ctx = new AC();
  } catch { _ctx = null; }
  return _ctx;
}

/** Call from a user gesture (click/tap) to unlock audio + warm up voices. */
export function unlockAudio() {
  const ac = ctx();
  if (ac && ac.state === "suspended") ac.resume().catch(() => {});
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      // Trigger voices to load on some browsers
      window.speechSynthesis.getVoices();
      // No-op silent utterance to unlock on iOS/Safari
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  }
}

const NOTES = [392, 440, 494, 523, 587, 659, 698, 784];
const FEMALE_NOTES = [523, 587, 659, 698, 784, 880, 988, 1046];

export function playChibiBlip(seed: number, female = false) {
  const ac = ctx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const scale = female ? FEMALE_NOTES : NOTES;
  const freq = scale[seed % scale.length] * (0.9 + ((seed * 13) % 20) / 100);
  osc.type = seed % 3 === 0 ? "triangle" : "sine";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.1, t + 0.06);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.14, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

let _voicesReady = false;
function ensureVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const v = window.speechSynthesis.getVoices();
    if (v && v.length) { _voicesReady = true; resolve(v); return; }
    const onChange = () => {
      const vs = window.speechSynthesis.getVoices();
      if (vs.length) {
        _voicesReady = true;
        window.speechSynthesis.removeEventListener("voiceschanged", onChange);
        resolve(vs);
      }
    };
    window.speechSynthesis.addEventListener("voiceschanged", onChange);
    // Fallback timeout
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 800);
  });
}

export async function speakThai(text: string, opts?: { female?: boolean; onEnd?: () => void }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    opts?.onEnd?.();
    return;
  }
  stopSpeak();
  const voices = await ensureVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "th-TH";
  u.rate = 1.0;
  u.pitch = opts?.female ? 1.35 : 0.95;
  u.volume = 1.0;
  const thaiVoice =
    voices.find((v) => v.lang?.toLowerCase().startsWith("th") && (opts?.female ? /female|woman|หญิง/i.test(v.name) : /male|man|ชาย/i.test(v.name))) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith("th")) ||
    voices.find((v) => v.default);
  if (thaiVoice) u.voice = thaiVoice;
  u.onend = () => opts?.onEnd?.();
  u.onerror = () => opts?.onEnd?.();
  window.speechSynthesis.speak(u);
  void _voicesReady;
}

export function stopSpeak() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
