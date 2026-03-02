import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/app/AppLayout";
import { authApi } from "@/modules/auth/services/authApi";
import { toast } from "sonner";

const RESET_TOKEN_KEY = "app_reset_token";

export default function AppResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      toast.success("Password reset successfully!");
      navigate("/app/login", { replace: true });
    } catch {
      toast.error("Failed to reset password. Token may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (resetToken === null) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-emerald-600 pt-14 pb-12 px-6 rounded-b-3xl shadow-xl shadow-primary/20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={22} className="text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-primary-foreground">Reset Password</h1>
            <p className="text-primary-foreground/75 text-xs mt-1">Set your new secure password</p>
          </motion.div>
        </div>

        <div className="flex-1 px-6 pt-8">
          <div className="bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-black/5 p-6 mb-5">
            <form onSubmit={handleReset} className="space-y-4">
              <PasswordInput
                leftIcon={<Lock size={16} />}
                placeholder="New Password"
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
              <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </div>

          <Link to="/app/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
