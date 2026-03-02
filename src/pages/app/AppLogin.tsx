import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Phone, Lock } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/app/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/modules/auth/services/authApi";
import { resolveAppRole, getDefaultPathForRole } from "@/config/appRoles";
import { toast } from "sonner";

export default function AppLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("Please enter phone and password");
      return;
    }
    setIsLoading(true);
    try {
      const success = await login(phone, password);
      if (success) {
        const user = await authApi.getCurrentUser();
        toast.success("Welcome back!");
        const appRole = resolveAppRole(user);
        if (appRole === null) {
          navigate("/admin", { replace: true });
        } else {
          navigate(getDefaultPathForRole(appRole), { replace: true });
        }
      } else {
        toast.error("Invalid phone number or password");
      }
    } catch (err: unknown) {
      toast.error("Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-emerald-600 pt-16 pb-14 px-6 rounded-b-3xl shadow-xl shadow-primary/20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 shadow-lg">
              <img src="/logo.png" alt="EV Yatayat Sewa" className="h-10 w-10 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground">EV Yatayat Sewa</h1>
            <p className="text-primary-foreground/75 text-sm mt-1">Green rides, smart commute</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 px-6 pt-8"
        >
          <div className="bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-black/5 p-6 mb-6">
            <h2 className="text-xl font-bold mb-1">Welcome Back</h2>
            <p className="text-sm text-muted-foreground mb-5">Sign in to continue</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
              <PasswordInput
                leftIcon={<Lock size={16} />}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl"
              />

              <div className="text-right">
                <Link to="/app/forgot-password" className="text-xs text-primary font-semibold">
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/app/register" className="text-primary font-semibold">
              Register
            </Link>
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
