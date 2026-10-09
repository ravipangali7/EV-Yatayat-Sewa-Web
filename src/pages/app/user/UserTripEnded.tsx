import { Link, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { CitySkyline } from "@/components/illustrations/CitySkyline";
import { resolveAppRole, getAppRoleConfig } from "@/config/appRoles";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";

/** Presentational trip summary. Live trip payload is filled by the tracking screen when it exists. */
export default function UserTripEnded() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const role = resolveAppRole(user);
  const base = role ? getAppRoleConfig(role).basePath : "/app/user";

  return (
    <div className="min-h-screen px-5 pb-28 pt-10 text-center">
      <div className="relative mx-auto mb-4 h-24 w-full max-w-xs">
        <CitySkyline className="absolute inset-x-0 bottom-0 h-16 w-full" />
        <div className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--ev-primary)] text-white shadow-[var(--ev-shadow-btn)]">
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </div>
      </div>
      <h1 className="ev-wordmark text-2xl font-bold text-[var(--ev-text)]">{t("trip.ended")}</h1>
      <p className="mt-1 text-sm text-[var(--ev-text-muted)]">{t("trip.endedBody")}</p>
      <div className="mt-6 rounded-2xl bg-[var(--ev-surface)] p-4 text-left shadow-[var(--ev-shadow-card)]">
        {/* TODO(api): bind boarded/arriving times, vehicle and fare from the completed trip */}
        <p className="text-sm font-semibold text-[var(--ev-text)]">Trip {id}</p>
        <p className="mt-1 text-xs text-[var(--ev-text-muted)]">Your Location → Destination</p>
      </div>
      <div className="mt-6 space-y-3">
        <Link to={`${base}/booking?tab=my-booking`} className="ev-btn">
          View Ride Details
        </Link>
        <Link to={`${base}/trip/${id}/thanks`} className="block text-sm font-semibold text-[var(--ev-primary)]">
          Done
        </Link>
      </div>
    </div>
  );
}
