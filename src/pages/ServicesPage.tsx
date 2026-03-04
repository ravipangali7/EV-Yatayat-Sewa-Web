import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bus, ChevronRight } from 'lucide-react';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import type { Service } from '@/modules/website/types';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await websitePublicApi.services();
        setServices(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <section className="bg-secondary text-secondary-foreground py-20 text-center">
        <h1 className="text-4xl font-display font-bold">Our Services</h1>
        <p className="mt-2 opacity-80">Comprehensive electric transport solutions</p>
      </section>

      {/* Services grid */}
      <section className="section-padding">
        <div className="container">
          {services.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No services available yet.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {services.map((s) => (
                <Link
                  key={s.id}
                  to={`/service/${s.slug}`}
                  className="group bg-card rounded-xl p-6 border hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  {s.svg ? (
                    <div
                      className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary transition-colors [&>svg]:h-6 [&>svg]:w-6 [&>svg]:text-accent-foreground group-hover:[&>svg]:text-primary-foreground"
                      dangerouslySetInnerHTML={{ __html: s.svg }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                      <Bus className="h-6 w-6 text-accent-foreground group-hover:text-primary-foreground" />
                    </div>
                  )}
                  <h3 className="font-display font-semibold text-lg mb-2">{s.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{s.description}</p>
                  <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Learn More <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
