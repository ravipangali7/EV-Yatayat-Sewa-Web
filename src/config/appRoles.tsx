import type { ComponentType } from "react";
import { Home, Car, Wallet, User, CalendarDays, CreditCard } from "lucide-react";
import type { User as UserType } from "@/types";

// Driver pages
import DriverHome from "@/pages/app/driver/DriverHome";
import DriverVehicle from "@/pages/app/driver/Vehicle";
import DriverWallet from "@/pages/app/driver/DriverWallet";
import DriverProfile from "@/pages/app/driver/DriverProfile";
// User pages
import UserHome from "@/pages/app/user/UserHome";
import UserBooking from "@/pages/app/user/UserBooking";
import UserProfile from "@/pages/app/user/UserProfile";
import UserWallet from "@/pages/app/user/UserWallet";
import UserCard from "@/pages/app/user/UserCard";
import UserDeposit from "@/pages/app/user/UserDeposit";
import CardTopup from "@/pages/app/user/CardTopup";
import DealerRevenue from "@/pages/app/user/DealerRevenue";
import DealerProfile from "@/pages/app/user/DealerProfile";

export type AppRoleId = "driver" | "user" | "ticket_dealer";

export type AppNavIconName = "home" | "car" | "wallet" | "user" | "calendar" | "card";

export const APP_NAV_ICON_MAP: Record<
  AppNavIconName,
  ComponentType<{ size?: number }>
> = {
  home: Home,
  car: Car,
  wallet: Wallet,
  user: User,
  calendar: CalendarDays,
  card: CreditCard,
};

export interface AppNavItemConfig {
  label: string;
  path: string;
  icon: AppNavIconName;
}

export interface AppRoleConfig {
  basePath: string;
  defaultPath: string;
  navItems: AppNavItemConfig[];
  routes: Record<string, ComponentType>;
}

const APP_ROLE_CONFIG: Record<AppRoleId, AppRoleConfig> = {
  driver: {
    basePath: "/app/driver",
    defaultPath: "home",
    navItems: [
      { label: "Home", path: "home", icon: "home" },
      { label: "Vehicle", path: "vehicle", icon: "car" },
      { label: "Wallet", path: "wallet", icon: "wallet" },
      { label: "Profile", path: "profile", icon: "user" },
    ],
    routes: {
      home: DriverHome,
      vehicle: DriverVehicle,
      wallet: DriverWallet,
      profile: DriverProfile,
    },
  },
  user: {
    basePath: "/app/user",
    defaultPath: "home",
    navItems: [
      { label: "Home", path: "home", icon: "home" },
      { label: "Booking", path: "booking", icon: "calendar" },
      { label: "Wallet", path: "wallet", icon: "wallet" },
      { label: "Card", path: "card", icon: "card" },
      { label: "Profile", path: "profile", icon: "user" },
    ],
    routes: {
      home: UserHome,
      booking: UserBooking,
      wallet: UserWallet,
      card: UserCard,
      profile: UserProfile,
      deposit: UserDeposit,
      "card/topup": CardTopup,
    },
  },
  ticket_dealer: {
    basePath: "/app/ticket-dealer",
    defaultPath: "home",
    navItems: [
      { label: "Home", path: "home", icon: "home" },
      { label: "Book", path: "booking", icon: "calendar" },
      { label: "Wallet", path: "wallet", icon: "wallet" },
      { label: "Profile", path: "profile", icon: "user" },
    ],
    routes: {
      home: UserHome,
      booking: UserBooking,
      wallet: UserWallet,
      card: UserCard,
      profile: DealerProfile,
      revenue: DealerRevenue,
      deposit: UserDeposit,
      "card/topup": CardTopup,
    },
  },
};

export function getAppRoleConfig(roleId: AppRoleId): AppRoleConfig {
  return APP_ROLE_CONFIG[roleId];
}

export function getDefaultPathForRole(roleId: AppRoleId): string {
  const config = APP_ROLE_CONFIG[roleId];
  return `${config.basePath}/${config.defaultPath}`;
}

export function getAppRoles(): AppRoleId[] {
  return Object.keys(APP_ROLE_CONFIG) as AppRoleId[];
}

/**
 * Resolves app role from user. Returns null for admin (staff/superuser).
 */
export function resolveAppRole(user: UserType | null): AppRoleId | null {
  if (!user) return null;
  if (user.is_staff || user.is_superuser) return null;
  if (user.is_driver) return "driver";
  if (user.is_ticket_dealer) return "ticket_dealer";
  return "user";
}

/**
 * Home path for a user: /admin for superuser, else app portal by role. Use for redirects when already logged in or after login.
 */
export function getHomePathForUser(user: UserType | null): string {
  if (!user) return "/app/login";
  if (user.is_superuser) return "/admin";
  const role = resolveAppRole(user);
  return role ? getDefaultPathForRole(role) : "/app/login";
}
