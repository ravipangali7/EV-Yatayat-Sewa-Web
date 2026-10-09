import { SvgIcon } from "./SvgIcon";

export function SuccessMark({ className = "" }: { className?: string }) {
  return (
    <div className={`mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#E7F8EC] ${className}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1C8C42] shadow-sm">
        <SvgIcon name="check" className="h-8 w-8 text-white" />
      </div>
    </div>
  );
}
