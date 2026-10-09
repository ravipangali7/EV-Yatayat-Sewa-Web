import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import AppLayout from "@/components/app/AppLayout";
import { BrandLockup } from "@/components/app/ride/BrandLockup";
import { RideShell } from "@/components/app/ride/RideShell";
import { SvgIcon } from "@/components/app/ride/SvgIcon";
import { rideBtn, rideField } from "@/components/app/ride/rideStyles";
import { LanguageToggle } from "@/components/ev/LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";
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
  const { t } = useI18n();

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
      <RideShell>
        <div className="relative px-5 pb-40 pt-8">
          <div className="absolute right-5 top-5">
            <LanguageToggle />
          </div>
          <div className="pt-6">
            <BrandLockup />
          </div>
          <h2 className="ev-wordmark mt-8 text-xl font-bold text-[var(--ev-text)]">{t("login.title")}</h2>
          <p className="mt-1 text-sm text-[var(--ev-text-muted)]">{t("login.welcome")}</p>

          <form onSubmit={handleLogin} autoComplete="off" className="mt-5 space-y-3">
            <label className="sr-only" htmlFor="login-username">{t("login.username")}</label>
            <div className="relative">
              <SvgIcon name="user" className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--ev-text-muted)]" />
              <input
                id="login-username"
                type="text"
                inputMode="tel"
                autoComplete="username"
                placeholder={t("login.username")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${rideField} pl-10`}
              />
            </div>
            <PasswordInput
              leftIcon={<SvgIcon name="lock" className="h-[18px] w-[18px]" />}
              placeholder={t("login.password")}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={rideField}
            />
            <Button type="submit" className={rideBtn} disabled={isLoading}>
              {isLoading ? t("login.signingIn") : t("login.submit")}
            </Button>
            <div className="text-center">
              <Link to="/app/forgot-password" className="text-sm font-semibold text-[var(--ev-primary)]">
                {t("login.forgot")}
              </Link>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--ev-text-muted)]">
            {t("login.noAccount")}{" "}
            <Link to="/app/register" className="font-semibold text-[var(--ev-primary)]">
              {t("login.register")}
            </Link>
          </p>
        </div>
      </RideShell>
    </AppLayout>
  );
}
