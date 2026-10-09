export function CitySkyline({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 360 80" fill="none" aria-hidden>
      <path
        d="M0 80 V48 H18 V36 H28 V48 H40 V22 H52 V48 H70 V30 H86 V48 H100 V18 H108 V10 H116 V18 H124 V48 H150 V28 H168 V48 H190 V34 H210 V48 H230 V16 H246 V48 H270 V26 H290 V48 H320 V38 H340 V48 H360 V80 Z"
        fill="var(--ev-illustration-sky)"
        opacity="0.7"
      />
      <path d="M108 18 L112 6 L116 18" stroke="var(--ev-illustration-sky)" strokeWidth="2" />
    </svg>
  );
}
