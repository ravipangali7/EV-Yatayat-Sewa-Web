import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bus, Mail, Phone, MapPin } from "lucide-react";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { SiteSetting, Service } from "@/modules/website/types";

const FALLBACK = {
  brandName: "EV Yatayat Sewa",
  tagline: "Nepal's leading electric transportation service. Clean, green, and reliable.",
  address: "Kathmandu, Nepal",
  phone: "+977-1-4XXXXXX",
  email: "info@evyatayatsewa.com",
  copyright: "© 2026 EV Yatayat Sewa. All rights reserved.",
};

type PublicFooterProps = {
  siteSetting?: unknown;
  aboutSlug?: string | null;
};

export function PublicFooter(_props?: PublicFooterProps) {
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    Promise.all([websitePublicApi.siteSetting(), websitePublicApi.services()])
      .then(([settingRes, servicesRes]) => {
        if (settingRes && typeof settingRes === "object" && "name" in settingRes) {
          setSiteSetting(settingRes as SiteSetting);
        }
        if (Array.isArray(servicesRes)) setServices(servicesRes as Service[]);
      })
      .catch(() => {});
  }, []);

  const brandName = siteSetting?.name?.trim() || FALLBACK.brandName;
  const tagline = siteSetting?.tagline?.trim() || FALLBACK.tagline;
  const address = siteSetting?.address?.trim() || FALLBACK.address;
  const phone = Array.isArray(siteSetting?.phones) && siteSetting.phones.length > 0
    ? String(siteSetting.phones[0]).trim()
    : FALLBACK.phone;
  const email = Array.isArray(siteSetting?.emails) && siteSetting.emails.length > 0
    ? String(siteSetting.emails[0]).trim()
    : FALLBACK.email;
  const copyrightText = siteSetting?.footer_text?.trim() || FALLBACK.copyright;

  const linkClass = "block text-sm opacity-90 hover:text-primary hover:opacity-100 transition-all duration-200 py-0.5";

  return (
    <footer className="text-white bg-gradient-to-b from-[hsl(210_55%_18%)] to-[hsl(210_55%_12%)]">
      <div className="container section-padding">
        <div className="grid md:grid-cols-4 gap-10 md:gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bus className="h-6 w-6 text-primary shrink-0" />
              <span className="font-display text-xl font-bold">{brandName}</span>
            </div>
            <p className="text-sm opacity-80 leading-relaxed max-w-xs">{tagline}</p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <div className="flex flex-col space-y-3 text-sm opacity-80">
              <Link to="/about" className={linkClass}>About</Link>
              <Link to="/services" className={linkClass}>Services</Link>
              <Link to="/blogs" className={linkClass}>Blogs</Link>
              <Link to="/contact" className={linkClass}>Contact</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Services</h4>
            <div className="flex flex-col space-y-3 text-sm opacity-80">
              {services.length === 0 ? (
                <span>Services</span>
              ) : (
                services.slice(0, 6).map((s) => (
                  <Link key={s.id} to={`/service/${s.slug}`} className={linkClass}>{s.name}</Link>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact</h4>
            <div className="space-y-3 text-sm opacity-80">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /> {address}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" /> {phone}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" /> {email}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 mt-12 pt-6 text-center text-sm opacity-60">
          {copyrightText}
        </div>
      </div>
    </footer>
  );
}
