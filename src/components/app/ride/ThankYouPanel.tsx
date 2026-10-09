import { BrandLockup } from "./BrandLockup";
import { SvgIcon } from "./SvgIcon";

export function ThankYouPanel({
  detail = "Thank you for choosing EV Yatayat. We hope to serve you again soon.",
}: {
  detail?: string;
}) {
  return (
    <div className="px-6 pb-8 pt-6 text-center">
      <BrandLockup size="sm" />
      <h2 className="mt-5 text-3xl font-extrabold text-[#1C8C42]">Thank You!</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#5E6B66]">{detail}</p>
      <div className="mt-5 flex flex-col items-center gap-1 text-[#1C8C42]">
        <SvgIcon name="leaf" className="h-7 w-7" />
        <p className="text-sm font-semibold leading-tight">
          Cleaner Transport
          <br />
          Greener Nepal
        </p>
      </div>
      <img src="/icons/mountains.svg" alt="" className="mx-auto mt-4 h-16 w-full max-w-xs object-contain" />
    </div>
  );
}
