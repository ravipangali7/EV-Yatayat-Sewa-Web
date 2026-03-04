import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
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

  return (
    <footer className="border-t border-border bg-gradient-to-b from-muted/30 to-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="font-semibold text-primary text-lg">Company</h3>
            {logoUrl && (
              <img src={logoUrl} alt={name} className="h-10 w-auto object-contain" />
            )}
            <p className="font-medium text-foreground">{name}</p>
            {tagline && <p className="text-sm text-muted-foreground">{tagline}</p>}
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-primary text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              {aboutSlug && (
                <li><Link to={`/page/${aboutSlug}`} className="text-muted-foreground hover:text-primary transition-colors">About</Link></li>
              )}
              <li><a href="#services" className="text-muted-foreground hover:text-primary transition-colors">Service</a></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
              <li><a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
              <li><Link to="/app/login" className="text-muted-foreground hover:text-primary transition-colors">Login</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-primary text-lg mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {phones.length > 0 && (
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <span>
                    {phones.map((p, i) => (
                      <a key={i} href={`tel:${p}`} className="block hover:text-primary transition-colors">{p}</a>
                    ))}
                  </span>
                </li>
              )}
              {emails.length > 0 && (
                <li className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <span>
                    {emails.map((e, i) => (
                      <a key={i} href={`mailto:${e}`} className="block hover:text-primary transition-colors">{e}</a>
                    ))}
                  </span>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <span>{address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Footer text / About us */}
          <div>
            <h3 className="font-semibold text-primary text-lg mb-4">About Us</h3>
            {footerText ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{footerText}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Green rides and smart commute.</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
