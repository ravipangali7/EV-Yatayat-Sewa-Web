import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bus, ArrowRight } from "lucide-react";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { Blog } from "@/modules/website/types";

const MEDIA_BASE = "https://system.evyatayatsewa.com";
function imgUrl(path: string | null): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `${MEDIA_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    websitePublicApi
      .blogs()
      .then((res) => {
        if (Array.isArray(res)) setBlogs(res as Blog[]);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="relative min-h-[280px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210_55%_18%)] to-[hsl(210_55%_12%)]" />
        <div className="relative z-10 text-center text-primary-foreground container px-4">
          <p className="section-eyebrow text-primary-foreground/90">News & updates</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold mt-2">Blog</h1>
          <p className="mt-2 text-lg opacity-90">Latest news and updates</p>
        </div>
      </section>
      <section className="section-padding-lg">
        <div className="container grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-12">No posts yet.</p>
          ) : (
            blogs.map((b) => {
              const excerpt = b.content?.replace(/<[^>]+>/g, "").trim().slice(0, 120) || "";
              const date = b.created_at ? new Date(b.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
              return (
                <Link to={`/blog/${b.slug}`} key={b.id} className="website-card bg-card overflow-hidden group">
                  {b.image ? (
                    <img src={imgUrl(b.image)} alt={b.name} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="h-48 gradient-primary flex items-center justify-center">
                      <Bus className="h-16 w-16 text-primary-foreground opacity-30" />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg">Blog</span>
                    <h3 className="font-display font-semibold text-lg mt-3 mb-2 group-hover:text-primary transition-colors">{b.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{excerpt}{excerpt.length >= 120 ? "…" : ""}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{date}</span>
                      <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Read <ArrowRight className="h-3 w-3" /></span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
