import { useState, useEffect } from "react";
import { Leaf, Target, Eye } from "lucide-react";
import heroBus from "@/assets/hero-bus.jpg";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { SiteSetting } from "@/modules/website/types";

const MEDIA_BASE = "https://system.evyatayatsewa.com";
function imgUrl(path: string | null): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `${MEDIA_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

const FALLBACK_MISSION = "To revolutionize public transportation in Nepal by providing clean, efficient, and affordable electric bus services that reduce carbon emissions and improve urban air quality.";
const FALLBACK_VISION = "To become South Asia's leading electric public transport provider, setting the standard for sustainable urban mobility by 2030.";
const FALLBACK_VALUES = "100% Electric Fleet • Fast Charging Infra • Trained Drivers • Zero Emissions";

export default function About() {
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);

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

  const heroImage = siteSetting?.about_image ? imgUrl(siteSetting.about_image) : heroBus;
  const heroTitle = siteSetting?.about_title?.trim() || "About Us";
  const tagline = siteSetting?.tagline?.trim() || "Learn more about EV Yatayat Sewa";
  const missionText = siteSetting?.mission?.trim() || FALLBACK_MISSION;
  const visionText = siteSetting?.vision?.trim() || FALLBACK_VISION;
  const valuesText = siteSetting?.values?.trim() || FALLBACK_VALUES;

  return (
    <div>
      <section className="relative h-64 flex items-center justify-center overflow-hidden">
        <img src={heroImage} alt="About" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 text-center text-primary-foreground">
          <h1 className="text-4xl font-display font-bold">{heroTitle}</h1>
          <p className="mt-2 opacity-80">{tagline}</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-4xl">
          {siteSetting?.about_content?.trim() && (
            <div className="mb-12 prose prose-sm max-w-none prose-p:mb-2 text-muted-foreground" dangerouslySetInnerHTML={{ __html: siteSetting.about_content }} />
          )}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-accent rounded-xl p-8">
              <Target className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-display font-bold text-xl mb-3">Our Mission</h3>
              <p className="text-muted-foreground text-sm">{missionText}</p>
            </div>
            <div className="bg-accent rounded-xl p-8">
              <Eye className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-display font-bold text-xl mb-3">Our Vision</h3>
              <p className="text-muted-foreground text-sm">{visionText}</p>
            </div>
            <div className="bg-accent rounded-xl p-8">
              <Leaf className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-display font-bold text-xl mb-3">Our Values</h3>
              <p className="text-muted-foreground text-sm whitespace-pre-line">{valuesText}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
