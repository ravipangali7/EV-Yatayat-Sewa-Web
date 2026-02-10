import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/app/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/modules/auth/services/authApi";
import { toast } from "sonner";

export default function AppLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        if (user.is_staff || user.is_superuser) {
          navigate("/admin", { replace: true });
        } else if (user.is_driver) {
          navigate("/app/driver/home", { replace: true });
        } else {
          navigate("/app/user/home", { replace: true });
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
      <div className="min-h-screen flex flex-col">
        <div className="gradient-primary pt-16 pb-12 px-6 rounded-b-[2rem]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <img src="/logo.png" alt="EV Yatayat Sewa" className="mx-auto h-12 w-auto object-contain mb-4" />
            <p className="text-primary-foreground/80 text-sm mt-1">Green rides, smart commute</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 px-6 pt-8"
        >
          <h2 className="text-xl font-bold mb-1">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your account</p>

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
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="text-right">
              <Link to="/app/forgot-password" className="text-xs text-primary font-medium">
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
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
