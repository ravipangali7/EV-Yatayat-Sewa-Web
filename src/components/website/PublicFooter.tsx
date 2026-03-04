import { Link } from 'react-router-dom';
import { Bus, Mail, Phone, MapPin } from 'lucide-react';
import type { SiteSetting } from '@/modules/website/types';

const SERVICE_LINKS = [
  'City Transport',
  'Corporate Shuttle',
  'Tourism & Travel',
  'Charter Service',
  'Airport Transfer',
  'School Transport',
];

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

  const quickLinks = [
    { label: 'Home', to: '/' },
    ...(aboutSlug ? [{ label: 'About', to: `/page/${aboutSlug}` }] : []),
    { label: 'Services', to: '/services' },
    { label: 'Blog', to: '/blog' },
    { label: 'Contact', to: '/contact' },
    { label: 'Login', to: '/app/login' },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container section-padding">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Bus className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-display font-bold text-lg leading-tight">{name}</p>
                {tagline && <p className="text-xs opacity-70 mt-0.5">{tagline}</p>}
              </div>
            </div>
            <p className="text-sm opacity-70 leading-relaxed">
              {footerText ||
                "Nepal's pioneering electric bus transportation company committed to sustainable, comfortable mobility."}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-5 text-sm uppercase tracking-wider opacity-80">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm opacity-70 hover:opacity-100 hover:text-primary transition-all"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-semibold mb-5 text-sm uppercase tracking-wider opacity-80">
              Services
            </h4>
            <ul className="space-y-2.5">
              {SERVICE_LINKS.map((s) => (
                <li key={s}>
                  <Link
                    to="/services"
                    className="text-sm opacity-70 hover:opacity-100 hover:text-primary transition-all"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-5 text-sm uppercase tracking-wider opacity-80">
              Contact
            </h4>
            <ul className="space-y-3">
              {address && (
                <li className="flex items-start gap-3 text-sm opacity-70">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{address}</span>
                </li>
              )}
              {phones.map((p, i) => (
                <li key={i} className="flex items-center gap-3 text-sm opacity-70">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href={`tel:${p}`} className="hover:opacity-100 hover:text-primary transition-all">
                    {p}
                  </a>
                </li>
              ))}
              {emails.map((e, i) => (
                <li key={i} className="flex items-center gap-3 text-sm opacity-70">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a
                    href={`mailto:${e}`}
                    className="hover:opacity-100 hover:text-primary transition-all break-all"
                  >
                    {e}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 mt-10 pt-6 text-center text-sm opacity-60">
          &copy; {new Date().getFullYear()} {name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
