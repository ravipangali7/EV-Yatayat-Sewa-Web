import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ArrowLeft, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/app/AppLayout";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authApi } from "@/modules/auth/services/authApi";
import { toast } from "sonner";

const RESET_TOKEN_KEY = "app_reset_token";

export default function AppForgotPassword() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
      <div className="min-h-screen flex flex-col px-6">
        <div className="pt-12 pb-6">
          <Link to="/app/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-6">
            <ArrowLeft size={16} /> Back to Login
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
              <KeyRound size={24} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold">
              {step === "phone" ? "Forgot Password?" : "Enter OTP"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {step === "phone"
                ? "Enter your phone number to receive OTP"
                : `We sent a code to ${phone}`}
            </p>
          </motion.div>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-12 rounded-xl" />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={isLoading || otp.length !== 6}>
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive?{" "}
              <button type="button" className="text-primary font-semibold" onClick={() => authApi.forgotPassword(phone).then(() => toast.success("OTP resent"))}>
                Resend
              </button>
            </p>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
