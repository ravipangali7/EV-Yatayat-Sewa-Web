import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { WebsiteIcon } from "@/components/website/WebsiteIcon";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { Service } from "@/modules/website/types";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    websitePublicApi
      .services()
      .then((res) => {
        if (Array.isArray(res)) setServices(res as Service[]);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="relative min-h-[280px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210_55%_18%)] to-[hsl(210_55%_12%)]" />
        <div className="relative z-10 text-center text-primary-foreground container px-4">
          <p className="section-eyebrow text-primary-foreground/90">What we offer</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold mt-2">Our Services</h1>
          <p className="mt-2 text-lg opacity-90">Comprehensive electric transport solutions</p>
        </div>
      </section>
      <section className="section-padding-lg">
        <div className="container grid md:grid-cols-3 gap-6">
          {services.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-12">No services yet.</p>
          ) : (
            services.map((s) => {
              const rawIcon = (s.svg ?? "Bus").toString().trim();
              return (
                <Link to={`/service/${s.slug}`} key={s.id} className="group website-card bg-card p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <WebsiteIcon name={rawIcon} className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{s.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{s.description}</p>
                  <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                    Learn More <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
