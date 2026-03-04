import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getHomePathForUser } from '@/config/appRoles';
import type { SiteSetting } from '@/modules/website/types';
import type { CMSPage } from '@/modules/website/types';

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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const homePath = user ? getHomePathForUser(user) : '/login';

  const logoUrl = siteSetting?.logo
    ? (siteSetting.logo.startsWith('http') ? siteSetting.logo : `${MEDIA_BASE}${siteSetting.logo.startsWith('/') ? '' : '/'}${siteSetting.logo}`)
    : '/logo.png';

  return (
    <header className="border-b border-primary/20 bg-gradient-to-r from-card to-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logoUrl} alt={siteSetting?.name || 'EV Yatayat Sewa'} className="h-10 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</Link>
          {aboutSlug && (
            <Link to={`/page/${aboutSlug}`} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</Link>
          )}
          <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Service</a>
          <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Blog</Link>
          {headerPages.map((p) => (
            <Link key={p.id} to={`/page/${p.slug}`} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {p.title}
            </Link>
          ))}
          <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</a>
          <Link to="/app/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Login</Link>
        </nav>
        {isLoading ? (
          <Button disabled>Sign In</Button>
        ) : isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Link to={homePath}>
              <Button variant="outline" size="sm">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <Link to="/app/login">
            <Button size="sm">
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
