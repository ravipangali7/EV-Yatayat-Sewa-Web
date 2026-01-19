import { motion } from "framer-motion";
import { Target, Eye, Heart, Lightbulb, Users, Shield, Leaf } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TeamSection from "@/components/home/TeamSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";

const values = [
  { icon: Leaf, title: "Sustainability", description: "Every decision we make prioritizes environmental impact and long-term ecological health." },
  { icon: Lightbulb, title: "Innovation", description: "We continuously push boundaries in EV technology and service delivery." },
  { icon: Shield, title: "Transparency", description: "Open communication and honest practices guide all our operations." },
  { icon: Users, title: "Customer First", description: "Your comfort, safety, and satisfaction are at the heart of everything we do." },
];

const About = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
                About Us
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                Pioneering{" "}
                <span className="gradient-text">Sustainable Transport</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                EV Yatayat Sewa was founded with a simple yet powerful vision: to revolutionize public transportation 
                in Nepal through clean, affordable, and reliable electric mobility solutions. We believe that the 
                future of transportation is electric, and we're committed to making that future accessible to everyone.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission, Vision & Values */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 mb-20">
              {/* Mission */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="glass-card rounded-3xl p-8 md:p-12"
              >
                <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  To provide affordable, reliable, and environmentally-friendly electric mobility solutions 
                  for everyone. We strive to make sustainable transportation the most convenient choice for 
                  daily commuters while reducing carbon emissions and improving air quality in our cities.
                </p>
              </motion.div>

              {/* Vision */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="gradient-bg rounded-3xl p-8 md:p-12 text-primary-foreground"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Our Vision</h2>
                <p className="text-primary-foreground/90 leading-relaxed text-lg">
                  A future where zero-emission transportation networks connect every corner of Nepal, 
                  where clean air is not a luxury but a right, and where sustainable mobility is the 
                  standard, not the exception. We envision a greener, healthier nation powered by 
                  electric mobility.
                </p>
              </motion.div>
            </div>

            {/* Values */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
                Our Core Values
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                What Drives <span className="gradient-text">Us Forward</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-300 text-center"
                >
                  <div className="w-14 h-14 mx-auto rounded-xl gradient-bg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <value.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <TeamSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default About;
