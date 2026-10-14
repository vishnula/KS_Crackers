// Decorative firework bursts behind the hero. Pure SVG so it costs no request,
// and the animation is CSS-only so it never blocks the page.
// Respects prefers-reduced-motion via globals.css.

const BURSTS = [
  { x: 18, y: 26, r: 15, colour: "#ff6b6b", delay: "0s" },
  { x: 50, y: 16, r: 19, colour: "#ffd43b", delay: "1.1s" },
  { x: 80, y: 30, r: 14, colour: "#4dd4ac", delay: "2.2s" },
  { x: 33, y: 52, r: 11, colour: "#b197fc", delay: "1.6s" },
  { x: 68, y: 56, r: 12, colour: "#45c4f5", delay: "0.6s" },
];

const RAYS = 12;

export function Fireworks() {
  return (
    <svg
      viewBox="0 0 100 70"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
      aria-hidden="true"
    >
      {BURSTS.map((burst, index) => (
        <g key={index} className="burst" style={{ animationDelay: burst.delay }}>
          {Array.from({ length: RAYS }, (_, ray) => {
            const angle = (ray / RAYS) * Math.PI * 2;
            return (
              <line
                key={ray}
                x1={burst.x + Math.cos(angle) * burst.r * 0.32}
                y1={burst.y + Math.sin(angle) * burst.r * 0.32}
                x2={burst.x + Math.cos(angle) * burst.r}
                y2={burst.y + Math.sin(angle) * burst.r}
                stroke={burst.colour}
                strokeWidth="0.55"
                strokeLinecap="round"
              />
            );
          })}
          {Array.from({ length: RAYS }, (_, ray) => {
            const angle = (ray / RAYS) * Math.PI * 2 + Math.PI / RAYS;
            return (
              <circle
                key={`dot-${ray}`}
                cx={burst.x + Math.cos(angle) * burst.r * 0.78}
                cy={burst.y + Math.sin(angle) * burst.r * 0.78}
                r="0.6"
                fill={burst.colour}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
