import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, Building } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactInfo = [
  {
    icon: MapPin,
    title: "Our Office",
    details: ["123 Green Transport Avenue", "Eco City, Kathmandu, Nepal"],
  },
  {
    icon: Phone,
    title: "Phone",
    details: ["+977 1234 567 890", "+977 9876 543 210"],
  },
  {
    icon: Mail,
    title: "Email",
    details: ["info@evyatayat.com", "support@evyatayat.com"],
  },
  {
    icon: Clock,
    title: "Working Hours",
    details: ["Sunday - Friday: 6:00 AM - 10:00 PM", "Saturday: 8:00 AM - 6:00 PM"],
  },
];

const Contact = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 hero-gradient">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center text-primary-foreground"
            >
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                Get in <span className="text-primary">Touch</span>
              </h1>
              <p className="text-lg text-primary-foreground/70">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-1 space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Contact Information</h2>
                  <p className="text-muted-foreground">Reach out to us through any of these channels</p>
                </div>

                {contactInfo.map((info, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                      <info.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold mb-1">{info.title}</h3>
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-muted-foreground text-sm">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Quick Links */}
                <div className="pt-6 border-t border-border">
                  <h3 className="font-display font-bold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="tel:+9771234567890">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Now
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="mailto:info@evyatayat.com">
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Live Chat
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-2"
              >
                <div className="glass-card rounded-3xl p-8 md:p-12">
                  <h2 className="text-2xl font-display font-bold mb-2">Send us a Message</h2>
                  <p className="text-muted-foreground mb-8">Fill out the form below and we'll get back to you shortly</p>

                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input placeholder="Your full name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input type="email" placeholder="your@email.com" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <Input type="tel" placeholder="+977 1234 567 890" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subject</label>
                        <Input placeholder="How can we help?" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <Textarea
                        placeholder="Tell us more about your inquiry..."
                        className="min-h-[150px] resize-none"
                      />
                    </div>
                    <Button variant="hero" size="lg" className="w-full">
                      <Send className="w-5 h-5" />
                      Send Message
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-display font-bold mb-4">
                Find Us on the <span className="gradient-text">Map</span>
              </h2>
              <p className="text-muted-foreground">Visit our office for in-person assistance</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl overflow-hidden h-[400px] flex items-center justify-center bg-muted/50"
            >
              <div className="text-center">
                <Building className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display font-bold text-xl mb-2">Office Location</h3>
                <p className="text-muted-foreground">
                  Interactive map showing our office location would be displayed here
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
