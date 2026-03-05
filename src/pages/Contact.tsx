import { useState, useEffect } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { SiteSetting } from "@/modules/website/types";

const FALLBACK = {
  address: "Kathmandu, Nepal",
  phone: "+977-1-4XXXXXX",
  email: "info@evyatayatsewa.com",
};

export default function Contact() {
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    websitePublicApi
      .siteSetting()
      .then((data) => {
        if (data && typeof data === "object" && "name" in data) {
          setSiteSetting(data as SiteSetting);
        }
      })
      .catch(() => {});
  }, []);

  const address = siteSetting?.address?.trim() || FALLBACK.address;
  const phoneDisplay = Array.isArray(siteSetting?.phones) && siteSetting.phones.length > 0 ? String(siteSetting.phones[0]).trim() : FALLBACK.phone;
  const emailDisplay = Array.isArray(siteSetting?.emails) && siteSetting.emails.length > 0 ? String(siteSetting.emails[0]).trim() : FALLBACK.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    try {
      await websitePublicApi.contactSubmit({ name, phone, message });
      setName("");
      setPhone("");
      setMessage("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      // toast handled by api interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="relative min-h-[280px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210_55%_18%)] to-[hsl(210_55%_12%)]" />
        <div className="relative z-10 text-center text-primary-foreground container px-4">
          <p className="section-eyebrow text-primary-foreground/90">Get in touch</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold mt-2">Contact Us</h1>
          <p className="mt-2 text-lg opacity-90">We&apos;d love to hear from you</p>
        </div>
      </section>
      <section className="section-padding-lg section-tint-amber">
        <div className="container grid md:grid-cols-2 gap-12">
          <div>
            <p className="section-eyebrow">Send a message</p>
            <h2 className="text-3xl font-display font-bold mb-6">Send us a Message</h2>
            {success ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center text-sm text-primary font-medium shadow-soft">
                Message sent. We&apos;ll get back to you shortly.
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none transition-shadow"
                />
                <input
                  placeholder="Phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none transition-shadow"
                />
                <textarea
                  placeholder="Message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none resize-none transition-shadow"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-full font-semibold gradient-primary text-primary-foreground shadow-soft hover:shadow-card-hover hover:opacity-95 transition-all w-full disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
          <div className="space-y-6">
            <p className="section-eyebrow">Contact info</p>
            <h2 className="text-3xl font-display font-bold mb-6">Contact Information</h2>
            <div className="flex items-start gap-4 p-5 rounded-2xl border border-border/50 bg-card shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Address</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{address}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-2xl border border-border/50 bg-card shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Phone</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{phoneDisplay}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-2xl border border-border/50 bg-card shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Email</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{emailDisplay}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-2xl border border-border/50 bg-card shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Office Hours</h4>
                <p className="text-sm text-muted-foreground mt-0.5">Sun - Fri: 9:00 AM - 5:00 PM</p>
              </div>
            </div>
            {siteSetting?.map?.trim() ? (
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-soft h-64 bg-muted">
                <iframe title="Map" src={siteSetting.map} className="w-full h-full" />
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-soft h-64 bg-muted flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Map Placeholder</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
