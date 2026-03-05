import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
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
        <div className="container max-w-3xl">
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">{service.description}</p>
          <p className="section-eyebrow mb-2">Key Features</p>
          <h3 className="font-display font-bold text-xl mb-4">What we offer</h3>
          <div className="space-y-3">
            {["Fully air-conditioned electric vehicles", "Real-time GPS tracking", "Professional and trained drivers", "24/7 customer support", "Flexible scheduling options"].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-card shadow-soft">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center mt-8 px-8 py-3.5 rounded-full font-semibold gradient-primary text-primary-foreground shadow-soft hover:shadow-card-hover hover:opacity-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Book This Service
          </Link>
        </div>
      </section>
    </div>
  );
}
