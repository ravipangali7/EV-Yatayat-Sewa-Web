/** Soft green hills pinned to the bottom of auth screens. */
export function HillsFooter() {
  return (
    <svg
      className="pointer-events-none absolute bottom-0 left-0 z-0 h-40 w-full"
      viewBox="0 0 480 160"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d="M0 90 C80 50 140 120 240 80 C340 40 400 100 480 70 L480 160 L0 160 Z" fill="var(--ev-illustration-hill-end)" />
      <path d="M0 110 C90 70 180 140 280 100 C360 70 420 120 480 96 L480 160 L0 160 Z" fill="var(--ev-illustration-hill)" />
      <g fill="var(--ev-primary-light)" opacity="0.35">
        <circle cx="70" cy="108" r="10" />
        <rect x="66" y="118" width="8" height="16" rx="2" />
        <circle cx="390" cy="100" r="12" />
        <rect x="385" y="112" width="10" height="18" rx="2" />
      </g>
    </svg>
  );
}
