import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { WebsiteIcon } from "@/components/website/WebsiteIcon";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import { ListPageSkeleton } from "@/components/website/WebsiteLoadingSkeleton";
import type { Service } from "@/modules/website/types";

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    websitePublicApi
      .services()
      .then((res) => {
        if (Array.isArray(res)) setServices(res as Service[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const filteredServices = q
    ? services.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q)
      )
    : services;

  if (loading) {
    return <ListPageSkeleton cardCount={6} />;
  }

  return (
    <div>
      <section className="relative min-h-[280px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 text-center text-primary-foreground container px-4">
          <p className="section-eyebrow text-primary-foreground/90">What we offer</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold mt-2">Our Services</h1>
          <p className="mt-2 text-lg opacity-90">Comprehensive electric transport solutions</p>
        </div>
      </section>
      <section className="section-padding-lg section-tint-blue">
        <div className="container">
          <div className="relative max-w-xl mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search services…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none transition-shadow"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
          {services.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-12">No services yet.</p>
          ) : filteredServices.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-12">No services match your search.</p>
          ) : (
            filteredServices.map((s) => {
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
        </div>
      </section>
    </div>
  );
}
