import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Bus, Building2, Mountain, CalendarCheck, Plane, GraduationCap, CheckCircle } from "lucide-react";
import { mockData } from "@/lib/mockData";

const iconMap: Record<string, any> = { Bus, Building2, Mountain, CalendarCheck, Plane, GraduationCap };

export default function ServiceDetail() {
  const { slug } = useParams();
  const service = mockData.services.find((s) => s.slug === slug);

  if (!service) return (
    <div className="section-padding container text-center">
      <h1 className="text-2xl font-bold">Service not found</h1>
      <Link to="/services" className="text-primary mt-4 inline-block">← Back to Services</Link>
    </div>
  );

  const Icon = iconMap[service.icon];

  return (
    <div>
      <section className="bg-[hsl(210_60%_20%)] text-white py-20">
        <div className="container">
          <Link to="/services" className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Services
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-display font-bold">{service.title}</h1>
          </div>
        </div>
      </section>
      <section className="section-padding">
        <div className="container max-w-3xl">
          <p className="text-lg text-muted-foreground mb-8">{service.desc}</p>
          <h3 className="font-display font-bold text-xl mb-4">Key Features</h3>
          <div className="space-y-3">
            {["Fully air-conditioned electric vehicles", "Real-time GPS tracking", "Professional and trained drivers", "24/7 customer support", "Flexible scheduling options"].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
          <Link to="/contact" className="inline-block mt-8 px-8 py-3 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition">
            Book This Service
          </Link>
        </div>
      </section>
    </div>
  );
}
