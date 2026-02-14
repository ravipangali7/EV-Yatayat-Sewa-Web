import { NavLink, useLocation } from "react-router-dom";

export interface NavItem {
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

export default BottomNav;
