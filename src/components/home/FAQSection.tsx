import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Bus, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I book an EV bus?",
    answer: "Booking is simple! Use our website or mobile app to enter your pickup location, destination, date, and number of passengers. Browse available buses, select your preferred time, and complete the payment. You'll receive a confirmation with your e-ticket instantly.",
  },
  {
    question: "Where can I find charging stations?",
    answer: "Use our Charging Station Locator feature on the homepage or dedicated charging page. Enter your location or use 'My Location' to find nearby stations. You can filter by charger type (fast/slow), availability, and see real-time status updates.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept multiple payment methods including credit/debit cards, mobile wallets (eSewa, Khalti), bank transfers, and cash payments at designated counters. Corporate accounts can also set up monthly billing.",
  },
  {
    question: "Are EV buses wheelchair accessible?",
    answer: "Yes, all our EV buses are equipped with wheelchair ramps and designated spaces for passengers with mobility needs. Please indicate your accessibility requirements during booking for additional assistance.",
  },
  {
    question: "How long does it take to charge an EV at your stations?",
    answer: "Charging time depends on the charger type and your vehicle's battery. Fast chargers can provide 80% charge in 30-45 minutes, while standard chargers take 2-4 hours for a full charge. Our app shows estimated charging times for each station.",
  },
  {
    question: "Can I cancel or modify my booking?",
    answer: "Yes, you can cancel or modify your booking up to 2 hours before departure for a full refund. Cancellations within 2 hours receive a 50% refund. Modifications are free and can be made through your account or by contacting support.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* FAQ List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
              FAQs
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-8">
              Frequently Asked{" "}
              <span className="gradient-text">Questions</span>
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-soft"
                >
                  <AccordionTrigger className="text-left font-display font-semibold hover:text-primary hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-32"
          >
            <div className="gradient-bg rounded-3xl p-8 md:p-12 text-primary-foreground">
              <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Join the Green Transport Revolution Today
              </h3>
              <p className="text-primary-foreground/80 mb-8 leading-relaxed">
                Be part of the sustainable mobility movement. Book your first EV bus ride or find a charging station near you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero-outline" size="lg" asChild className="flex-1">
                  <Link to="/booking">
                    <Bus className="w-5 h-5" />
                    Book EV Bus
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  asChild 
                  className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <Link to="/charging">
                    <Zap className="w-5 h-5" />
                    Find Charging Station
                  </Link>
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-primary-foreground/20">
                <p className="text-sm text-primary-foreground/60 mb-4">Still have questions?</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-primary-foreground font-medium hover:gap-3 transition-all"
                >
                  Contact our support team
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
