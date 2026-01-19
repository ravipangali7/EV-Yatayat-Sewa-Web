import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Zap, Clock, Battery, Filter, Search, List, Map } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const stations = [
  { id: 1, name: "Kathmandu Central Charging Hub", address: "New Road, Kathmandu", distance: "0.5 km", type: "Fast", status: "Available", slots: 8, available: 5, price: "Rs. 15/kWh" },
  { id: 2, name: "Thamel EV Station", address: "Thamel Marg, Kathmandu", distance: "1.2 km", type: "Fast", status: "Available", slots: 4, available: 2, price: "Rs. 15/kWh" },
  { id: 3, name: "Patan Durbar Station", address: "Patan, Lalitpur", distance: "2.5 km", type: "Standard", status: "Busy", slots: 6, available: 0, price: "Rs. 12/kWh" },
  { id: 4, name: "Bhaktapur Plaza Charger", address: "Durbar Square, Bhaktapur", distance: "4.8 km", type: "Standard", status: "Available", slots: 4, available: 3, price: "Rs. 12/kWh" },
  { id: 5, name: "Ring Road Hub", address: "Kalanki, Kathmandu", distance: "3.2 km", type: "Fast", status: "Available", slots: 10, available: 7, price: "Rs. 15/kWh" },
  { id: 6, name: "Airport Charging Station", address: "Tribhuvan International Airport", distance: "5.5 km", type: "Fast", status: "Available", slots: 6, available: 4, price: "Rs. 18/kWh" },
];

const Charging = () => {
  const [view, setView] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<"all" | "fast" | "standard">("all");
  const [selectedStation, setSelectedStation] = useState<number | null>(null);

  const filteredStations = stations.filter((s) => {
    if (filter === "all") return true;
    return s.type.toLowerCase() === filter;
  });

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
                Find <span className="text-primary">EV Charging</span> Stations
              </h1>
              <p className="text-lg text-primary-foreground/70 mb-8">
                Locate the nearest charging station with real-time availability
              </p>
              <div className="glass-card rounded-2xl p-4 max-w-2xl mx-auto">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      placeholder="Enter location or address"
                      className="pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                    />
                  </div>
                  <Button variant="hero-outline">
                    <Navigation className="w-5 h-5" />
                    Use My Location
                  </Button>
                  <Button variant="hero">
                    <Search className="w-5 h-5" />
                    Search
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filters & View Toggle */}
        <section className="py-6 bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <div className="flex gap-2">
                  {["all", "fast", "standard"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as typeof filter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filter === f
                          ? "gradient-bg text-primary-foreground"
                          : "bg-card border border-border hover:border-primary/30"
                      }`}
                    >
                      {f === "all" ? "All Stations" : f === "fast" ? "Fast Charging" : "Standard"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setView("list")}
                  className={`p-3 rounded-lg transition-all ${
                    view === "list" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setView("map")}
                  className={`p-3 rounded-lg transition-all ${
                    view === "map" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                  }`}
                >
                  <Map className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stations List */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            {view === "list" ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStations.map((station, index) => (
                  <motion.div
                    key={station.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    onClick={() => setSelectedStation(station.id)}
                    className={`glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                      selectedStation === station.id
                        ? "border-2 border-primary shadow-soft"
                        : "border border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          station.status === "Available"
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {station.status}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2">{station.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{station.address}</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        {station.distance}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-secondary" />
                        {station.type}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Battery className="w-4 h-4 text-primary" />
                        {station.available}/{station.slots} slots
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        {station.price}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden h-[600px] flex items-center justify-center bg-muted/50">
                <div className="text-center">
                  <Map className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-display font-bold text-xl mb-2">Map View</h3>
                  <p className="text-muted-foreground">
                    Interactive map with charging station locations would be displayed here
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Charging;
