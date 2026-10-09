import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import AppLayout from "@/components/app/AppLayout";
import { BrandLockup } from "@/components/app/ride/BrandLockup";
import { RideShell } from "@/components/app/ride/RideShell";
import { SvgIcon } from "@/components/app/ride/SvgIcon";
import { rideBtn, rideField } from "@/components/app/ride/rideStyles";
import { authApi } from "@/modules/auth/services/authApi";
import { toast } from "sonner";

const RESET_TOKEN_KEY = "app_reset_token";

export default function AppResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem(RESET_TOKEN_KEY);
    setResetToken(token);
    if (!token) navigate("/app/forgot-password", { replace: true });
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.changePassword(resetToken, password);
      sessionStorage.removeItem(RESET_TOKEN_KEY);
      setDone(true);
    } catch {
      toast.error("Failed to reset password. Token may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (resetToken === null) {
    return (
      <AppLayout>
        <div className="ride-shell flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1C8C42] border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <RideShell>
        <div className="px-5 pb-40 pt-8">
              <Link to="/app/login" className="mb-2 inline-flex text-[#163024]" aria-label="Back">
                <SvgIcon name="chevron-left" className="h-6 w-6" />
              </Link>
              <BrandLockup size="sm" />
              <h2 className="mt-6 text-[22px] font-extrabold text-[#163024]">Set Password</h2>
              <p className="mt-1 text-sm text-[#6D7B74]">Create a strong password to secure your account.</p>

              {!done ? (
                <form onSubmit={handleReset} autoComplete="off" className="mt-5 space-y-3">
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
                    {isLoading ? "Saving..." : "Update Password"}
                  </Button>
                </form>
              ) : (
                <div className="mt-6 rounded-2xl border border-[#D7F0DF] bg-[#F3FBF6] p-5 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1C8C42]">
                    <SvgIcon name="check" className="h-6 w-6 text-white" />
                  </div>
                  <p className="mt-3 text-base font-extrabold text-[#1C8C42]">Registration Successful!</p>
                  <p className="mt-1 text-sm text-[#6D7B74]">Your password has been updated.</p>
                  <Button className={`${rideBtn} mt-4`} onClick={() => navigate("/app/login", { replace: true })}>
                    Continue
                  </Button>
                </div>
              )}
            </div>
      </RideShell>
    </AppLayout>
  );
}
