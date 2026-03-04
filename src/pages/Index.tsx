import { Link } from "react-router-dom";
import { Bus, MapPin, Users, Leaf, Star, ArrowRight, Building2, Mountain, CalendarCheck, Plane, GraduationCap, ChevronRight, Quote, Zap, Battery } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { mockData } from "@/lib/mockData";
import heroBus from "@/assets/hero-bus.jpg";
import logo from "@/assets/logo.png";

const iconMap: Record<string, any> = { Bus, MapPin, Users, Leaf, Building2, Mountain, CalendarCheck, Plane, GraduationCap };

export default function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden">
        <img src={heroBus} alt="Electric bus" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-hero" />
        <div className="container relative z-10 text-primary-foreground">
          <div className="max-w-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="Logo" className="h-16 w-auto drop-shadow-lg" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
              Nepal's Electric<br />Transport Revolution
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-lg">
              Clean, comfortable, and reliable electric bus services across Nepal. Join the green movement today.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link to="/services" className="px-8 py-3 rounded-lg font-semibold bg-primary-foreground text-[hsl(210_60%_20%)] hover:opacity-90 transition flex items-center gap-2">
                Our Services <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="px-8 py-3 rounded-lg font-semibold border-2 border-primary-foreground/50 hover:bg-primary-foreground/10 transition">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="-mt-16 relative z-10 container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockData.stats.map((s, i) => {
            const Icon = iconMap[s.icon];
            return (
              <div key={i} className="bg-card rounded-xl shadow-lg p-6 text-center animate-count-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-3xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* About */}
      <section className="section-padding">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">About Us</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Driving Nepal Towards a <span className="text-gradient">Greener Future</span></h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              EV Yatayat Sewa is Nepal's pioneering electric bus transportation company. We are committed to providing sustainable, affordable, and comfortable public transportation while significantly reducing carbon emissions in urban areas.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[{ icon: Zap, text: "100% Electric Fleet" }, { icon: Battery, text: "Fast Charging Infra" }, { icon: Users, text: "Trained Drivers" }, { icon: Leaf, text: "Zero Emissions" }].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                  <item.icon className="h-5 w-5 text-accent-foreground" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl gradient-primary opacity-10 absolute inset-0" />
            <img src={heroBus} alt="About" className="rounded-2xl shadow-xl relative z-10 w-full h-80 object-cover" />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section-padding bg-muted">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Our Services</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold">Comprehensive EV Transport Solutions</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {mockData.services.map((s) => {
              const Icon = iconMap[s.icon];
              return (
                <Link to={`/service/${s.slug}`} key={s.slug} className="group bg-card rounded-xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
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
        </div>
      </section>

      {/* Team */}
      <section className="section-padding">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Our Team</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold">Meet the People Behind the Wheel</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {mockData.team.map((t, i) => (
              <div key={i} className="text-center group">
                <div className="w-24 h-24 mx-auto rounded-full bg-accent flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <span className="text-2xl font-display font-bold text-accent-foreground group-hover:text-primary-foreground transition-colors">
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <h4 className="font-semibold">{t.name}</h4>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicles */}
      <section className="section-padding bg-muted">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Our Fleet</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold">Modern Electric Vehicles</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {mockData.vehicles.map((v, i) => (
              <div key={i} className="bg-card rounded-xl p-6 shadow-sm text-center hover:shadow-lg transition">
                <Bus className="h-12 w-12 text-primary mx-auto mb-4" />
                <h4 className="font-display font-semibold mb-1">{v.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">{v.type}</p>
                <div className="flex justify-center gap-4 text-sm">
                  <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground">{v.seats} seats</span>
                  <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground">{v.range}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold">What Our Passengers Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {mockData.testimonials.map((t, i) => (
              <div key={i} className="bg-card rounded-xl p-6 shadow-sm border">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-muted-foreground mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="font-semibold text-sm ml-auto">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="section-padding bg-muted">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Blog</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold">Latest News & Updates</h2>
            </div>
            <Link to="/blogs" className="hidden md:flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockData.blogs.map((b) => (
              <Link to={`/blog/${b.slug}`} key={b.slug} className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group">
                <div className="h-40 gradient-primary flex items-center justify-center">
                  <Bus className="h-12 w-12 text-primary-foreground opacity-40" />
                </div>
                <div className="p-5">
                  <span className="text-xs font-medium text-primary bg-accent px-2 py-1 rounded">{b.category}</span>
                  <h4 className="font-semibold mt-3 mb-2 group-hover:text-primary transition line-clamp-2">{b.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{b.excerpt}</p>
                  <p className="text-xs text-muted-foreground mt-3">{b.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + Contact */}
      <section className="section-padding">
        <div className="container grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">FAQ</p>
            <h2 className="text-3xl font-display font-bold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {mockData.faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-medium">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Contact</p>
            <h2 className="text-3xl font-display font-bold mb-6">Get in Touch</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <input placeholder="Your Name" className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
              <input placeholder="Email Address" type="email" className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
              <input placeholder="Subject" className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
              <textarea placeholder="Your Message" rows={4} className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
              <button type="submit" className="px-8 py-3 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition w-full">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
