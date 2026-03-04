import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  Users,
  Leaf,
  Star,
  ArrowRight,
  ChevronRight,
  Quote,
  Zap,
  Battery,
  ChevronLeft,
  Send,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import { RichTextDisplay } from '@/components/common/RichTextDisplay';
import { excerptFromHtml } from '@/lib/utils';
import type {
  Slider,
  CMSPage,
  Service,
  Team,
  Testimonial,
  FAQ,
  Blog,
  SiteSetting,
  PublicVehicle,
} from '@/modules/website/types';

const MEDIA_BASE = 'https://system.evyatayatsewa.com';

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function Index() {
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [aboutPage, setAboutPage] = useState<CMSPage | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [team, setTeam] = useState<Team[]>([]);
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [
          setting,
          slidersRes,
          aboutRes,
          servicesRes,
          teamRes,
          vehiclesRes,
          testimonialsRes,
          blogsRes,
          faqsRes,
        ] = await Promise.all([
          websitePublicApi.siteSetting(),
          websitePublicApi.sliders(),
          websitePublicApi.cmsAbout(),
          websitePublicApi.services(),
          websitePublicApi.team(),
          websitePublicApi.vehicles(),
          websitePublicApi.testimonials(),
          websitePublicApi.blogs(),
          websitePublicApi.faqs(),
        ]);
        setSiteSetting(
          setting && Object.keys(setting).length > 0 ? (setting as SiteSetting) : null,
        );
        setSliders(Array.isArray(slidersRes) ? slidersRes : []);
        setAboutPage(
          aboutRes && typeof aboutRes === 'object' && 'slug' in aboutRes
            ? (aboutRes as CMSPage)
            : null,
        );
        setServices(Array.isArray(servicesRes) ? servicesRes : []);
        setTeam(Array.isArray(teamRes) ? teamRes : []);
        setVehicles(Array.isArray(vehiclesRes) ? vehiclesRes : []);
        setTestimonials(Array.isArray(testimonialsRes) ? testimonialsRes : []);
        setBlogs(Array.isArray(blogsRes) ? blogsRes : []);
        setFaqs(Array.isArray(faqsRes) ? faqsRes : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const t = setInterval(() => setActiveSlide((i) => (i + 1) % sliders.length), 5000);
    return () => clearInterval(t);
  }, [sliders.length]);

  const stats = siteSetting?.stats?.stats ?? [];
  const aboutSlug = aboutPage?.slug ?? null;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    try {
      await websitePublicApi.contactSubmit({
        name: contactName,
        phone: contactPhone,
        message: contactMessage,
      });
      setContactName('');
      setContactPhone('');
      setContactMessage('');
      setContactSuccess(true);
      setTimeout(() => setContactSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setContactSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const activeSlider = sliders[activeSlide];

  return (
    <div>
      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden">
        {activeSlider?.image ? (
          <img
            src={imgUrl(activeSlider.image)}
            alt={activeSlider.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : siteSetting?.cover_image ? (
          <img
            src={imgUrl(siteSetting.cover_image)}
            alt={siteSetting.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary/90" />
        )}
        <div className="absolute inset-0 gradient-hero" />

        <div className="container relative z-10 text-primary-foreground">
          <div className="max-w-2xl animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
              {activeSlider?.title || siteSetting?.name || 'Nepal\'s Electric Transport Revolution'}
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-lg">
              {activeSlider?.subtitle ||
                siteSetting?.tagline ||
                'Clean, comfortable, and reliable electric bus services across Nepal. Join the green movement today.'}
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/services"
                className="px-8 py-3 rounded-lg font-semibold bg-primary-foreground text-secondary hover:opacity-90 transition flex items-center gap-2"
              >
                Our Services <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="px-8 py-3 rounded-lg font-semibold border-2 border-primary-foreground/50 hover:bg-primary-foreground/10 transition"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        {/* Slider controls */}
        {sliders.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
            <button
              onClick={() =>
                setActiveSlide((i) => (i - 1 + sliders.length) % sliders.length)
              }
              className="p-1.5 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {sliders.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === activeSlide
                    ? 'w-6 h-2 bg-primary-foreground'
                    : 'w-2 h-2 bg-primary-foreground/40 hover:bg-primary-foreground/70'
                }`}
              />
            ))}
            <button
              onClick={() => setActiveSlide((i) => (i + 1) % sliders.length)}
              className="p-1.5 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition text-primary-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          STATS — floating cards over hero
      ══════════════════════════════════════════ */}
      {stats.length > 0 && (
        <section className="-mt-16 relative z-10 container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className="bg-card rounded-xl shadow-lg p-6 text-center animate-fade-in border"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {s.svg ? (
                  <div
                    className="[&>svg]:h-8 [&>svg]:w-8 [&>svg]:text-primary [&>svg]:mx-auto mb-3"
                    dangerouslySetInnerHTML={{ __html: s.svg }}
                  />
                ) : (
                  <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                )}
                <p className="text-3xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          ABOUT
      ══════════════════════════════════════════ */}
      {aboutPage && (
        <section className="section-padding">
          <div className="container grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
                About Us
              </p>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                {aboutPage.title ? (
                  <>
                    <span>{aboutPage.title.split(' ').slice(0, -1).join(' ')} </span>
                    <span className="text-gradient">{aboutPage.title.split(' ').slice(-1)}</span>
                  </>
                ) : (
                  <>
                    Driving Nepal Towards a{' '}
                    <span className="text-gradient">Greener Future</span>
                  </>
                )}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {excerptFromHtml(aboutPage.content, 50)}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: Zap, text: '100% Electric Fleet' },
                  { icon: Battery, text: 'Fast Charging Infra' },
                  { icon: Users, text: 'Trained Drivers' },
                  { icon: Leaf, text: 'Zero Emissions' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                    <item.icon className="h-5 w-5 text-accent-foreground shrink-0" />
                    <span className="text-sm font-medium text-accent-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
              {aboutSlug && (
                <Link
                  to={`/page/${aboutSlug}`}
                  className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all text-sm"
                >
                  Read More <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl gradient-primary opacity-10 absolute inset-0" />
              {aboutPage.image ? (
                <img
                  src={imgUrl(aboutPage.image)}
                  alt={aboutPage.title}
                  className="rounded-2xl shadow-xl relative z-10 w-full h-80 object-cover"
                />
              ) : (
                <div className="rounded-2xl relative z-10 w-full h-80 bg-accent flex items-center justify-center">
                  <Bus className="h-24 w-24 text-primary/30" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════ */}
      {services.length > 0 && (
        <section id="services" className="section-padding bg-muted">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
                Our Services
              </p>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Comprehensive EV Transport Solutions
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {services.map((s) => (
                <Link
                  key={s.id}
                  to={`/service/${s.slug}`}
                  className="group bg-card rounded-xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
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
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{s.description}</p>
                  <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Learn More <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition"
              >
                View All Services <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          TEAM
      ══════════════════════════════════════════ */}
      {team.length > 0 && (
        <section className="section-padding">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
                Our Team
              </p>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Meet the People Behind the Wheel
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {team.map((t) => (
                <div key={t.id} className="text-center group">
                  {t.image ? (
                    <img
                      src={imgUrl(t.image)}
                      alt={t.name}
                      className="w-24 h-24 mx-auto rounded-full object-cover mb-4 border-4 border-accent group-hover:border-primary transition-colors"
                    />
                  ) : (
                    <div className="w-24 h-24 mx-auto rounded-full bg-accent flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                      <span className="text-2xl font-display font-bold text-accent-foreground group-hover:text-primary-foreground transition-colors">
                        {t.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    </div>
                  )}
                  <h4 className="font-semibold text-sm">{t.name}</h4>
                  <p className="text-sm text-muted-foreground">{t.designation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          VEHICLES
      ══════════════════════════════════════════ */}
      {vehicles.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
                Our Fleet
              </p>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Modern Electric Vehicles
              </h2>
            </div>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition"
                >
                  {v.featured_image ? (
                    <img
                      src={imgUrl(v.featured_image)}
                      alt={v.name}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-accent">
                      <Bus className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <div className="p-5 text-center">
                    <h4 className="font-display font-semibold mb-1">{v.name}</h4>
                    <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs mb-2">
                      {v.vehicle_type}
                    </span>
                    {v.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{v.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      {testimonials.length > 0 && (
        <section className="section-padding">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
                Testimonials
              </p>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                What Our Passengers Say
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-card rounded-xl p-6 shadow-sm border">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground mb-4 italic">"{t.message}"</p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`h-4 w-4 ${
                            j < t.star
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    {t.image ? (
                      <img
                        src={imgUrl(t.image)}
                        alt={t.name}
                        className="w-8 h-8 rounded-full object-cover ml-auto"
                      />
                    ) : null}
                    <span className="font-semibold text-sm ml-auto">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          BLOG PREVIEW
      ══════════════════════════════════════════ */}
      {blogs.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container">
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
                  Blog
                </p>
                <h2 className="text-3xl md:text-4xl font-display font-bold">
                  Latest News & Updates
                </h2>
              </div>
              <Link
                to="/blog"
                className="hidden md:flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all text-sm"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {blogs.slice(0, 4).map((b) => (
                <Link
                  key={b.id}
                  to={`/blog/${b.slug}`}
                  className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group"
                >
                  {b.image ? (
                    <img
                      src={imgUrl(b.image)}
                      alt={b.name}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-40 gradient-primary flex items-center justify-center">
                      <Bus className="h-12 w-12 text-primary-foreground opacity-40" />
                    </div>
                  )}
                  <div className="p-5">
                    <h4 className="font-semibold mt-1 mb-2 group-hover:text-primary transition line-clamp-2 text-sm">
                      {b.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8 md:hidden">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-primary font-medium text-sm"
              >
                View All Posts <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          FAQ + CONTACT
      ══════════════════════════════════════════ */}
      <section id="contact" className="section-padding">
        <div className="container grid md:grid-cols-2 gap-12">
          {/* FAQ */}
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">FAQ</p>
            <h2 className="text-3xl font-display font-bold mb-6">Frequently Asked Questions</h2>
            {faqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((f, i) => (
                  <AccordionItem
                    key={f.id}
                    value={`faq-${i}`}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-sm font-medium text-left">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <RichTextDisplay
                        html={f.answer}
                        className="text-sm text-muted-foreground"
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground text-sm">No FAQs available yet.</p>
            )}
          </div>

          {/* Contact */}
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
              Contact
            </p>
            <h2 className="text-3xl font-display font-bold mb-6">Get in Touch</h2>
            {contactSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4 bg-accent rounded-xl">
                <Zap className="h-10 w-10 text-primary" />
                <h4 className="text-lg font-bold">Message Sent!</h4>
                <p className="text-muted-foreground text-sm">We'll get back to you shortly.</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleContactSubmit}>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
                />
                <textarea
                  placeholder="Your Message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none transition"
                />
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="flex items-center justify-center gap-2 w-full px-8 py-3 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-60"
                >
                  {contactSubmitting ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
