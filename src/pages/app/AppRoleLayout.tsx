import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/app/AppLayout";
import BottomNav from "@/components/app/BottomNav";
import {
  getAppRoleConfig,
  getDefaultPathForRole,
  resolveAppRole,
  APP_NAV_ICON_MAP,
  type AppRoleId,
} from "@/config/appRoles";
import { useEffect } from "react";

interface AppRoleLayoutProps {
  role: AppRoleId;
}

export default function AppRoleLayout({ role }: AppRoleLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const config = getAppRoleConfig(role);

  const userAppRole = resolveAppRole(user);
  const isWrongRole = userAppRole !== null && userAppRole !== role;

  useEffect(() => {
    if (isWrongRole && userAppRole) {
      navigate(getDefaultPathForRole(userAppRole), { replace: true });
    }
  }, [isWrongRole, userAppRole, navigate]);

  const navItems = config.navItems.map((item) => {
    const Icon = APP_NAV_ICON_MAP[item.icon];
    const path = `${config.basePath}/${item.path}`.replace(/\/+/g, "/");
    return {
      label: item.label,
      path,
      icon: Icon ? <Icon size={20} /> : null,
    };
  });

  if (isWrongRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Redirecting...</div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav items={navItems} />
    </AppLayout>
  );
}
