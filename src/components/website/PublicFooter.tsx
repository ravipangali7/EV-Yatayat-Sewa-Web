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

export function PublicFooter() {
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

  return (
    <footer className="bg-[hsl(210_60%_20%)] text-white">
      <div className="container section-padding">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bus className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold">{brandName}</span>
            </div>
            <p className="text-sm opacity-80">{tagline}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2 text-sm opacity-80">
              <Link to="/about" className="block hover:text-primary transition">About</Link>
              <Link to="/services" className="block hover:text-primary transition">Services</Link>
              <Link to="/blogs" className="block hover:text-primary transition">Blogs</Link>
              <Link to="/contact" className="block hover:text-primary transition">Contact</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <div className="space-y-2 text-sm opacity-80">
              {services.length === 0 ? (
                <p>Services</p>
              ) : (
                services.slice(0, 6).map((s) => (
                  <Link key={s.id} to={`/service/${s.slug}`} className="block hover:text-primary transition">{s.name}</Link>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-sm opacity-80">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> {address}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {phone}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> {email}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-10 pt-6 text-center text-sm opacity-60">
          {copyrightText}
        </div>
      </div>
    </footer>
  );
}
