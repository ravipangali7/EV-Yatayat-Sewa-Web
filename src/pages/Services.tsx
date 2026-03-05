import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bus, Building2, Mountain, CalendarCheck, Plane, GraduationCap, ChevronRight } from "lucide-react";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { Service } from "@/modules/website/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { Bus, Building2, Mountain, CalendarCheck, Plane, GraduationCap };

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
      <section className="bg-[hsl(210_60%_20%)] text-white py-20 text-center">
        <h1 className="text-4xl font-display font-bold">Our Services</h1>
        <p className="mt-2 opacity-80">Comprehensive electric transport solutions</p>
      </section>
      <section className="section-padding">
        <div className="container grid md:grid-cols-3 gap-6">
          {services.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-12">No services yet.</p>
          ) : (
            services.map((s) => {
              const rawIcon = (s.svg ?? "Bus").toString().trim();
              const Icon = iconMap[rawIcon] ?? iconMap[rawIcon.charAt(0).toUpperCase() + rawIcon.slice(1)] ?? Bus;
              return (
                <Link to={`/service/${s.slug}`} key={s.id} className="group bg-card rounded-xl p-6 border hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{s.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{s.description}</p>
                  <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
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
