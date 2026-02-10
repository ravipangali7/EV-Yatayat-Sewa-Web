import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock, Eye, EyeOff, User, Mail } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/app/AppLayout";
import { authApi } from "@/modules/auth/services/authApi";
import { toast } from "sonner";

export default function AppRegister() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
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
      const res = await authApi.register({
        name,
        phone,
        email: email || undefined,
        password,
      });
      localStorage.setItem("auth_token", res.token);
      localStorage.setItem("auth_user", JSON.stringify(res.user));
      toast.success("Account created! Welcome.");
      window.location.href = "/app/user/home";
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { phone?: string[] } } }).response?.data?.phone?.[0]
        : null;
      toast.error(msg || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen flex flex-col">
        <div className="gradient-primary pt-12 pb-8 px-6 rounded-b-[2rem]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <img src="/logo.png" alt="EV Yatayat Sewa" className="mx-auto h-10 w-auto object-contain mb-3" />
            <h1 className="text-xl font-bold text-primary-foreground">Create Account</h1>
            <p className="text-primary-foreground/80 text-xs mt-1">Join EV Yatayat Sewa</p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 px-6 pt-6">
          <form onSubmit={handleRegister} className="space-y-3">
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
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
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

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold mt-2" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Register"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 pb-8">
            Already have an account?{" "}
            <Link to="/app/login" className="text-primary font-semibold">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
