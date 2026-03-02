import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Phone, Lock, User, Mail } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/app/AppLayout";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authApi } from "@/modules/auth/services/authApi";
import { getDefaultPathForRole } from "@/config/appRoles";
import { toast } from "sonner";

export default function AppRegister() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!name || !phone || !password) {
      toast.error("Name, phone and password are required");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.requestRegisterOtp(phone);
      setStep("otp");
      toast.success("OTP sent to your phone");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { phone?: string[] } } }).response?.data?.phone?.[0]
          : null;
      toast.error(msg || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.registerVerifyOtp({
        phone,
        otp_code: otp,
        name,
        email: email || undefined,
        password,
      });
      localStorage.setItem("auth_token", res.token);
      localStorage.setItem("auth_user", JSON.stringify(res.user));
      toast.success("Account created! Welcome.");
      window.location.href = getDefaultPathForRole("user");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: Record<string, string[]> } }).response?.data
          : null;
      const firstError =
        msg && typeof msg === "object"
          ? Object.values(msg).flat().find((s) => typeof s === "string") ?? null
          : null;
      toast.error(firstError || "Invalid OTP or registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-emerald-600 pt-14 pb-12 px-6 rounded-b-3xl shadow-xl shadow-primary/20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 shadow-lg">
              <img src="/logo.png" alt="EV Yatayat Sewa" className="h-9 w-9 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-primary-foreground">
              {step === "form" ? "Create Account" : "Verify Phone"}
            </h1>
            <p className="text-primary-foreground/75 text-xs mt-1">
              {step === "form" ? "Join EV Yatayat Sewa today" : `OTP sent to ${phone}`}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 px-6 pt-6"
        >
          <div className="bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-black/5 p-6 mb-5">
            {step === "form" ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-12 rounded-xl" />
                </div>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-12 rounded-xl" />
                </div>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl" />
                </div>
                <PasswordInput
                  leftIcon={<Lock size={16} />}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl"
                />
                <PasswordInput
                  leftIcon={<Lock size={16} />}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-xl"
                />
                <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold mt-2" disabled={isLoading}>
                  {isLoading ? "Sending OTP..." : "Continue"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndRegister} className="space-y-5">
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
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Didn&apos;t receive?{" "}
                  <button
                    type="button"
                    className="text-primary font-semibold"
                    onClick={() => authApi.requestRegisterOtp(phone).then(() => toast.success("OTP resent"))}
                  >
                    Resend OTP
                  </button>
                </p>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("form")}>
                  Back
                </Button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground pb-8">
            Already have an account?{" "}
            <Link to="/app/login" className="text-primary font-semibold">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
