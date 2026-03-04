import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getHomePathForUser } from '@/config/appRoles';
import type { SiteSetting, CMSPage } from '@/modules/website/types';

const MEDIA_BASE = 'https://system.evyatayatsewa.com';

export function PublicHeader({
  siteSetting,
  headerPages,
  aboutSlug,
}: {
  siteSetting: SiteSetting | null;
  headerPages: CMSPage[];
  aboutSlug: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const homePath = user ? getHomePathForUser(user) : '/login';

  const logoUrl = siteSetting?.logo
    ? siteSetting.logo.startsWith('http')
      ? siteSetting.logo
      : `${MEDIA_BASE}${siteSetting.logo.startsWith('/') ? '' : '/'}${siteSetting.logo}`
    : '/logo.png';

  const navLinks = [
    { label: 'Home', to: '/' },
    ...(aboutSlug ? [{ label: 'About', to: `/page/${aboutSlug}` }] : []),
    { label: 'Services', to: '/services' },
    { label: 'Blog', to: '/blog' },
    ...headerPages.map((p) => ({ label: p.title, to: `/page/${p.slug}` })),
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logoUrl}
            alt={siteSetting?.name || 'EV Yatayat Sewa'}
            className="h-12 w-auto object-contain"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === l.to ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}

          {isLoading ? (
            <div className="w-20 h-9 rounded-lg bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to={homePath}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <button
                onClick={() => logout()}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/app/login"
              className="px-5 py-2 rounded-lg text-sm font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition"
            >
              Login
            </Link>
          )}
        </nav>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background pb-4">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block px-6 py-3 text-sm font-medium transition-colors hover:text-primary ${
                pathname === l.to ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}

          <div className="mx-6 mt-3">
            {isAuthenticated ? (
              <div className="flex gap-2">
                <Link
                  to={homePath}
                  onClick={() => setOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold gradient-primary text-primary-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/app/login"
                onClick={() => setOpen(false)}
                className="block text-center px-5 py-2.5 rounded-lg text-sm font-semibold gradient-primary text-primary-foreground"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
