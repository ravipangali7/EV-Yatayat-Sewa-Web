import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  MapPin, 
  Route as RouteIcon, 
  Bus, 
  Menu, 
  X, 
  LogOut,
  Wallet,
  Receipt,
  ChevronDown,
  Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', path: '/app', icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: 'Users', path: '/app/users', icon: <Users className="w-5 h-5" /> },
      { label: 'Wallets', path: '/app/wallets', icon: <Wallet className="w-5 h-5" /> },
      { label: 'Transactions', path: '/app/transactions', icon: <Receipt className="w-5 h-5" /> },
      { label: 'Settings', path: '/app/settings', icon: <Settings className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Booking',
    items: [
      { label: 'Places', path: '/app/places', icon: <MapPin className="w-5 h-5" /> },
      { label: 'Routes', path: '/app/routes', icon: <RouteIcon className="w-5 h-5" /> },
      { label: 'Vehicles', path: '/app/vehicles', icon: <Bus className="w-5 h-5" /> },
      { label: 'Seat Bookings', path: '/app/seat-bookings', icon: <Ticket className="w-5 h-5" /> },
    ],
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['Main', 'Booking']);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSection = (title: string) => {
    setOpenSections(prev => 
      prev.includes(title) 
        ? prev.filter(s => s !== title) 
        : [...prev, title]
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Link to="/app" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Bus className="w-6 h-6 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <span className="text-xl font-bold text-sidebar-foreground">FleetHub</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {navSections.map((section) => (
          <Collapsible
            key={section.title}
            open={openSections.includes(section.title)}
            onOpenChange={() => toggleSection(section.title)}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors">
                {sidebarOpen && <span>{section.title}</span>}
                {sidebarOpen && (
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    openSections.includes(section.title) && "rotate-180"
                  )} />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 mt-1">
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={cn(
                      'sidebar-link',
                      isActive(item.path) && 'sidebar-link-active'
                    )}
                  >
                    {item.icon}
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-foreground">
              {user?.name?.charAt(0) || 'A'}
            </span>
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.phone}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setMobileSidebarOpen(!mobileSidebarOpen);
                }
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
