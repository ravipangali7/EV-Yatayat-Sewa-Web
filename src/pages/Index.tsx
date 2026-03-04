import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ChevronDown, ArrowRight, Quote, Star, ChevronLeft, ChevronRight, Send, MessageCircle, Zap } from 'lucide-react';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import { PublicHeader } from '@/components/website/PublicHeader';
import { PublicFooter } from '@/components/website/PublicFooter';
import { RichTextDisplay } from '@/components/common/RichTextDisplay';
import { excerptFromHtml } from '@/lib/utils';
import type { Slider, CMSPage, Service, Team, Testimonial, FAQ, Blog, SiteSetting, PublicVehicle } from '@/modules/website/types';

const MEDIA_BASE = 'https://system.evyatayatsewa.com';

function imgUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

/* ─── Animation helpers ─────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' } }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function SectionWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.div>
  );
}

/* ─── Stat accent colors ────────────────────────────── */
const STAT_COLORS = [
  { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]', svg: '[&>svg]:text-emerald-400' },
  { border: 'border-blue-500/30',    bg: 'bg-blue-500/10',    text: 'text-blue-400',    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',  svg: '[&>svg]:text-blue-400' },
  { border: 'border-violet-500/30',  bg: 'bg-violet-500/10',  text: 'text-violet-400',  glow: 'shadow-[0_0_20px_rgba(124,58,237,0.2)]',  svg: '[&>svg]:text-violet-400' },
  { border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',  svg: '[&>svg]:text-amber-400' },
];

const SERVICE_COLORS = [
  { icon: 'bg-gradient-to-br from-emerald-500 to-teal-600',  glow: 'group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]' },
  { icon: 'bg-gradient-to-br from-blue-500 to-indigo-600',   glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]' },
  { icon: 'bg-gradient-to-br from-violet-500 to-purple-600', glow: 'group-hover:shadow-[0_0_30px_rgba(124,58,237,0.3)]' },
  { icon: 'bg-gradient-to-br from-cyan-500 to-sky-600',      glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]' },
  { icon: 'bg-gradient-to-br from-amber-500 to-orange-600',  glow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]' },
  { icon: 'bg-gradient-to-br from-rose-500 to-pink-600',     glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]' },
];

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
  const [contactSuccess, setContactSuccess] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  /* Auto-advance slider */
  useEffect(() => {
    if (sliders.length <= 1) return;
    const t = setInterval(() => setActiveSlide((i) => (i + 1) % sliders.length), 5000);
    return () => clearInterval(t);
  }, [sliders.length]);

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
      <div className="min-h-screen section-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-white/50 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <PublicHeader siteSetting={siteSetting} headerPages={headerPages} aboutSlug={aboutSlug} />

      {/* ═══════════════════════════════════════════════
          HERO SLIDER
      ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <AnimatePresence mode="wait">
          {sliders.length > 0 && sliders[activeSlide]?.image ? (
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <img
                src={imgUrl(sliders[activeSlide].image)}
                alt={sliders[activeSlide].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/50 to-slate-950" />
            </motion.div>
          ) : (
            <div className="absolute inset-0 section-dark" />
          )}
        </AnimatePresence>

        {/* Animated Orbs */}
        <div className="orb w-[600px] h-[600px] bg-emerald-500 top-[-200px] left-[-200px] animate-float-orb" />
        <div className="orb w-[500px] h-[500px] bg-blue-600 bottom-[-150px] right-[-100px] animate-float-orb-reverse" />
        <div className="orb w-[300px] h-[300px] bg-violet-600 top-[20%] right-[20%] animate-float-orb-slow" />

        {/* Content */}
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm font-medium text-emerald-400 mb-6">
              <Zap className="w-4 h-4" />
              <span>Electric Mobility for Nepal</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
            >
              {sliders.length > 0 && sliders[activeSlide]?.title ? (
                <span className="gradient-text">{sliders[activeSlide].title}</span>
              ) : (
                <>
                  <span className="gradient-text">Smart & Green</span>
                  <br />
                  <span className="text-white">Transit for Nepal</span>
                </>
              )}
            </motion.h1>

            {sliders.length > 0 && sliders[activeSlide]?.subtitle && (
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-white/70 mb-10 max-w-xl leading-relaxed">
                {sliders[activeSlide].subtitle}
              </motion.p>
            )}

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <a href="#services">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative overflow-hidden flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 glow-green transition-all duration-300"
                >
                  <span className="shimmer absolute inset-0" />
                  <span className="relative">Explore Services</span>
                  <ArrowRight className="w-4 h-4 relative" />
                </motion.button>
              </a>
              <a href="#contact">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white glass-panel hover:bg-white/15 transition-all duration-300"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact Us
                </motion.button>
              </a>
            </motion.div>
          </motion.div>

          {/* Slider dots + prev/next */}
          {sliders.length > 1 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <button onClick={() => setActiveSlide((i) => (i - 1 + sliders.length) % sliders.length)} className="p-2 glass-panel rounded-full hover:bg-white/20 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {sliders.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`rounded-full transition-all duration-300 ${i === activeSlide ? 'w-6 h-2 bg-emerald-400' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`}
                />
              ))}
              <button onClick={() => setActiveSlide((i) => (i + 1) % sliders.length)} className="p-2 glass-panel rounded-full hover:bg-white/20 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-10 right-8 flex flex-col items-center gap-1 text-white/40 text-xs"
          >
            <span>Scroll</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════ */}
      {stats.length > 0 && (
        <section className="relative py-16 bg-slate-900/60 overflow-hidden">
          <div className="orb w-[400px] h-[400px] bg-emerald-600/20 top-[-100px] right-[10%] animate-float-orb" />
          <div className="container mx-auto px-4 relative">
            <SectionWrapper className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
                const c = STAT_COLORS[i % STAT_COLORS.length];
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    custom={i}
                    whileHover={{ scale: 1.04, translateY: -4 }}
                    className={`glass-panel p-6 text-center border ${c.border} ${c.glow} website-card-hover`}
                  >
                    {stat.svg && (
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${c.bg} mb-3 ${c.svg} [&>svg]:w-6 [&>svg]:h-6`}
                        dangerouslySetInnerHTML={{ __html: stat.svg }}
                      />
                    )}
                    <p className={`text-2xl font-extrabold ${c.text}`}>{stat.value}</p>
                    <p className="text-sm text-white/50 mt-1">{stat.label}</p>
                  </motion.div>
                );
              })}
            </SectionWrapper>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          ABOUT
      ═══════════════════════════════════════════════ */}
      {aboutPage && (
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 section-dark-mesh" />
          <div className="orb w-[500px] h-[500px] bg-cyan-600/15 top-0 left-[-150px] animate-float-orb-reverse" />
          <div className="orb w-[400px] h-[400px] bg-violet-600/15 bottom-0 right-[-100px] animate-float-orb-slow" />

          <div className="container mx-auto px-4 max-w-6xl relative">
            <SectionWrapper className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeUp} className="order-2 md:order-1 space-y-6">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  About Us
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                  <span className="gradient-text">{aboutPage.title}</span>
                </h2>
                <p className="text-white/60 text-lg leading-relaxed">{excerptFromHtml(aboutPage.content, 40)}</p>
                {aboutSlug && (
                  <Link to={`/page/${aboutSlug}`}>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all duration-300"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                )}
              </motion.div>

              <motion.div variants={fadeUp} custom={1} className="order-1 md:order-2 relative">
                {aboutPage.image && (
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/40 via-cyan-500/30 to-blue-500/40 blur-sm" />
                    <img
                      src={imgUrl(aboutPage.image)}
                      alt={aboutPage.title}
                      className="relative w-full max-h-80 object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
                  </div>
                )}
              </motion.div>
            </SectionWrapper>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          SERVICES
      ═══════════════════════════════════════════════ */}
      <section id="services" className="relative py-24 overflow-hidden bg-slate-900/40">
        <div className="orb w-[600px] h-[600px] bg-blue-600/15 top-[-200px] right-[-200px] animate-float-orb" />
        <div className="orb w-[400px] h-[400px] bg-emerald-600/10 bottom-[-100px] left-[-100px] animate-float-orb-reverse" />

        <div className="container mx-auto px-4 relative">
          <SectionWrapper>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 mb-4">
                What We Offer
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold">
                <span className="gradient-text">Our Services</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s, i) => {
                const c = SERVICE_COLORS[i % SERVICE_COLORS.length];
                return (
                  <motion.div
                    key={s.id}
                    variants={fadeUp}
                    custom={i}
                    whileHover={{ translateY: -6 }}
                    className={`group glass-panel p-6 border border-white/10 hover:border-white/20 transition-all duration-300 ${c.glow}`}
                  >
                    {s.svg && (
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${c.icon} mb-5 shadow-lg [&>svg]:w-7 [&>svg]:h-7 [&>svg]:text-white`}
                        dangerouslySetInnerHTML={{ __html: s.svg }}
                      />
                    )}
                    <h3 className="text-lg font-bold text-white mb-2">{s.name}</h3>
                    <p className="text-white/55 text-sm leading-relaxed">{s.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </SectionWrapper>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TEAM
      ═══════════════════════════════════════════════ */}
      {team.length > 0 && (
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 section-dark" />
          <div className="orb w-[500px] h-[500px] bg-violet-600/15 top-[-100px] left-[20%] animate-float-orb-slow" />

          <div className="container mx-auto px-4 relative">
            <SectionWrapper>
              <motion.div variants={fadeUp} className="text-center mb-16">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 mb-4">
                  The People
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400">Our Team</span>
                </h2>
              </motion.div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {team.map((t, i) => (
                  <motion.div
                    key={t.id}
                    variants={fadeUp}
                    custom={i}
                    whileHover={{ translateY: -6 }}
                    className="glass-panel p-6 text-center border border-white/10 hover:border-violet-500/30 hover:shadow-[0_0_25px_rgba(124,58,237,0.2)] transition-all duration-300"
                  >
                    {t.image ? (
                      <div className="relative inline-block mb-4">
                        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 blur-sm" />
                        <img
                          src={imgUrl(t.image)}
                          alt={t.name}
                          className="relative w-20 h-20 rounded-full object-cover border-2 border-slate-900"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                        {t.name[0]}
                      </div>
                    )}
                    <h3 className="font-bold text-white text-sm">{t.name}</h3>
                    <p className="text-xs text-violet-400/80 mt-1">{t.designation}</p>
                  </motion.div>
                ))}
              </div>
            </SectionWrapper>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          VEHICLES
      ═══════════════════════════════════════════════ */}
      {vehicles.length > 0 && (
        <section className="relative py-24 overflow-hidden bg-slate-900/40">
          <div className="orb w-[500px] h-[500px] bg-cyan-600/15 bottom-[-100px] right-[10%] animate-float-orb" />
          <div className="orb w-[300px] h-[300px] bg-emerald-600/10 top-0 left-[5%] animate-float-orb-reverse" />

          <div className="container mx-auto px-4 relative">
            <SectionWrapper>
              <motion.div variants={fadeUp} className="text-center mb-16">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  Our Fleet
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-400">Our Vehicles</span>
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((v, i) => (
                  <motion.div
                    key={v.id}
                    variants={fadeUp}
                    custom={i}
                    whileHover={{ translateY: -6 }}
                    className="group glass-panel overflow-hidden border border-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300"
                  >
                    {v.featured_image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={v.featured_image}
                          alt={v.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 backdrop-blur-sm">
                            {v.vehicle_type}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-bold text-white">{v.name}</h3>
                      <p className="text-sm text-white/40 mt-1">{v.vehicle_no}</p>
                      {v.description && (
                        <p className="text-sm text-white/55 mt-2 line-clamp-2">{v.description}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </SectionWrapper>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      {testimonials.length > 0 && (
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 section-dark-mesh" />
          <div className="orb w-[600px] h-[600px] bg-amber-500/10 top-[-150px] left-[-150px] animate-float-orb-slow" />
          <div className="orb w-[400px] h-[400px] bg-rose-600/10 bottom-[-100px] right-[20%] animate-float-orb-reverse" />

          <div className="container mx-auto px-4 relative">
            <SectionWrapper>
              <motion.div variants={fadeUp} className="text-center mb-16">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 mb-4">
                  Happy Riders
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">Testimonials</span>
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                  <motion.div
                    key={t.id}
                    variants={fadeUp}
                    custom={i}
                    whileHover={{ translateY: -6 }}
                    className="glass-panel p-6 border border-white/10 hover:border-amber-500/30 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] transition-all duration-300 relative"
                  >
                    <Quote className="absolute top-4 right-4 w-8 h-8 text-white/5" />
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          className={`w-4 h-4 ${si < t.star ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
                        />
                      ))}
                    </div>
                    <p className="text-white/65 text-sm leading-relaxed mb-5 italic">"{t.message}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                      {t.image ? (
                        <div className="relative">
                          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 blur-sm" />
                          <img src={imgUrl(t.image)} alt={t.name} className="relative w-10 h-10 rounded-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                          {t.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white text-sm">{t.name}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </SectionWrapper>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          BLOG PREVIEW
      ═══════════════════════════════════════════════ */}
      {blogs.length > 0 && (
        <section className="relative py-24 overflow-hidden bg-slate-900/40">
          <div className="orb w-[500px] h-[500px] bg-blue-600/10 top-[-100px] right-[-100px] animate-float-orb" />

          <div className="container mx-auto px-4 relative">
            <SectionWrapper>
              <motion.div variants={fadeUp} className="flex items-end justify-between mb-12">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 mb-3">
                    Latest Updates
                  </div>
                  <h2 className="text-3xl md:text-5xl font-extrabold">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">From the Blog</span>
                  </h2>
                </div>
                <Link to="/blog" className="hidden md:flex items-center gap-2 text-sm text-white/50 hover:text-blue-400 transition-colors">
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {blogs.slice(0, 3).map((b, i) => (
                  <motion.div key={b.id} variants={fadeUp} custom={i}>
                    <Link
                      to={`/blog/${b.slug}`}
                      className={`group block glass-panel overflow-hidden border border-white/10 hover:border-blue-500/30 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-all duration-300 website-card-hover ${i === 0 ? 'md:col-span-1' : ''}`}
                    >
                      {b.image && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={imgUrl(b.image)}
                            alt={b.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">{b.name}</h3>
                        <div className="mt-3 flex items-center gap-1 text-xs text-blue-400/80">
                          <span>Read more</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={fadeUp} className="mt-8 text-center md:hidden">
                <Link to="/blog" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
                  View all posts
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </SectionWrapper>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          FAQ + CONTACT
      ═══════════════════════════════════════════════ */}
      <section id="contact" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 section-dark" />
        <div className="orb w-[500px] h-[500px] bg-emerald-600/15 top-[-100px] left-[-100px] animate-float-orb-slow" />
        <div className="orb w-[400px] h-[400px] bg-blue-600/10 bottom-[-100px] right-[-50px] animate-float-orb-reverse" />

        <div className="container mx-auto px-4 max-w-6xl relative">
          <SectionWrapper>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold">
                <span className="gradient-text">FAQ & Contact</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* FAQ */}
              <motion.div variants={fadeUp} className="space-y-3">
                <h3 className="text-xl font-bold text-white/90 mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-cyan-400 block" />
                  Frequently Asked Questions
                </h3>
                {faqs.map((f, i) => (
                  <div
                    key={f.id}
                    className="glass-panel border border-white/10 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left text-white/80 hover:text-white transition-colors"
                    >
                      <span className="font-medium pr-4">{f.question}</span>
                      <motion.span
                        animate={{ rotate: openFaq === i ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0 text-emerald-400"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq === i && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-white/5">
                            <RichTextDisplay html={f.answer} className="text-sm text-white/50 mt-3 leading-relaxed" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>

              {/* Contact */}
              <motion.div variants={fadeUp} custom={1}>
                <h3 className="text-xl font-bold text-white/90 mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-400 to-violet-400 block" />
                  Get In Touch
                </h3>
                <div className="glass-panel p-6 border border-white/10">
                  <AnimatePresence mode="wait">
                    {contactSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center justify-center py-12 text-center gap-4"
                      >
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                          <Zap className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white">Message Sent!</h4>
                        <p className="text-white/50 text-sm">We'll get back to you shortly.</p>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onSubmit={handleContactSubmit}
                        className="space-y-4"
                      >
                        <div>
                          <input
                            type="text"
                            placeholder="Your Name"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:bg-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                          />
                        </div>
                        <div>
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:bg-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                          />
                        </div>
                        <div>
                          <textarea
                            placeholder="Your Message"
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            required
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:bg-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:shadow-[0_0_15px_rgba(34,197,94,0.15)] resize-none"
                          />
                        </div>
                        <motion.button
                          type="submit"
                          disabled={contactSubmitting}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative overflow-hidden w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-60 transition-all duration-300 glow-green-sm"
                        >
                          <span className="shimmer absolute inset-0" />
                          {contactSubmitting ? (
                            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin relative" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 relative" />
                              <span className="relative">Send Message</span>
                            </>
                          )}
                        </motion.button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </SectionWrapper>
        </div>
      </section>

      <PublicFooter siteSetting={siteSetting} aboutSlug={aboutSlug} />
    </div>
  );
}
