import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import { PublicHeader } from '@/components/website/PublicHeader';
import { PublicFooter } from '@/components/website/PublicFooter';
import { RichTextDisplay } from '@/components/common/RichTextDisplay';
import type { Slider, CMSPage, Service, Team, Testimonial, FAQ, Blog, SiteSetting, PublicVehicle } from '@/modules/website/types';

const MEDIA_BASE = 'https://system.evyatayatsewa.com';

function imgUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function Index() {
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [aboutPage, setAboutPage] = useState<CMSPage | null>(null);
  const [headerPages, setHeaderPages] = useState<CMSPage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [team, setTeam] = useState<Team[]>([]);
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [setting, slidersRes, aboutRes, headerRes, servicesRes, teamRes, vehiclesRes, testimonialsRes, blogsRes, faqsRes] = await Promise.all([
          websitePublicApi.siteSetting(),
          websitePublicApi.sliders(),
          websitePublicApi.cmsAbout(),
          websitePublicApi.cmsHeader(),
          websitePublicApi.services(),
          websitePublicApi.team(),
          websitePublicApi.vehicles(),
          websitePublicApi.testimonials(),
          websitePublicApi.blogs(),
          websitePublicApi.faqs(),
        ]);
        setSiteSetting(setting && Object.keys(setting).length > 0 ? (setting as SiteSetting) : null);
        setSliders(Array.isArray(slidersRes) ? slidersRes : []);
        setAboutPage(aboutRes && typeof aboutRes === 'object' && 'slug' in aboutRes ? (aboutRes as CMSPage) : null);
        setHeaderPages(Array.isArray(headerRes) ? headerRes : []);
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

  const aboutSlug = aboutPage?.slug ?? null;
  const stats = siteSetting?.stats?.stats ?? [];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    try {
      await websitePublicApi.contactSubmit({ name: contactName, phone: contactPhone, message: contactMessage });
      setContactName('');
      setContactPhone('');
      setContactMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setContactSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader siteSetting={siteSetting} headerPages={headerPages} aboutSlug={aboutSlug} />

      {/* Slider */}
      {sliders.length > 0 && (
        <section className="relative">
          <div className="overflow-hidden">
            {sliders[0] && (
              <div className="relative h-[400px] md:h-[500px]">
                {sliders[0].image && (
                  <img
                    src={imgUrl(sliders[0].image)}
                    alt={sliders[0].title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center px-4">
                  <div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white">{sliders[0].title}</h1>
                    {sliders[0].subtitle && (
                      <p className="text-lg text-white/90 mt-2">{sliders[0].subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Stats */}
      {stats.length > 0 && (
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-lg bg-card border border-border">
                  {stat.svg && (
                    <div className="inline-block mb-2 [&>svg]:w-10 [&>svg]:h-10" dangerouslySetInnerHTML={{ __html: stat.svg }} />
                  )}
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About (first is_about CMS) */}
      {aboutPage && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-6">{aboutPage.title}</h2>
            {aboutPage.image && (
              <img src={imgUrl(aboutPage.image)} alt={aboutPage.title} className="w-full max-h-64 object-cover rounded-lg mb-6" />
            )}
            <RichTextDisplay html={aboutPage.content} />
          </div>
        </section>
      )}

      {/* Services */}
      <section id="services" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground text-center mb-10">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.id} className="bg-card rounded-xl p-6 border border-border">
                {s.svg && (
                  <div className="mb-4 [&>svg]:w-12 [&>svg]:h-12 text-primary" dangerouslySetInnerHTML={{ __html: s.svg }} />
                )}
                <h3 className="text-lg font-semibold text-foreground">{s.name}</h3>
                <p className="text-muted-foreground mt-2">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {team.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">Our Team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((t) => (
                <div key={t.id} className="bg-card rounded-xl p-4 border border-border text-center">
                  {t.image && (
                    <img src={imgUrl(t.image)} alt={t.name} className="w-24 h-24 rounded-full mx-auto object-cover mb-3" />
                  )}
                  <h3 className="font-semibold text-foreground">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{t.designation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Vehicles */}
      {vehicles.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">Our Vehicles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <div key={v.id} className="bg-card rounded-xl overflow-hidden border border-border">
                  {v.featured_image && (
                    <img src={v.featured_image} alt={v.name} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground">{v.name}</h3>
                    <p className="text-sm text-muted-foreground">{v.vehicle_type} • {v.vehicle_no}</p>
                    {v.description && <p className="text-sm mt-2 line-clamp-2">{v.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">Testimonials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-card rounded-xl p-6 border border-border">
                  <p className="text-yellow-500">{'★'.repeat(t.star)}</p>
                  <p className="text-muted-foreground mt-2">{t.message}</p>
                  <div className="mt-4 flex items-center gap-3">
                    {t.image && <img src={imgUrl(t.image)} alt={t.name} className="w-10 h-10 rounded-full object-cover" />}
                    <span className="font-medium text-foreground">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog preview */}
      {blogs.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">Latest from Blog</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogs.slice(0, 3).map((b) => (
                <Link key={b.id} to={`/blog/${b.slug}`} className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-colors">
                  {b.image && <img src={imgUrl(b.image)} alt={b.name} className="w-full h-40 object-cover" />}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground">{b.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/blog" className="text-primary font-medium hover:underline">View all posts</Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ | Contact */}
      <section id="contact" className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">FAQ</h2>
              <div className="space-y-4">
                {faqs.map((f) => (
                  <div key={f.id} className="border-b border-border pb-4">
                    <h3 className="font-medium text-foreground">{f.question}</h3>
                    <RichTextDisplay html={f.answer} className="text-sm text-muted-foreground mt-1" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Contact Us</h2>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
                <textarea
                  placeholder="Message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                  required
                />
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {contactSubmitting ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter siteSetting={siteSetting} />
    </div>
  );
}
