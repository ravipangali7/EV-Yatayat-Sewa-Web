import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import AppLayout from "@/components/app/AppLayout";
import { BrandLockup } from "@/components/app/ride/BrandLockup";
import { RideOtp } from "@/components/app/ride/RideOtp";
import { RideShell } from "@/components/app/ride/RideShell";
import { SuccessMark } from "@/components/app/ride/SuccessMark";
import { SvgIcon } from "@/components/app/ride/SvgIcon";
import { rideBtn, rideField } from "@/components/app/ride/rideStyles";
import { authApi } from "@/modules/auth/services/authApi";
import { getDefaultPathForRole } from "@/config/appRoles";
import { toast } from "sonner";

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `+977 ${digits.slice(0, 2)}XXXX${digits.slice(-2)}`;
}

export default function AppRegister() {
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, secondsLeft]);

  const clock = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

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
      setSecondsLeft(90);
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
      setStep("success");
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

  const resend = () => {
    if (secondsLeft > 0) return;
    authApi.requestRegisterOtp(phone).then(() => {
      setSecondsLeft(90);
      toast.success("OTP resent");
    });
  };

  return (
    <AppLayout>
      <div className="ride-app min-h-screen">
        <div className="mx-auto min-h-screen w-full max-w-[430px] shadow-xl shadow-[#163024]/5">
          <RideShell hills={step !== "otp"}>
            <div className="px-6 pb-40 pt-8">
              {step === "otp" && (
                <button type="button" onClick={() => setStep("form")} className="mb-4 flex items-center text-[#163024]" aria-label="Back">
                  <SvgIcon name="chevron-left" className="h-6 w-6" />
                </button>
              )}

              {step !== "otp" && <BrandLockup />}

              {step === "form" && (
                <>
                  <h2 className="mt-8 text-[22px] font-extrabold text-[#163024]">Create Account</h2>
                  <p className="mt-1 text-sm text-[#6D7B74]">Enter your details to get started</p>
                  <form onSubmit={handleSendOtp} autoComplete="off" className="mt-5 space-y-3">
                    <Field icon="user" placeholder="Full Name" value={name} onChange={setName} />
                    <Field icon="phone" placeholder="Phone Number" value={phone} onChange={setPhone} type="tel" />
                    <Field icon="mail" placeholder="Email (optional)" value={email} onChange={setEmail} type="email" />
                    <PasswordInput
                      leftIcon={<SvgIcon name="lock" className="h-4 w-4" />}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={rideField}
                    />
                    <PasswordInput
                      leftIcon={<SvgIcon name="lock" className="h-4 w-4" />}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={rideField}
                    />
                    <Button type="submit" className={`${rideBtn} mt-2`} disabled={isLoading}>
                      {isLoading ? "Sending OTP..." : "Register"}
                    </Button>
                  </form>
                  <p className="mt-6 text-center text-sm text-[#6D7B74]">
                    Already have an account?{" "}
                    <Link to="/app/login" className="font-semibold text-[#1C8C42]">
                      Login
                    </Link>
                  </p>
                </>
              )}

              {step === "otp" && (
                <form onSubmit={handleVerifyAndRegister} className="pt-4">
                  <h2 className="text-center text-[22px] font-extrabold text-[#163024]">OTP Verification</h2>
                  <p className="mt-2 text-center text-sm leading-relaxed text-[#6D7B74]">
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
                    onClick={resend}
                    disabled={secondsLeft > 0}
                    className="mt-3 w-full text-center text-sm font-semibold text-[#1C8C42] disabled:text-[#9AA89F]"
                  >
                    Resend OTP
                  </button>
                </form>
              )}

              {step === "success" && (
                <div className="pt-6 text-center">
                  <SuccessMark />
                  <h2 className="mt-5 text-[22px] font-extrabold text-[#163024]">Registration Successful!</h2>
                  <p className="mt-1 text-sm text-[#6D7B74]">Welcome to EV Yatayat</p>
                  <div className="mt-6 text-left">
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold text-[#163024]">
                      <SvgIcon name="map-pin" className="h-4 w-4 text-[#1C8C42]" />
                      Where to go?
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = getDefaultPathForRole("user");
                      }}
                      className={`${rideField} flex w-full items-center justify-between px-3 text-left text-[#9AA89F]`}
                    >
                      Enter destination (e.g. Kathmandu)
                      <SvgIcon name="arrow-right" className="h-4 w-4 text-[#8AA094]" />
                    </button>
                  </div>
                  <Button
                    className={`${rideBtn} mt-4`}
                    onClick={() => {
                      window.location.href = getDefaultPathForRole("user");
                    }}
                  >
                    Continue
                  </Button>
                </div>
              )}
            </div>
          </RideShell>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="relative">
      <SvgIcon name={icon} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8AA094]" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${rideField} w-full pl-10 pr-3 outline-none`}
      />
    </div>
  );
}
