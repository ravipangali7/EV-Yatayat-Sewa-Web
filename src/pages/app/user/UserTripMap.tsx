import { Link } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { UserHomeMap } from "@/components/app/UserHomeMap";
import { resolveAppRole, getAppRoleConfig } from "@/config/appRoles";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";

/** Full-screen short-trip map. Booking still goes through the existing map flow. */
export default function UserTripMap() {
  const { user } = useAuth();
  const { t } = useI18n();
  const role = resolveAppRole(user);
  const base = role ? getAppRoleConfig(role).basePath : "/app/user";

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar title={t("where.title")} showBack />
      <div className="relative min-h-[70vh] flex-1">
        <UserHomeMap />
      </div>
      <div className="px-5 pb-24">
        <p className="py-3 text-center text-xs text-[var(--ev-text-muted)]">{t("where.caption")}</p>
        <Link to={`${base}/home`} className="ev-btn">
          {t("where.search")}
        </Link>
      </div>
    </div>
  );
}
