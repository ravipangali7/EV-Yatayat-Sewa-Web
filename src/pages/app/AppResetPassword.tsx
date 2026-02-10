import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/app/AppLayout";
import { authApi } from "@/modules/auth/services/authApi";
import { toast } from "sonner";

const RESET_TOKEN_KEY = "app_reset_token";

export default function AppResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="min-h-screen flex items-center justify-center">Loading...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen flex flex-col px-6">
        <div className="pt-12 pb-6">
          <Link to="/app/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-6">
            <ArrowLeft size={16} /> Back to Login
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
              <ShieldCheck size={24} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold">Reset Password</h1>
            <p className="text-sm text-muted-foreground mt-1">Create a new secure password</p>
          </motion.div>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-xl"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12 rounded-xl" />
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
