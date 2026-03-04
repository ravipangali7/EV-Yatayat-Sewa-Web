import { Link } from "react-router-dom";
import { Bus, Building2, Mountain, CalendarCheck, Plane, GraduationCap, ChevronRight } from "lucide-react";
import { mockData } from "@/lib/mockData";

const iconMap: Record<string, any> = { Bus, Building2, Mountain, CalendarCheck, Plane, GraduationCap };

export default function ServicesPage() {
  return (
    <div>
      <section className="bg-[hsl(210_60%_20%)] text-white py-20 text-center">
        <h1 className="text-4xl font-display font-bold">Our Services</h1>
        <p className="mt-2 opacity-80">Comprehensive electric transport solutions</p>
      </section>
      <section className="section-padding">
        <div className="container grid md:grid-cols-3 gap-6">
          {mockData.services.map((s) => {
            const Icon = iconMap[s.icon];
            return (
              <Link to={`/service/${s.slug}`} key={s.slug} className="group bg-card rounded-xl p-6 border hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{s.desc}</p>
                <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Learn More <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
