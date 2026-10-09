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
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50" aria-label="Primary">
      <div className="pointer-events-auto mx-auto flex h-16 max-w-[480px] items-stretch justify-around border-t border-[var(--ev-border)] bg-[var(--ev-surface)] pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1"
            >
              <span
                className={`flex h-7 items-center justify-center rounded-full px-3 ${
                  isActive ? "bg-[var(--ev-mint-100)] text-[var(--ev-primary)]" : "text-[var(--ev-text-muted)]"
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`max-w-full truncate text-center text-[11px] font-medium leading-tight ${
                  isActive ? "text-[var(--ev-primary)]" : "text-[var(--ev-text-muted)]"
                }`}
              >
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
