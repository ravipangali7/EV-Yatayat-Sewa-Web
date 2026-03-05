import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { WebsiteIcon } from "@/components/website/WebsiteIcon";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { Service } from "@/modules/website/types";

export default function ServiceDetail() {
  const { slug } = useParams();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    websitePublicApi
      .services()
      .then((res) => {
        if (Array.isArray(res)) setServices(res as Service[]);
      })
      .catch(() => {});
  }, []);

  const service = slug ? services.find((s) => s.slug === slug) : null;

  if (services.length > 0 && !service) {
    return (
      <div className="section-padding container text-center">
        <h1 className="text-2xl font-bold">Service not found</h1>
        <Link to="/services" className="text-primary mt-4 inline-block">← Back to Services</Link>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="section-padding container text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const rawIcon = (service.svg ?? "Bus").toString().trim();

  return (
    <div>
      <section className="relative min-h-[280px] flex items-end py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210_55%_18%)] to-[hsl(210_55%_12%)]" />
        <div className="relative z-10 container px-4 w-full">
          <Link to="/services" className="inline-flex items-center gap-2 text-sm text-primary-foreground/90 hover:opacity-100 mb-4 transition-opacity">
            <ArrowLeft className="h-4 w-4" /> Back to Services
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <WebsiteIcon name={rawIcon} className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-display font-bold text-primary-foreground">{service.name}</h1>
          </div>
        </div>
      </section>
      <section className="section-padding-lg">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <p className="text-lg text-muted-foreground leading-relaxed">{service.description}</p>
            </div>
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="font-display font-bold text-lg mb-4">Other services</h3>
                <ul className="space-y-2">
                  {services
                    .filter((s) => s.slug !== service.slug)
                    .slice(0, 6)
                    .map((s) => {
                      const iconName = (s.svg ?? "Bus").toString().trim();
                      return (
                        <li key={s.id}>
                          <Link
                            to={`/service/${s.slug}`}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card shadow-soft hover:shadow-card-hover hover:border-primary/20 transition-all"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <WebsiteIcon name={iconName} className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-medium text-foreground block">{s.name}</span>
                              {s.description && (
                                <span className="text-xs text-muted-foreground line-clamp-2">{s.description}</span>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
                {services.filter((s) => s.slug !== service.slug).length === 0 && (
                  <p className="text-sm text-muted-foreground">No other services.</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
