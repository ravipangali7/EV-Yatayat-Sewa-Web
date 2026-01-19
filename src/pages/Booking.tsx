import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Calendar, Users, Clock, Bus, ArrowRight, Check } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const routes = [
  { id: 1, from: "Kathmandu", to: "Pokhara", duration: "6h 30m", price: 850, departures: ["6:00 AM", "8:00 AM", "10:00 AM", "2:00 PM"] },
  { id: 2, from: "Kathmandu", to: "Chitwan", duration: "4h 15m", price: 550, departures: ["7:00 AM", "9:00 AM", "1:00 PM", "4:00 PM"] },
  { id: 3, from: "Kathmandu", to: "Biratnagar", duration: "8h 00m", price: 1100, departures: ["6:00 AM", "7:00 PM"] },
  { id: 4, from: "Pokhara", to: "Lumbini", duration: "5h 00m", price: 700, departures: ["7:30 AM", "11:00 AM", "3:00 PM"] },
];

const Booking = () => {
  const [step, setStep] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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
                Book Your <span className="text-primary">EV Bus</span> Journey
              </h1>
              <p className="text-lg text-primary-foreground/70">
                Experience comfortable, eco-friendly travel across Nepal
              </p>
            </motion.div>
          </div>
        </section>

        {/* Progress Steps */}
        <section className="py-8 bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex justify-center gap-4">
              {["Search", "Select Route", "Details", "Payment"].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                      step > i + 1
                        ? "bg-primary text-primary-foreground"
                        : step === i + 1
                        ? "gradient-bg text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium hidden md:block ${step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                  {i < 3 && <ArrowRight className="w-4 h-4 text-muted-foreground hidden md:block" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Form */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl font-display font-bold mb-8 text-center">Search for Routes</h2>
                <div className="glass-card rounded-2xl p-8">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">From</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                        <Input placeholder="Pickup location" className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">To</label>
                      <div className="relative">
                        <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                        <Input placeholder="Destination" className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                        <Input type="date" className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Passengers</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                        <Input type="number" placeholder="1" min="1" className="pl-10" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 text-center">
                    <Button variant="hero" size="lg" onClick={() => setStep(2)}>
                      Search Available Buses
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl font-display font-bold mb-8 text-center">Select Your Route</h2>
                <div className="space-y-4">
                  {routes.map((route) => (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route.id)}
                      className={`glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                        selectedRoute === route.id
                          ? "border-2 border-primary shadow-soft"
                          : "border border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                            <Bus className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-lg">
                              {route.from} → {route.to}
                            </h3>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Clock className="w-4 h-4" />
                              {route.duration}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {route.departures.map((time) => (
                            <button
                              key={time}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRoute(route.id);
                                setSelectedTime(time);
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedRoute === route.id && selectedTime === time
                                  ? "gradient-bg text-primary-foreground"
                                  : "bg-muted hover:bg-primary/10"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-display font-bold text-primary">Rs. {route.price}</div>
                          <div className="text-sm text-muted-foreground">per person</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="hero"
                    size="lg"
                    disabled={!selectedRoute || !selectedTime}
                    onClick={() => setStep(3)}
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl font-display font-bold mb-8 text-center">Passenger Details</h2>
                <div className="glass-card rounded-2xl p-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" placeholder="Enter your email" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input type="tel" placeholder="Enter your phone number" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ID Number</label>
                      <Input placeholder="Enter your ID number" />
                    </div>
                  </div>
                  <div className="mt-8 flex justify-between">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button variant="hero" size="lg" onClick={() => setStep(4)}>
                      Proceed to Payment
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full gradient-bg flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-4">Booking Confirmed!</h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                  Your EV bus ticket has been booked successfully. You will receive a confirmation email with your e-ticket shortly.
                </p>
                <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
                  <h3 className="font-display font-bold mb-4">Booking Summary</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Route</span>
                      <span className="font-medium">Kathmandu → Pokhara</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">Jan 20, 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">{selectedTime || "8:00 AM"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Passengers</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-primary">Rs. 850</span>
                    </div>
                  </div>
                </div>
                <Button variant="hero" size="lg" onClick={() => setStep(1)}>
                  Book Another Trip
                </Button>
              </motion.div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Booking;
