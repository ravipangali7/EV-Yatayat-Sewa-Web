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

  const linkClass = "block text-xs opacity-90 hover:text-primary hover:opacity-100 transition-all duration-200 py-1";

  return (
    <footer className="w-full max-w-full text-white bg-[hsl(220_14%_18%)] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />
      <div className="container w-full max-w-full py-6 md:py-8 lg:py-10 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
          <div className="space-y-2 md:space-y-3 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex w-8 h-8 md:w-9 md:h-9 items-center justify-center rounded-lg bg-primary/20 shrink-0">
                <Bus className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </span>
              <span className="font-display text-base md:text-lg font-bold">{brandName}</span>
            </div>
            <p className="text-xs opacity-85 leading-relaxed max-w-xs">{tagline}</p>
          </div>

          <div className="space-y-2 md:space-y-3">
            <h4 className="font-semibold text-white text-xs md:text-sm tracking-wide">Quick Links</h4>
            <div className="flex flex-col space-y-1 text-xs opacity-85">
              <Link to="/about" className={linkClass}>About</Link>
              <Link to="/services" className={linkClass}>Services</Link>
              <Link to="/blogs" className={linkClass}>Blogs</Link>
              <Link to="/contact" className={linkClass}>Contact</Link>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            <h4 className="font-semibold text-white text-xs md:text-sm tracking-wide">Services</h4>
            <div className="flex flex-col space-y-1 text-xs opacity-85">
              {services.length === 0 ? (
                <span className="opacity-70">—</span>
              ) : (
                services.slice(0, 6).map((s) => (
                  <Link key={s.id} to={`/service/${s.slug}`} className={linkClass}>{s.name}</Link>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            <h4 className="font-semibold text-white text-xs md:text-sm tracking-wide">Contact</h4>
            <div className="space-y-1.5 md:space-y-2 text-xs opacity-85">
              <p className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-primary" /> {address}
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" /> {phone}
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary" /> {email}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 mt-6 md:mt-8 pt-4 md:pt-5 text-center text-xs opacity-60">
          {copyrightText}
        </div>
      </div>
    </footer>
  );
}
