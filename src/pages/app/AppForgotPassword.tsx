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
      <div className="min-h-screen flex flex-col bg-background">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-emerald-600 pt-14 pb-12 px-6 rounded-b-3xl shadow-xl shadow-primary/20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
              <KeyRound size={22} className="text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-primary-foreground">
              {step === "phone" ? "Forgot Password?" : "Verify Phone"}
            </h1>
            <p className="text-primary-foreground/75 text-xs mt-1">
              {step === "phone" ? "We'll send a verification code" : `OTP sent to ${phone}`}
            </p>
          </motion.div>
        </div>

        <div className="flex-1 px-6 pt-8">
          <div className="bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-black/5 p-6 mb-5">
            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input type="tel" placeholder="Your registered phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-12 rounded-xl" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <p className="text-sm text-muted-foreground text-center">Enter the 6-digit code sent to <strong>{phone}</strong></p>
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
                    Resend OTP
                  </button>
                </p>
              </form>
            )}
          </div>

          <Link to="/app/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
