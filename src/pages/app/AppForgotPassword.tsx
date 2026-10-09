import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/app/AppLayout";
import { BrandLockup } from "@/components/app/ride/BrandLockup";
import { RideOtp } from "@/components/app/ride/RideOtp";
import { RideShell } from "@/components/app/ride/RideShell";
import { SvgIcon } from "@/components/app/ride/SvgIcon";
import { rideBtn, rideField } from "@/components/app/ride/rideStyles";
import { authApi } from "@/modules/auth/services/authApi";
import { toast } from "sonner";

const RESET_TOKEN_KEY = "app_reset_token";

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `+977 ${digits.slice(0, 2)}XXXX${digits.slice(-2)}`;
}

export default function AppForgotPassword() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, [step, secondsLeft]);

  const clock = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Enter your phone number");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.forgotPassword(phone);
      setStep("otp");
      setSecondsLeft(90);
      toast.success("OTP sent to your phone");
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp);
      sessionStorage.setItem(RESET_TOKEN_KEY, res.reset_token);
      navigate("/app/reset-password", { replace: true });
    } catch {
      toast.error("Invalid or expired OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="ride-app min-h-screen">
        <div className="mx-auto min-h-screen w-full max-w-[430px] shadow-xl shadow-[#163024]/5">
          <RideShell hills={step !== "otp"}>
            <div className="px-6 pb-40 pt-8">
              <Link to="/app/login" className="mb-4 inline-flex text-[#163024]" aria-label="Back">
                <SvgIcon name="chevron-left" className="h-6 w-6" />
              </Link>
              {step === "phone" ? (
                <>
                  <BrandLockup size="sm" />
                  <h2 className="mt-6 text-[22px] font-extrabold text-[#163024]">Forgot Password?</h2>
                  <p className="mt-1 text-sm text-[#6D7B74]">We will send a 6 digit code to your phone</p>
                  <form onSubmit={handleSendOtp} className="mt-5 space-y-3">
                    <div className="relative">
                      <SvgIcon name="phone" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8AA094]" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`${rideField} w-full pl-10 pr-3 outline-none`}
                      />
                    </div>
                    <Button type="submit" className={rideBtn} disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send OTP"}
                    </Button>
                  </form>
                </>
              ) : (
                <form onSubmit={handleVerifyOtp} className="pt-4">
                  <h2 className="text-center text-[22px] font-extrabold text-[#163024]">OTP Verification</h2>
                  <p className="mt-2 text-center text-sm text-[#6D7B74]">
                    We have sent a 6 digit code to
                    <br />
                    <span className="font-semibold text-[#163024]">{maskPhone(phone)}</span>
                  </p>
                  <div className="mt-6 flex justify-center">
                    <RideOtp value={otp} onChange={setOtp} />
                  </div>
                  <p className="mt-4 text-center text-sm text-[#6D7B74]">
                    Resend OTP in <span className="font-semibold text-[#1C8C42]">{clock}</span>
                  </p>
                  <Button type="submit" className={`${rideBtn} mt-4`} disabled={isLoading || otp.length !== 6}>
                    {isLoading ? "Verifying..." : "Verify"}
                  </Button>
                  <button
                    type="button"
                    disabled={secondsLeft > 0}
                    className="mt-3 w-full text-sm font-semibold text-[#1C8C42] disabled:text-[#9AA89F]"
                    onClick={() =>
                      authApi.forgotPassword(phone).then(() => {
                        setSecondsLeft(90);
                        toast.success("OTP resent");
                      })
                    }
                  >
                    Resend OTP
                  </button>
                </form>
              )}
            </div>
          </RideShell>
        </div>
      </div>
    </AppLayout>
  );
}
