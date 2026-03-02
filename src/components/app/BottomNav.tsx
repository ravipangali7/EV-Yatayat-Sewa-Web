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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 dark:bg-card/90 backdrop-blur-xl border-t border-border/60 shadow-lg shadow-black/5 z-50">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15 text-primary rounded-xl px-2.5 py-1 scale-105"
                    : ""
                }`}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
