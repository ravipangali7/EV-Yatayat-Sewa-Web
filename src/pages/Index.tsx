import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bus, MapPin, Users, Leaf, Star, ArrowRight, Building2, Mountain, CalendarCheck, Plane, GraduationCap, ChevronRight, Quote, Zap, Battery, Mail, Phone } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { mockData } from "@/lib/mockData";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { SiteSetting, FAQ as FAQType, Testimonial as TestimonialType, Team as TeamType, PublicVehicle, Blog as BlogType, Slider as SliderType } from "@/modules/website/types";
import heroBus from "@/assets/hero-bus.jpg";
import logo from "@/assets/logo.png";

const iconMap: Record<string, any> = { Bus, MapPin, Users, Leaf, Building2, Mountain, CalendarCheck, Plane, GraduationCap };

const CONTACT_FALLBACK = { address: "Kathmandu, Nepal", phone: "+977-1-4XXXXXX", email: "info@evyatayatsewa.com" };

const MEDIA_BASE = "https://system.evyatayatsewa.com";
function imgUrl(path: string | null): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `${MEDIA_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function Index() {
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [sliders, setSliders] = useState<SliderType[]>([]);
  const [faqs, setFaqs] = useState<FAQType[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialType[]>([]);
  const [team, setTeam] = useState<TeamType[]>([]);
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
  const [blogs, setBlogs] = useState<BlogType[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      websitePublicApi.siteSetting(),
      websitePublicApi.sliders(),
      websitePublicApi.faqs(),
      websitePublicApi.testimonials(),
      websitePublicApi.team(),
      websitePublicApi.vehicles(),
      websitePublicApi.blogs(),
    ])
      .then(([settingRes, slidersRes, faqsRes, testimonialsRes, teamRes, vehiclesRes, blogsRes]) => {
        if (settingRes && typeof settingRes === "object" && "name" in settingRes) {
          setSiteSetting(settingRes as SiteSetting);
        }
        if (Array.isArray(slidersRes)) setSliders(slidersRes as SliderType[]);
        if (Array.isArray(faqsRes)) setFaqs(faqsRes as FAQType[]);
        if (Array.isArray(testimonialsRes)) setTestimonials(testimonialsRes as TestimonialType[]);
        if (Array.isArray(teamRes)) setTeam(teamRes as TeamType[]);
        if (Array.isArray(vehiclesRes)) setVehicles(vehiclesRes as PublicVehicle[]);
        if (Array.isArray(blogsRes)) setBlogs(blogsRes as BlogType[]);
      })
      .catch(() => {});
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactSuccess(false);
    try {
      await websitePublicApi.contactSubmit({ name: contactName, phone: contactPhone, message: contactMessage });
      setContactName("");
      setContactPhone("");
      setContactMessage("");
      setContactSuccess(true);
      setTimeout(() => setContactSuccess(false), 4000);
    } catch {
      // toast handled by api interceptor
    } finally {
      setContactSubmitting(false);
    }
  };

  const contactAddress = siteSetting?.address?.trim() || CONTACT_FALLBACK.address;
  const contactPhoneDisplay = Array.isArray(siteSetting?.phones) && siteSetting.phones.length > 0 ? String(siteSetting.phones[0]).trim() : CONTACT_FALLBACK.phone;
  const contactEmailDisplay = Array.isArray(siteSetting?.emails) && siteSetting.emails.length > 0 ? String(siteSetting.emails[0]).trim() : CONTACT_FALLBACK.email;

  const heroSlider = sliders.length > 0 ? sliders[0] : null;
  const statsList = siteSetting?.stats?.stats && Array.isArray(siteSetting.stats.stats) ? siteSetting.stats.stats : mockData.stats;

  return (
    <div>
      {/* Hero (dynamic from first slider or static fallback) */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden">
        {heroSlider?.image ? (
          <img src={imgUrl(heroSlider.image)} alt={heroSlider.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <img src={heroBus} alt="Electric bus" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 gradient-hero" />
        <div className="container relative z-10 text-primary-foreground">
          <div className="max-w-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="Logo" className="h-16 w-auto drop-shadow-lg" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
              {heroSlider?.title ? <span className="whitespace-pre-line">{heroSlider.title}</span> : <>Nepal's Electric<br />Transport Revolution</>}
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-lg whitespace-pre-line">
              {heroSlider?.subtitle || "Clean, comfortable, and reliable electric bus services across Nepal. Join the green movement today."}
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

      {/* Stats (dynamic from site setting or mock fallback) */}
      <section className="-mt-16 relative z-10 container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsList.map((s: { label: string; value: string; icon?: string; svg?: string }, i: number) => {
            const iconKey = s.svg ?? s.icon ?? "Bus";
            const Icon = iconMap[iconKey];
            return (
              <div key={i} className="bg-card rounded-xl shadow-lg p-6 text-center animate-count-up" style={{ animationDelay: `${i * 0.1}s` }}>
                {Icon ? <Icon className="h-8 w-8 text-primary mx-auto mb-3" /> : <Bus className="h-8 w-8 text-primary mx-auto mb-3" />}
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
            {team.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">No team members yet.</p>
            ) : (
              team.map((t) => (
                <div key={t.id} className="text-center group">
                  {t.image ? (
                    <img src={imgUrl(t.image)} alt={t.name} className="w-24 h-24 mx-auto rounded-full object-cover mb-4 group-hover:ring-2 group-hover:ring-primary transition-all" />
                  ) : (
                    <div className="w-24 h-24 mx-auto rounded-full bg-accent flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                      <span className="text-2xl font-display font-bold text-accent-foreground group-hover:text-primary-foreground transition-colors">
                        {t.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                  )}
                  <h4 className="font-semibold">{t.name}</h4>
                  <p className="text-sm text-muted-foreground">{t.designation}</p>
                </div>
              ))
            )}
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
            {vehicles.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">No vehicles yet.</p>
            ) : (
              vehicles.map((v) => (
                <div key={v.id} className="bg-card rounded-xl p-6 shadow-sm text-center hover:shadow-lg transition">
                  {v.featured_image ? (
                    <img src={v.featured_image} alt={v.name} className="h-24 w-full object-cover rounded-lg mx-auto mb-4" />
                  ) : (
                    <Bus className="h-12 w-12 text-primary mx-auto mb-4" />
                  )}
                  <h4 className="font-display font-semibold mb-1">{v.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{v.vehicle_type}</p>
                  <div className="flex justify-center gap-2 flex-wrap text-sm">
                    {v.vehicle_no && <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground">{v.vehicle_no}</span>}
                    {v.description && <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground line-clamp-1 max-w-[140px]">{v.description}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials (dynamic from API) */}
      <section className="section-padding">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold">What Our Passengers Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">No testimonials yet.</p>
            ) : (
              testimonials.map((t) => (
                <div key={t.id} className="bg-card rounded-xl p-6 shadow-sm border">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground mb-4 italic">"{t.message}"</p>
                  <div className="flex items-center gap-2">
                    {t.image ? (
                      <img src={imgUrl(t.image)} alt={t.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <span className="text-xs font-display font-bold text-accent-foreground">
                          {t.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                    )}
                    <div className="flex">
                      {Array.from({ length: Math.min(5, Math.max(0, t.star)) }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <span className="font-semibold text-sm ml-auto">{t.name}</span>
                  </div>
                </div>
              ))
            )}
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
            {blogs.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">No posts yet.</p>
            ) : (
              blogs.map((b) => {
                const excerpt = b.content?.replace(/<[^>]+>/g, "").trim().slice(0, 120) || "";
                const date = b.created_at ? new Date(b.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
                return (
                  <Link to={`/blog/${b.slug}`} key={b.id} className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group">
                    {b.image ? (
                      <img src={imgUrl(b.image)} alt={b.name} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="h-40 gradient-primary flex items-center justify-center">
                        <Bus className="h-12 w-12 text-primary-foreground opacity-40" />
                      </div>
                    )}
                    <div className="p-5">
                      <h4 className="font-semibold mt-3 mb-2 group-hover:text-primary transition line-clamp-2">{b.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{excerpt}{excerpt.length >= 120 ? "…" : ""}</p>
                      <p className="text-xs text-muted-foreground mt-3">{date}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* FAQ + Contact (dynamic from API) */}
      <section className="section-padding">
        <div className="container grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">FAQ</p>
            <h2 className="text-3xl font-display font-bold mb-6">Frequently Asked Questions</h2>
            {faqs.length === 0 ? (
              <p className="text-muted-foreground">No FAQs yet.</p>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((f) => (
                  <AccordionItem key={f.id} value={`faq-${f.id}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-sm font-medium">{f.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{f.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">Contact</p>
            <h2 className="text-3xl font-display font-bold mb-6">Get in Touch</h2>
            <div className="space-y-4 mb-6 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /> {contactAddress}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" /> {contactPhoneDisplay}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" /> {contactEmailDisplay}</p>
            </div>
            {contactSuccess ? (
              <div className="rounded-lg border bg-accent/50 p-6 text-center text-sm text-primary font-medium">
                Message sent. We&apos;ll get back to you shortly.
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleContactSubmit}>
                <input
                  placeholder="Your Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                <input
                  placeholder="Phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                />
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-8 py-3 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition w-full disabled:opacity-70"
                >
                  {contactSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
