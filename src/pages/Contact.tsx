import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Contact() {
  return (
    <div>
      <section className="bg-[hsl(210_60%_20%)] text-white py-20 text-center">
        <h1 className="text-4xl font-display font-bold">Contact Us</h1>
        <p className="mt-2 opacity-80">We'd love to hear from you</p>
      </section>
      <section className="section-padding">
        <div className="container grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-display font-bold mb-6">Send us a Message</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="First Name" className="px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
                <input placeholder="Last Name" className="px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <input placeholder="Email" type="email" className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
              <input placeholder="Phone" className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
              <input placeholder="Subject" className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
              <textarea placeholder="Message" rows={5} className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
              <button type="submit" className="px-8 py-3 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition w-full">
                Send Message
              </button>
            </form>
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold mb-6">Contact Information</h2>
            {[
              { icon: MapPin, title: "Address", desc: "Kathmandu, Bagmati Province, Nepal" },
              { icon: Phone, title: "Phone", desc: "+977-1-4XXXXXX" },
              { icon: Mail, title: "Email", desc: "info@evyatayatsewa.com" },
              { icon: Clock, title: "Office Hours", desc: "Sun - Fri: 9:00 AM - 5:00 PM" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl border">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
            <div className="rounded-xl overflow-hidden border h-64 bg-muted flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Map Placeholder</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
