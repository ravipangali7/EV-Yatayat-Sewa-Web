import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bus, MapPin, Star, ArrowRight, ChevronRight, Quote, Zap, Battery, Mail, Phone } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WebsiteIcon } from "@/components/website/WebsiteIcon";
import { HomePageSkeleton } from "@/components/website/WebsiteLoadingSkeleton";
import { mockData } from "@/lib/mockData";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { SiteSetting, FAQ as FAQType, Testimonial as TestimonialType, Team as TeamType, PublicVehicle, Blog as BlogType, Slider as SliderType, Service as ServiceType } from "@/modules/website/types";
import heroBus from "@/assets/hero-bus.jpg";
import logo from "@/assets/logo.png";

const CONTACT_FALLBACK = { address: "Kathmandu, Nepal", phone: "+977-1-4XXXXXX", email: "info@evyatayatsewa.com" };

const MEDIA_BASE = "https://system.evyatayatsewa.com";
function imgUrl(path: string | null): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `${MEDIA_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [sliders, setSliders] = useState<SliderType[]>([]);
  const [faqs, setFaqs] = useState<FAQType[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialType[]>([]);
  const [team, setTeam] = useState<TeamType[]>([]);
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
  const [blogs, setBlogs] = useState<BlogType[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      websitePublicApi.siteSetting(),
      websitePublicApi.sliders(),
      websitePublicApi.faqs(),
      websitePublicApi.testimonials(),
      websitePublicApi.team(),
      websitePublicApi.vehicles(),
      websitePublicApi.blogs(),
      websitePublicApi.services(),
    ])
      .then(([settingRes, slidersRes, faqsRes, testimonialsRes, teamRes, vehiclesRes, blogsRes, servicesRes]) => {
        if (settingRes && typeof settingRes === "object" && "name" in settingRes) {
          setSiteSetting(settingRes as SiteSetting);
        }
        if (Array.isArray(slidersRes)) setSliders(slidersRes as SliderType[]);
        if (Array.isArray(faqsRes)) setFaqs(faqsRes as FAQType[]);
        if (Array.isArray(testimonialsRes)) setTestimonials(testimonialsRes as TestimonialType[]);
        if (Array.isArray(teamRes)) setTeam(teamRes as TeamType[]);
        if (Array.isArray(vehiclesRes)) setVehicles(vehiclesRes as PublicVehicle[]);
        if (Array.isArray(blogsRes)) setBlogs(blogsRes as BlogType[]);
        if (Array.isArray(servicesRes)) setServices(servicesRes as ServiceType[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

  if (loading) {
    return <HomePageSkeleton />;
  }

  return (
    <div>
      {/* Hero (dynamic from first slider or static fallback) */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden">
        {heroSlider?.image ? (
          <img src={imgUrl(heroSlider.image)} alt={heroSlider.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <img src={heroBus} alt="Electric bus" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="container relative z-10 text-primary-foreground">
          <div className="max-w-3xl animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <img src={logo} alt="Logo" className="h-16 w-auto drop-shadow-lg" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-5">
              {heroSlider?.title ? <span className="whitespace-pre-line">{heroSlider.title}</span> : <>Nepal's Electric<br />Transport Revolution</>}
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-7 max-w-lg whitespace-pre-line">
              {heroSlider?.subtitle || "Clean, comfortable, and reliable electric bus services across Nepal. Join the green movement today."}
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold bg-primary-foreground text-foreground shadow-soft hover:shadow-card-hover hover:scale-[1.02] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                Our Services <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold border-2 border-primary-foreground/50 hover:bg-primary-foreground/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
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
            const rawIcon = (s.svg ?? s.icon ?? "Bus").toString().trim();
            const statIconBg = "bg-primary/15 text-primary";
            return (
              <div key={i} className="bg-card rounded-2xl border border-border/50 shadow-card p-6 text-center animate-count-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${statIconBg}`}>
                  <WebsiteIcon name={rawIcon} className="h-8 w-8" />
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* About (dynamic from site setting) — green section, light text */}
      <section className="section-padding-lg section-green relative overflow-hidden">
        <div className="container grid md:grid-cols-2 gap-14 lg:gap-16 items-center">
          <div className="relative z-10 text-primary-foreground">
            <div className="flex flex-col">
              <p className="section-eyebrow">About Us</p>
              <span className="block w-12 h-0.5 rounded-full bg-primary-foreground/80 mb-5" aria-hidden />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold mb-6 leading-tight tracking-tight">
              {siteSetting?.about_title?.trim() ? (
                <span className="whitespace-pre-line">{siteSetting.about_title}</span>
              ) : (
                <>Driving Nepal Towards a <span className="text-primary-foreground">Greener Future</span></>
              )}
            </h2>
            {siteSetting?.about_content?.trim() ? (
              <div className="text-primary-foreground/90 leading-relaxed mb-8 prose prose-sm max-w-none prose-p:mb-3 prose-headings:font-display prose-headings:text-primary-foreground prose-p:text-primary-foreground/90 prose-a:text-primary-foreground prose-strong:text-primary-foreground" dangerouslySetInnerHTML={{ __html: siteSetting.about_content }} />
            ) : (
              <p className="text-primary-foreground/90 leading-relaxed mb-8 text-base">
                EV Yatayat Sewa is Nepal's pioneering electric bus transportation company. We are committed to providing sustainable, affordable, and comfortable public transportation while significantly reducing carbon emissions in urban areas.
              </p>
            )}
            {(siteSetting?.mission?.trim() || siteSetting?.vision?.trim() || siteSetting?.values?.trim()) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-foreground">
                {siteSetting?.mission?.trim() && (
                  <div className="group p-5 rounded-2xl border border-border/50 bg-card shadow-card hover:shadow-card-hover transition-all duration-300 border-l-4 border-l-primary">
                    <p className="section-eyebrow mb-2 text-foreground">Mission</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{siteSetting.mission}</p>
                  </div>
                )}
                {siteSetting?.vision?.trim() && (
                  <div className="group p-5 rounded-2xl border border-border/50 bg-card shadow-card hover:shadow-card-hover transition-all duration-300 border-l-4 border-l-primary">
                    <p className="section-eyebrow mb-2 text-foreground">Vision</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{siteSetting.vision}</p>
                  </div>
                )}
                {siteSetting?.values?.trim() && (
                  <div className="group p-5 rounded-2xl border border-border/50 bg-card shadow-card hover:shadow-card-hover transition-all duration-300 border-l-4 border-l-primary sm:col-span-2">
                    <p className="section-eyebrow mb-2 text-foreground">Values</p>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{siteSetting.values}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 opacity-60 blur-sm" aria-hidden />
            <div className="relative rounded-2xl overflow-hidden shadow-card-hover ring-1 ring-black/5">
              <img
                src={siteSetting?.about_image ? imgUrl(siteSetting.about_image) : heroBus}
                alt="About EV Yatayat Sewa"
                className="w-full h-80 md:h-[22rem] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" aria-hidden />
            </div>
          </div>
        </div>
      </section>

      {/* Services (dynamic from API) */}
      <section className="section-padding-lg section-tint-blue relative">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="section-eyebrow">Our Services</p>
            <span className="block w-12 h-0.5 rounded-full bg-primary mx-auto my-4" aria-hidden />
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">Comprehensive EV Transport Solutions</h2>
            <p className="text-muted-foreground mt-3 text-sm md:text-base">Clean, reliable electric mobility for cities and beyond.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {services.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-12">No services yet.</p>
            ) : (
              services.map((s, idx) => {
                const rawIcon = (s.svg ?? "Bus").toString().trim();
                return (
                  <Link
                    to={`/service/${s.slug}`}
                    key={s.id}
                    className="group website-card bg-card p-6 lg:p-7 flex flex-col"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <WebsiteIcon name={rawIcon} className="h-7 w-7" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">{s.name}</h3>
                    <p className="text-muted-foreground text-sm mb-5 flex-1 leading-relaxed">{s.description}</p>
                    <span className="text-primary text-sm font-medium inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-200">
                      Learn More <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding-lg section-tint-violet relative">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="section-eyebrow">Our Team</p>
            <span className="block w-12 h-0.5 rounded-full bg-primary mx-auto my-4" aria-hidden />
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">Meet the People Behind the Wheel</h2>
            <p className="text-muted-foreground mt-3 text-sm md:text-base">Dedicated professionals driving sustainable transport forward.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {team.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-12">No team members yet.</p>
            ) : (
              team.map((t, idx) => {
                return (
                  <div key={t.id} className="website-card bg-card p-6 text-center group">
                    {t.image ? (
                      <div className="relative inline-block mb-4">
                        <img
                          src={imgUrl(t.image)}
                          alt={t.name}
                          className="w-28 h-28 mx-auto rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-primary/50 transition-all duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-28 h-28 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <span className="text-2xl font-display font-bold text-primary group-hover:text-white transition-colors">
                          {t.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                    )}
                    <h4 className="font-display font-semibold text-foreground mb-1">{t.name}</h4>
                    <p className="text-sm text-muted-foreground">{t.designation}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Vehicles / Fleet */}
      <section className="section-padding-lg section-tint-amber relative">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="section-eyebrow">Our Fleet</p>
            <span className="block w-12 h-0.5 rounded-full bg-primary mx-auto my-4" aria-hidden />
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">Modern Electric Vehicles</h2>
            <p className="text-muted-foreground mt-3 text-sm md:text-base">Zero-emission buses built for comfort and reliability.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {vehicles.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-12">No vehicles yet.</p>
            ) : (
              vehicles.map((v) => (
                  <div key={v.id} className="website-card bg-card overflow-hidden group">
                    <div className="h-32 flex items-center justify-center bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
                      {v.featured_image ? (
                        <img src={v.featured_image} alt={v.name} className="h-full w-full object-cover object-center" />
                      ) : (
                        <Bus className="h-14 w-14 text-primary/60 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    <div className="p-5 text-center">
                      <h4 className="font-display font-semibold text-foreground mb-1">{v.name}</h4>
                      <p className="text-xs text-muted-foreground mb-3">{v.vehicle_type}</p>
                      <div className="flex justify-center gap-2 flex-wrap">
                        {v.vehicle_no && <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">{v.vehicle_no}</span>}
                        {v.description && <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs line-clamp-1 max-w-[140px]">{v.description}</span>}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials (dynamic from API) — green section, light text */}
      <section className="section-padding-lg section-green relative">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14 text-primary-foreground">
            <p className="section-eyebrow">Testimonials</p>
            <span className="block w-12 h-0.5 rounded-full bg-primary-foreground/80 mx-auto my-4" aria-hidden />
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">What Our Passengers Say</h2>
            <p className="text-primary-foreground/90 mt-3 text-sm md:text-base">Real stories from people who ride with us.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.length === 0 ? (
              <p className="text-primary-foreground/90 col-span-full text-center py-12">No testimonials yet.</p>
            ) : (
              testimonials.map((t) => (
                <div key={t.id} className="website-card bg-card p-6 lg:p-7 border-l-4 border-l-primary flex flex-col">
                  <Quote className="h-10 w-10 text-primary/25 mb-4 shrink-0" aria-hidden />
                  <p className="text-muted-foreground mb-5 italic leading-relaxed flex-1">"{t.message}"</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    {t.image ? (
                      <img src={imgUrl(t.image)} alt={t.name} className="h-10 w-10 rounded-full object-cover shrink-0 ring-2 ring-border/50" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <span className="text-sm font-display font-bold text-primary">
                          {t.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-foreground block truncate">{t.name}</span>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: Math.min(5, Math.max(0, t.star)) }).map((_, j) => (
                          <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="section-padding-lg section-tint-blue relative">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
            <div>
              <p className="section-eyebrow">Blog</p>
              <span className="block w-12 h-0.5 rounded-full bg-primary mt-2 mb-4" aria-hidden />
              <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">Latest News & Updates</h2>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">Insights, announcements, and stories from the road.</p>
            </div>
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg shrink-0"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {blogs.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-12">No posts yet.</p>
            ) : (
              blogs.map((b) => {
                const excerpt = b.content?.replace(/<[^>]+>/g, "").trim().slice(0, 120) || "";
                const date = b.created_at ? new Date(b.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
                return (
                  <Link to={`/blog/${b.slug}`} key={b.id} className="website-card bg-card overflow-hidden group flex flex-col">
                    <div className="relative h-44 overflow-hidden">
                      {b.image ? (
                        <>
                          <img src={imgUrl(b.image)} alt={b.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden />
                        </>
                      ) : (
                        <div className="h-full gradient-primary flex items-center justify-center">
                          <Bus className="h-14 w-14 text-primary-foreground opacity-40 group-hover:opacity-60 transition-opacity" />
                        </div>
                      )}
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-card/90 text-xs font-medium text-foreground shadow-soft">
                        {date}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h4 className="font-display font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">{b.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">{excerpt}{excerpt.length >= 120 ? "…" : ""}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* FAQ + Contact (dynamic from API) */}
      <section className="section-padding-lg section-tint-amber relative">
        <div className="container grid md:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <p className="section-eyebrow">FAQ</p>
            <span className="block w-12 h-0.5 rounded-full bg-primary mb-4" aria-hidden />
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-sm mb-8">Quick answers to common questions.</p>
            {faqs.length === 0 ? (
              <p className="text-muted-foreground">No FAQs yet.</p>
            ) : (
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((f) => (
                  <AccordionItem
                    key={f.id}
                    value={`faq-${f.id}`}
                    className="border border-border/50 rounded-2xl px-5 shadow-soft bg-card hover:shadow-card-hover transition-shadow border-l-4 border-l-primary"
                  >
                    <AccordionTrigger className="text-sm font-medium hover:no-underline py-4 [&[data-state=open]]:text-primary">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
          <div>
            <p className="section-eyebrow">Contact</p>
            <span className="block w-12 h-0.5 rounded-full bg-primary mb-4" aria-hidden />
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">Get in Touch</h2>
            <p className="text-muted-foreground text-sm mb-6">We&apos;d love to hear from you.</p>
            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-soft space-y-4 mb-6">
              <p className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </span>
                {contactAddress}
              </p>
              <p className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-primary" />
                </span>
                {contactPhoneDisplay}
              </p>
              <p className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </span>
                {contactEmailDisplay}
              </p>
            </div>
            {contactSuccess ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center text-sm text-primary font-medium shadow-soft">
                Message sent. We&apos;ll get back to you shortly.
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleContactSubmit}>
                <input
                  placeholder="Your Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none transition-shadow placeholder:text-muted-foreground/70"
                />
                <input
                  placeholder="Phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none transition-shadow placeholder:text-muted-foreground/70"
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none resize-none transition-shadow placeholder:text-muted-foreground/70"
                />
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-8 py-3.5 rounded-full font-semibold gradient-primary text-primary-foreground shadow-soft hover:shadow-card-hover hover:opacity-95 transition-all w-full disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
