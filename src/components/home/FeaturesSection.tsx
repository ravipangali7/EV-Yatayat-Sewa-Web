import { motion } from "framer-motion";
import { Leaf, DollarSign, MapPin, Shield, Smartphone, Building2 } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "100% Electric & Zero Emission",
    description: "Our entire fleet runs on clean electric power, contributing to a healthier environment.",
  },
  {
    icon: DollarSign,
    title: "Affordable Public EV Transport",
    description: "Enjoy cost-effective travel with competitive fares and special discounts for regular commuters.",
  },
  {
    icon: MapPin,
    title: "Wide Charging Network",
    description: "Access 300+ charging stations across the region with real-time availability updates.",
  },
  {
    icon: Shield,
    title: "Reliable & Safe Service",
    description: "All our buses are regularly maintained and equipped with the latest safety features.",
  },
  {
    icon: Smartphone,
    title: "Smart Booking System",
    description: "Book your ride in seconds with our intuitive mobile-friendly booking platform.",
  },
  {
    icon: Building2,
    title: "Corporate Partnerships",
    description: "Special packages for government and corporate fleet management solutions.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
            Why Choose{" "}
            <span className="gradient-text">EV Yatayat Sewa</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the future of sustainable transportation with our comprehensive EV services
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
