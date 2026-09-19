// A once-a-second clock exposed as an external store, so components can show
// live time without setting state from an effect. Server snapshot is 0 so the
// pre-rendered HTML stays static.

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  if (!timer) timer = setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function getSnapshot(): number {
  return Math.floor(Date.now() / 1000);
}

export function getServerSnapshot(): number {
  return 0;
}

// Deepavali 2026. Confirm with the client before launch.
export const DIWALI = new Date("2026-11-08T00:00:00+05:30");

export type Remaining = { days: number; hours: number; minutes: number; seconds: number };

export function remainingUntil(nowSeconds: number, target = DIWALI): Remaining | null {
  if (nowSeconds === 0) return null; // server / pre-hydration
  let diff = Math.floor(target.getTime() / 1000) - nowSeconds;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  return { days, hours, minutes, seconds: diff - minutes * 60 };
}
