import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Bus, CheckCircle } from 'lucide-react';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import { RichTextDisplay } from '@/components/common/RichTextDisplay';
import type { Service } from '@/modules/website/types';

const SERVICE_FEATURES = [
  'Fully electric, zero-emission vehicles',
  'Real-time GPS tracking',
  'Professional and trained drivers',
  '24/7 customer support',
  'Flexible scheduling options',
  'Comfortable AC vehicles',
];

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await websitePublicApi.services();
        const services = Array.isArray(res) ? res : [];
        const found = services.find((s) => s.slug === slug) ?? null;
        setService(found);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="section-padding container text-center">
        <h1 className="text-2xl font-display font-bold">Service not found</h1>
        <Link to="/services" className="text-primary mt-4 inline-block hover:underline">
          ← Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <section className="bg-secondary text-secondary-foreground py-20">
        <div className="container">
          <Link
            to="/services"
            className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 mb-4 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Services
          </Link>
          <div className="flex items-center gap-4">
            {service.svg ? (
              <div
                className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center [&>svg]:h-8 [&>svg]:w-8"
                dangerouslySetInnerHTML={{ __html: service.svg }}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                <Bus className="h-8 w-8" />
              </div>
            )}
            <h1 className="text-4xl font-display font-bold">{service.name}</h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container max-w-3xl">
          <div className="prose prose-sm max-w-none text-muted-foreground mb-10">
            <RichTextDisplay html={service.description} />
          </div>

          <h3 className="font-display font-bold text-xl mb-4">Key Features</h3>
          <div className="space-y-3 mb-10">
            {SERVICE_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-accent-foreground">{f}</span>
              </div>
            ))}
          </div>

          <Link
            to="/contact"
            className="inline-block px-8 py-3 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition"
          >
            Book This Service
          </Link>
        </div>
      </section>
    </div>
  );
}
