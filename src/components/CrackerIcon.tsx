import type { IconKey } from "@/lib/categoryStyle";

// Flat two-tone illustrations drawn on a 24x24 grid. Inline rather than image
// files so they inherit the category colour and cost no extra request.

const PATHS: Record<IconKey, React.ReactNode> = {
  bomb: (
    <>
      <circle cx="11" cy="15" r="6.5" />
      <path d="M14 9.5l2-3M16 6.5l3 .5M16 6.5l.5-3" strokeWidth="1.6" fill="none" />
    </>
  ),
  pot: (
    <>
      <path d="M7 14h10l-1.2 6.5H8.2z" />
      <path d="M12 12V4M12 4l-2.5 3M12 4l2.5 3M8.5 11l-2-2.5M15.5 11l2-2.5" strokeWidth="1.6" fill="none" />
    </>
  ),
  chakkar: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <path
        d="M12 12c0-4 3-6 6-5.5M12 12c-4 0-6 3-5.5 6M12 12c4 0 6-3 5.5-6M12 12c0 4-3 6-6 5.5"
        strokeWidth="1.7"
        fill="none"
      />
    </>
  ),
  rocket: (
    <>
      <path d="M12 2.5c2.6 2.4 4 5.6 4 9v3H8v-3c0-3.4 1.4-6.6 4-9z" />
      <path d="M10 18l2 3.5 2-3.5M8 13l-2.5 2.5M16 13l2.5 2.5" strokeWidth="1.6" fill="none" />
    </>
  ),
  sparkler: (
    <>
      <path d="M8.5 20.5l7-10" strokeWidth="2" fill="none" />
      <circle cx="16.5" cy="8" r="2" />
      <path d="M16.5 3v2.4M16.5 10.6V13M21.5 8h-2.4M13.9 8H11.5M20 4.5l-1.7 1.7M14.7 9.8L13 11.5M20 11.5l-1.7-1.7M14.7 6.2L13 4.5" strokeWidth="1.3" fill="none" />
    </>
  ),
  fountain: (
    <>
      <path d="M8.5 15h7l-1 6.5h-5z" />
      <path d="M12 13V8M12 8c-2 0-3.5-1.5-3.5-3.5M12 8c2 0 3.5-1.5 3.5-3.5M9 12.5L6.5 9M15 12.5L17.5 9" strokeWidth="1.6" fill="none" />
    </>
  ),
  shot: (
    <>
      <path d="M6.5 21h11l-1-4h-9z" />
      <circle cx="12" cy="6" r="1.8" />
      <path d="M12 10.5V13M7.5 8l1.8 2M16.5 8l-1.8 2M5.5 12.5l2 1M18.5 12.5l-2 1" strokeWidth="1.5" fill="none" />
    </>
  ),
  star: (
    <>
      <path d="M12 2.8l2.6 6.1 6.6.6-5 4.3 1.5 6.4L12 16.8l-5.7 3.4 1.5-6.4-5-4.3 6.6-.6z" />
    </>
  ),
  toy: (
    <>
      <circle cx="12" cy="13" r="7" />
      <circle cx="9.6" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
      <path d="M9.3 15.6c1.6 1.6 4 1.6 5.6 0M12 6V3.2" strokeWidth="1.5" fill="none" />
    </>
  ),
  gift: (
    <>
      <path d="M4.5 10h15v10.5h-15z" />
      <path d="M4.5 10h15M12 10v10.5M12 10c-1-2.5-2-3.5-3.5-3.5S6 8 7 10M12 10c1-2.5 2-3.5 3.5-3.5S18 8 17 10" strokeWidth="1.6" fill="none" />
    </>
  ),
  string: (
    <>
      <path d="M4 5.5c4 2 12 2 16 0" strokeWidth="1.6" fill="none" />
      <path d="M6 6.5v4M9.3 7.4v4.5M12.7 7.6v4.5M16 7.1v4.3M19 5.9v3.8" strokeWidth="2.2" fill="none" />
      <circle cx="19.6" cy="11" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
};

export function CrackerIcon({
  icon,
  className = "",
}: {
  icon: IconKey;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[icon]}
    </svg>
  );
}
