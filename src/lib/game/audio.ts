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

const NOTES = [392, 440, 494, 523, 587, 659, 698, 784];

export function playChibiBlip(seed: number) {
  const ac = ctx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const freq = NOTES[seed % NOTES.length] * (0.9 + ((seed * 13) % 20) / 100);
  osc.type = seed % 3 === 0 ? "triangle" : "sine";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.1, t + 0.06);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

let _speakingUtter: SpeechSynthesisUtterance | null = null;
export function speakThai(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  stopSpeak();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "th-TH";
  u.rate = 1.0;
  u.pitch = 1.15;
  u.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const thaiVoice = voices.find((v) => v.lang?.toLowerCase().startsWith("th"));
  if (thaiVoice) u.voice = thaiVoice;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  _speakingUtter = u;
  window.speechSynthesis.speak(u);
}

export function stopSpeak() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  _speakingUtter = null;
}
