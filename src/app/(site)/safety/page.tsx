import type { Metadata } from "next";
import { pageTitle } from "@/lib/shop";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: pageTitle("Safety Tips"),
  description:
    "How to store, light and dispose of fireworks safely this Diwali. Do's and don'ts for families.",
};

const DOS = [
  "Buy only from licensed shops and keep crackers in a closed box, away from the kitchen.",
  "Light crackers outdoors, in an open space, on a flat surface.",
  "Keep two buckets of water and a bucket of sand within reach before you start.",
  "Light one cracker at a time, using an agarbatti or a long candle, then step back.",
  "Wear cotton clothes. Loose synthetic clothing catches fire quickly.",
  "Keep children under adult supervision at all times.",
  "Soak used crackers in water before throwing them away.",
];

const DONTS = [
  "Never relight a cracker that did not go off. Wait, then soak it in water.",
  "Never hold a cracker in your hand while lighting it.",
  "Never light crackers inside a house, on a terrace with a low ceiling, or near a vehicle.",
  "Never keep crackers in your pocket.",
  "Never let children handle sound crackers, rockets or aerial shots.",
  "Never light crackers near dry leaves, hay, fuel or cooking gas cylinders.",
  "Never use damaged or loose crackers.",
];

const EMERGENCY = [
  ["Minor burn", "Hold the area under cool running water for 10 minutes. Do not apply oil, ink or toothpaste."],
  ["Eye injury", "Do not rub the eye. Rinse gently with clean water and go to hospital immediately."],
  ["Clothes catch fire", "Stop, drop and roll. Smother the flames with a blanket. Do not run."],
];

export default function SafetyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
        Safety Tips
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        Crackers are safe when handled properly. Please read this with your family
        before Diwali.
      </p>

      <section className="mt-8 rounded-2xl border border-good/30 bg-good/5 p-5">
        <h2 className="text-[15px] font-bold uppercase tracking-wide text-good">Do</h2>
        <ul className="mt-3 space-y-2.5">
          {DOS.map((t) => (
            <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-text">
              <span aria-hidden="true" className="text-good">&#10003;</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-2xl border border-ember/30 bg-ember/5 p-5">
        <h2 className="text-[15px] font-bold uppercase tracking-wide text-ember">
          Do not
        </h2>
        <ul className="mt-3 space-y-2.5">
          {DONTS.map((t) => (
            <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-text">
              <span aria-hidden="true" className="text-ember">&times;</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[15px] font-bold uppercase tracking-wide text-gold">
          If something goes wrong
        </h2>
        <dl className="mt-3 space-y-3">
          {EMERGENCY.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[14px] font-semibold text-text">{k}</dt>
              <dd className="text-[13.5px] leading-relaxed text-muted">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[13px] text-muted">
          Emergency: dial <strong className="text-text">108</strong> for ambulance,{" "}
          <strong className="text-text">101</strong> for fire.
        </p>
      </section>
    </main>
  );
}
