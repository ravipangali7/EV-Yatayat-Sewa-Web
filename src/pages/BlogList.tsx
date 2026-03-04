import { Link } from "react-router-dom";
import { Bus, ArrowRight } from "lucide-react";
import { mockData } from "@/lib/mockData";

export default function BlogList() {
  return (
    <div>
      <section className="bg-[hsl(210_60%_20%)] text-white py-20 text-center">
        <h1 className="text-4xl font-display font-bold">Blog</h1>
        <p className="mt-2 opacity-80">Latest news and updates</p>
      </section>
      <section className="section-padding">
        <div className="container grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockData.blogs.map((b) => (
            <Link to={`/blog/${b.slug}`} key={b.slug} className="bg-card rounded-xl overflow-hidden border hover:shadow-lg transition group">
              <div className="h-48 gradient-primary flex items-center justify-center">
                <Bus className="h-16 w-16 text-primary-foreground opacity-30" />
              </div>
              <div className="p-6">
                <span className="text-xs font-medium text-primary bg-accent px-2 py-1 rounded">{b.category}</span>
                <h3 className="font-display font-semibold text-lg mt-3 mb-2 group-hover:text-primary transition">{b.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{b.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{b.date}</span>
                  <span className="text-primary text-sm font-medium flex items-center gap-1">Read <ArrowRight className="h-3 w-3" /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
