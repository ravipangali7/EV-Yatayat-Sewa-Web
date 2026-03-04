import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, LogOut, Menu, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getHomePathForUser } from '@/config/appRoles';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const logoUrl = siteSetting?.logo
    ? (siteSetting.logo.startsWith('http') ? siteSetting.logo : `${MEDIA_BASE}${siteSetting.logo.startsWith('/') ? '' : '/'}${siteSetting.logo}`)
    : '/logo.png';

  const navLinks = [
    { label: 'Home', to: '/' },
    ...(aboutSlug ? [{ label: 'About', to: `/page/${aboutSlug}` }] : []),
    { label: 'Services', href: '#services' },
    { label: 'Blog', to: '/blog' },
    ...headerPages.map((p) => ({ label: p.title, to: `/page/${p.slug}` })),
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            : 'bg-transparent backdrop-blur-md border-b border-white/5'
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="relative"
            >
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-blue-500/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img
                src={logoUrl}
                alt={siteSetting?.name || 'EV Yatayat Sewa'}
                className="relative h-10 w-auto object-contain"
              />
            </motion.div>
            {siteSetting?.name && (
              <span className="hidden sm:block font-bold text-white text-sm leading-tight max-w-[120px]">
                {siteSetting.name}
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className="relative px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-4/5 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-300" />
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="relative px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-4/5 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-300" />
                </a>
              )
            ))}
          </nav>

          {/* CTA Area */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="w-24 h-9 rounded-lg bg-white/10 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to={homePath}>
                  <Button variant="outline" size="sm" className="border-white/20 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => logout()} className="text-white/70 hover:text-white hover:bg-white/10">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/app/login" className="hidden md:block">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 glow-green-sm"
                >
                  <span className="shimmer absolute inset-0" />
                  <Zap className="w-4 h-4 relative" />
                  <span className="relative">Sign In</span>
                  <ArrowRight className="w-4 h-4 relative" />
                </motion.button>
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="w-5 h-5" />
                  </motion.span>
                ) : (
                  <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="w-5 h-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-16 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl"
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  {link.to ? (
                    <Link
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium"
                    >
                      {link.label}
                    </a>
                  )}
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pt-4 border-t border-white/10"
              >
                {isAuthenticated ? (
                  <div className="flex gap-2">
                    <Link to={homePath} onClick={() => setMobileOpen(false)} className="flex-1">
                      <Button variant="outline" className="w-full border-white/20 text-white bg-white/10">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" onClick={() => { logout(); setMobileOpen(false); }} className="text-white/70 hover:text-white">
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Link to="/app/login" onClick={() => setMobileOpen(false)}>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 glow-green-sm">
                      <Zap className="w-4 h-4" />
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
