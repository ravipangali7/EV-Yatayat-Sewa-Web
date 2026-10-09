export function MountainsOutline({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 360 72" fill="none" aria-hidden>
      <path
        d="M0 60 L40 38 L70 52 L110 18 L150 48 L190 22 L230 50 L270 28 L310 46 L360 24"
        stroke="var(--ev-illustration-sky)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M20 64 L60 46 L90 58 L130 34 L170 56 L210 40 L250 58 L300 42 L360 52" stroke="var(--ev-mint-200)" strokeWidth="1.5" />
    </svg>
  );
}
