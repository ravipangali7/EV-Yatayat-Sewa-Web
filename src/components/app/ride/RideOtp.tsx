import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const slotClass =
  "h-12 w-11 rounded-xl border border-[#E4EEE8] bg-white text-lg font-semibold text-[#163024] shadow-sm first:rounded-xl last:rounded-xl first:border";

export function RideOtp({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <InputOTP maxLength={6} value={value} onChange={onChange}>
      <InputOTPGroup className="gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot key={index} index={index} className={slotClass} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
