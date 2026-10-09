import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import AppLayout from "@/components/app/AppLayout";
import { BrandLockup } from "@/components/app/ride/BrandLockup";
import { RideShell } from "@/components/app/ride/RideShell";
import { SvgIcon } from "@/components/app/ride/SvgIcon";
import { rideBtn, rideField } from "@/components/app/ride/rideStyles";
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
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="ride-app min-h-screen">
        <div className="mx-auto min-h-screen w-full max-w-[430px] shadow-xl shadow-[#163024]/5">
          <RideShell>
            <div className="px-6 pb-40 pt-12">
              <BrandLockup />
              <h2 className="mt-8 text-[22px] font-extrabold text-[#163024]">Login</h2>
              <p className="mt-1 text-sm text-[#6D7B74]">Welcome back!</p>

              <form onSubmit={handleLogin} autoComplete="off" className="mt-5 space-y-3">
                <div className="relative">
                  <SvgIcon name="user" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8AA094]" />
                  <input
                    type="tel"
                    placeholder="Username / Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${rideField} w-full pl-10 pr-3 outline-none`}
                  />
                </div>
                <PasswordInput
                  leftIcon={<SvgIcon name="lock" className="h-4 w-4" />}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={rideField}
                />
                <div className="text-center">
                  <Link to="/app/forgot-password" className="text-sm font-semibold text-[#1C8C42]">
                    Forgot Password?
                  </Link>
                </div>
                <Button type="submit" className={rideBtn} disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Login"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-[#6D7B74]">
                Don&apos;t have an account?{" "}
                <Link to="/app/register" className="font-semibold text-[#1C8C42]">
                  Register
                </Link>
              </p>
            </div>
          </RideShell>
        </div>
      </div>
    </AppLayout>
  );
}
