import { Zap, Battery, Users, Leaf, Target, Eye } from "lucide-react";
import heroBus from "@/assets/hero-bus.jpg";

export default function About() {
  return (
    <div>
      <section className="relative h-64 flex items-center justify-center overflow-hidden">
        <img src={heroBus} alt="About" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 text-center text-primary-foreground">
          <h1 className="text-4xl font-display font-bold">About Us</h1>
          <p className="mt-2 opacity-80">Learn more about EV Yatayat Sewa</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-accent rounded-xl p-8">
              <Target className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-display font-bold text-xl mb-3">Our Mission</h3>
              <p className="text-muted-foreground text-sm">To revolutionize public transportation in Nepal by providing clean, efficient, and affordable electric bus services that reduce carbon emissions and improve urban air quality.</p>
            </div>
            <div className="bg-accent rounded-xl p-8">
              <Eye className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-display font-bold text-xl mb-3">Our Vision</h3>
              <p className="text-muted-foreground text-sm">To become South Asia's leading electric public transport provider, setting the standard for sustainable urban mobility by 2030.</p>
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-center mb-8">Why Choose Us?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "100% Electric", desc: "Zero tailpipe emissions" },
              { icon: Battery, title: "Fast Charging", desc: "Minimal downtime" },
              { icon: Users, title: "Expert Team", desc: "Trained professionals" },
              { icon: Leaf, title: "Eco Friendly", desc: "Sustainable operations" },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-xl border hover:shadow-lg transition">
                <item.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
