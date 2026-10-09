import { Link } from "react-router-dom";
import { Leaf, MessageCircle } from "lucide-react";
import { BrandLockup } from "@/components/app/ride/BrandLockup";
import { MountainsOutline } from "@/components/illustrations/MountainsOutline";
import { resolveAppRole, getAppRoleConfig } from "@/config/appRoles";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";

export default function UserTripThanks() {
  const { user } = useAuth();
  const { t } = useI18n();
  const role = resolveAppRole(user);
  const base = role ? getAppRoleConfig(role).basePath : "/app/user";

  return (
    <div className="flex min-h-screen flex-col px-5 pb-10 pt-10 text-center">
      <BrandLockup />
      <h1 className="ev-wordmark mt-6 text-[30px] font-bold text-[var(--ev-primary)]">{t("thanks.title")}</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[var(--ev-text-muted)]">{t("thanks.body")}</p>
      <div className="mt-5 rounded-2xl border border-[var(--ev-mint-200)] bg-[var(--ev-mint-100)] p-4 text-left">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--ev-primary-dark)]">
          <MessageCircle className="h-4 w-4" />
          {t("thanks.stay")}
        </p>
        <p className="mt-1 text-sm text-[var(--ev-text-body)]">{t("thanks.stayBody")}</p>
      </div>
      <div className="mt-6 flex flex-col items-center text-[var(--ev-primary)]">
        <Leaf className="h-6 w-6" />
        <p className="mt-1 text-sm font-semibold leading-tight">
          {t("thanks.cleaner1")}
          <br />
          {t("thanks.cleaner2")}
        </p>
      </div>
      <MountainsOutline className="mx-auto mt-4 h-16 w-full" />
      <Link to={`${base}/home`} className="ev-btn mt-auto">
        {t("thanks.home")}
      </Link>
    </div>
  );
}
