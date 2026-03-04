import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SiteSetting } from '@/modules/website/types';

const MEDIA_BASE = 'https://system.evyatayatsewa.com';

export function PublicFooter({
  siteSetting,
  aboutSlug,
}: {
  siteSetting: SiteSetting | null;
  aboutSlug?: string | null;
}) {
  const name = siteSetting?.name || 'EV Yatayat Sewa';
  const tagline = siteSetting?.tagline || '';
  const footerText = siteSetting?.footer_text || '';
  const phones = siteSetting?.phones ?? [];
  const emails = siteSetting?.emails ?? [];
  const address = siteSetting?.address || '';
  const logo = siteSetting?.logo;

  const logoUrl = logo
    ? (logo.startsWith('http') ? logo : `${MEDIA_BASE}${logo.startsWith('/') ? '' : '/'}${logo}`)
    : null;

  const quickLinks = [
    { label: 'Home', to: '/' },
    ...(aboutSlug ? [{ label: 'About', to: `/page/${aboutSlug}` }] : []),
    { label: 'Services', href: '#services' },
    { label: 'Blog', to: '/blog' },
    { label: 'Contact', href: '#contact' },
    { label: 'Login', to: '/app/login' },
  ];

  return (
    <footer className="relative overflow-hidden bg-slate-950 border-t border-white/8">
      {/* Background orbs */}
      <div className="orb w-[500px] h-[500px] bg-emerald-600/10 top-[-200px] left-[-100px] animate-float-orb-slow" />
      <div className="orb w-[400px] h-[400px] bg-blue-600/8 bottom-0 right-[-100px] animate-float-orb-reverse" />
      <div className="orb w-[300px] h-[300px] bg-violet-600/8 top-[20%] right-[30%] animate-float-orb" />

      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Brand column */}
          <div className="space-y-5 lg:col-span-1">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative">
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500/30 to-cyan-500/20 blur-sm" />
                  <img src={logoUrl} alt={name} className="relative h-10 w-auto object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <p className="font-bold text-white">{name}</p>
                {tagline && <p className="text-xs text-white/40">{tagline}</p>}
              </div>
            </div>
            <p className="text-sm text-white/45 leading-relaxed">
              {footerText || 'Powering Nepal\'s green transportation revolution with smart electric vehicles.'}
            </p>
            {/* App download hint */}
            <Link to="/app/login">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-panel border border-emerald-500/20 text-sm text-emerald-400 hover:border-emerald-500/40 transition-all duration-200"
              >
                <Zap className="w-4 h-4" />
                <span>Open App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.div>
            </Link>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-3 h-px bg-gradient-to-r from-emerald-400 to-cyan-400 block" />
              <span className="gradient-text-warm">Quick Links</span>
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link
                      to={link.to}
                      className="group flex items-center gap-2 text-sm text-white/45 hover:text-emerald-400 transition-colors duration-200"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-emerald-400 transition-all duration-200 rounded-full" />
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="group flex items-center gap-2 text-sm text-white/45 hover:text-emerald-400 transition-colors duration-200"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-emerald-400 transition-all duration-200 rounded-full" />
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-3 h-px bg-gradient-to-r from-blue-400 to-cyan-400 block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Contact</span>
            </h3>
            <ul className="space-y-4">
              {phones.length > 0 && (
                <li className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="space-y-0.5">
                    {phones.map((p, i) => (
                      <a
                        key={i}
                        href={`tel:${p}`}
                        className="block text-sm text-white/50 hover:text-blue-400 transition-colors duration-200"
                      >
                        {p}
                      </a>
                    ))}
                  </div>
                </li>
              )}
              {emails.length > 0 && (
                <li className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Mail className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="space-y-0.5">
                    {emails.map((e, i) => (
                      <a
                        key={i}
                        href={`mailto:${e}`}
                        className="block text-sm text-white/50 hover:text-violet-400 transition-colors duration-200 break-all"
                      >
                        {e}
                      </a>
                    ))}
                  </div>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">{address}</p>
                </li>
              )}
            </ul>
          </div>

          {/* About text */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-3 h-px bg-gradient-to-r from-violet-400 to-purple-400 block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-400">About Us</span>
            </h3>
            <p className="text-sm text-white/45 leading-relaxed">
              {footerText || 'EV Yatayat Sewa is Nepal\'s leading electric vehicle transportation service, committed to green and efficient commuting solutions.'}
            </p>
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-white/5">
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Powered by</p>
              <p className="text-sm font-semibold gradient-text">Electric Mobility</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/5">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} <span className="text-white/50">{name}</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow" />
            <span className="text-xs text-white/30">Green & Electric</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
