"use client";

import { useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  remainingUntil,
  subscribe,
} from "@/lib/tickStore";

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-[3.25rem] rounded-xl border border-gold/30 bg-surface-2/70 px-2 py-1.5 text-center">
      <p className="tnum text-xl font-bold leading-none text-gold-soft">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

export function Countdown() {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const left = remainingUntil(now);

  // Renders a stable placeholder on the server and before hydration.
  if (!left) {
    return (
      <p className="text-[13px] text-muted">
        Deepavali &middot; <span className="text-gold-soft">8 November 2026</span>
      </p>
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-[0.18em] text-muted">
        Deepavali countdown
      </p>
      <div className="flex gap-1.5">
        <Cell value={left.days} label="days" />
        <Cell value={left.hours} label="hrs" />
        <Cell value={left.minutes} label="min" />
        <Cell value={left.seconds} label="sec" />
      </div>
    </div>
  );
}
