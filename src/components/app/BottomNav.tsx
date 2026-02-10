import { NavLink, useLocation } from "react-router-dom";
import { Home, Car, Wallet, User, CalendarDays } from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface BottomNavProps {
  items: NavItem[];
}

const BottomNav = ({ items }: BottomNavProps) => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] app-surface border-t border-border z-50">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <span className={`${isActive ? "scale-110" : ""} transition-transform`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export const driverNavItems: NavItem[] = [
  { label: "Home", path: "/app/driver/home", icon: <Home size={20} /> },
  { label: "Vehicle", path: "/app/driver/vehicle", icon: <Car size={20} /> },
  { label: "Wallet", path: "/app/driver/wallet", icon: <Wallet size={20} /> },
  { label: "Profile", path: "/app/driver/profile", icon: <User size={20} /> },
];

export const userNavItems: NavItem[] = [
  { label: "Home", path: "/app/user/home", icon: <Home size={20} /> },
  { label: "Booking", path: "/app/user/booking", icon: <CalendarDays size={20} /> },
  { label: "Profile", path: "/app/user/profile", icon: <User size={20} /> },
];

export default BottomNav;
