import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import type { SiteSetting } from '@/modules/website/types';

export default function ContactPage() {
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await websitePublicApi.siteSetting();
        setSiteSetting(
          res && Object.keys(res).length > 0 ? (res as SiteSetting) : null,
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await websitePublicApi.contactSubmit({ name, phone, message });
      setName('');
      setPhone('');
      setMessage('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const phones = siteSetting?.phones ?? [];
  const emails = siteSetting?.emails ?? [];
  const address = siteSetting?.address || '';

  const infoCards = [
    {
      icon: MapPin,
      label: 'Address',
      value: address || 'Kathmandu, Nepal',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: phones[0] || '+977-1-XXXXXXX',
      href: phones[0] ? `tel:${phones[0]}` : undefined,
    },
    {
      icon: Mail,
      label: 'Email',
      value: emails[0] || 'info@evyatayatsewa.com',
      href: emails[0] ? `mailto:${emails[0]}` : undefined,
    },
    {
      icon: Clock,
      label: 'Operating Hours',
      value: '6:00 AM – 9:00 PM (Mon–Sun)',
    },
  ];

  return (
    <div>
      {/* Page header */}
      <section className="bg-secondary text-secondary-foreground py-20 text-center">
        <h1 className="text-4xl font-display font-bold">Contact Us</h1>
        <p className="mt-2 opacity-80">We'd love to hear from you</p>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container grid md:grid-cols-2 gap-12">
          {/* Contact form */}
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
              Send a Message
            </p>
            <h2 className="text-3xl font-display font-bold mb-6">Get in Touch</h2>

            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4 bg-accent rounded-xl">
                <CheckCircle className="h-12 w-12 text-primary" />
                <h4 className="text-lg font-bold">Message Sent!</h4>
                <p className="text-muted-foreground text-sm">
                  Thank you for reaching out. We'll get back to you shortly.
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Your Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+977-XXXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Message</label>
                  <textarea
                    placeholder="How can we help you?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 w-full px-8 py-3 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-60"
                >
                  {submitting ? (
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

          {/* Contact info */}
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
              Contact Info
            </p>
            <h2 className="text-3xl font-display font-bold mb-6">Reach Us Directly</h2>

            <div className="space-y-4 mb-8">
              {infoCards.map((card, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-card border">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <card.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      {card.label}
                    </p>
                    {card.href ? (
                      <a
                        href={card.href}
                        className="text-sm font-medium hover:text-primary transition"
                      >
                        {card.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium">{card.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Extra phones/emails */}
            {phones.length > 1 && (
              <div className="p-4 rounded-xl bg-accent mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Additional Numbers
                </p>
                {phones.slice(1).map((p, i) => (
                  <a
                    key={i}
                    href={`tel:${p}`}
                    className="block text-sm text-accent-foreground hover:text-primary transition"
                  >
                    {p}
                  </a>
                ))}
              </div>
            )}

            {siteSetting?.map && (
              <div
                className="rounded-xl overflow-hidden border shadow-sm mt-4"
                dangerouslySetInnerHTML={{ __html: siteSetting.map }}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
