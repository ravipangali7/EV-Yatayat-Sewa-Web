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
      <section className="bg-[hsl(210_60%_20%)] text-white py-20 text-center">
        <h1 className="text-4xl font-display font-bold">Blog</h1>
        <p className="mt-2 opacity-80">Latest news and updates</p>
      </section>
      <section className="section-padding">
        <div className="container grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-12">No posts yet.</p>
          ) : (
            blogs.map((b) => {
              const excerpt = b.content?.replace(/<[^>]+>/g, "").trim().slice(0, 120) || "";
              const date = b.created_at ? new Date(b.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
              return (
                <Link to={`/blog/${b.slug}`} key={b.id} className="bg-card rounded-xl overflow-hidden border hover:shadow-lg transition group">
                  {b.image ? (
                    <img src={imgUrl(b.image)} alt={b.name} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="h-48 gradient-primary flex items-center justify-center">
                      <Bus className="h-16 w-16 text-primary-foreground opacity-30" />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="text-xs font-medium text-primary bg-accent px-2 py-1 rounded">Blog</span>
                    <h3 className="font-display font-semibold text-lg mt-3 mb-2 group-hover:text-primary transition">{b.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{excerpt}{excerpt.length >= 120 ? "…" : ""}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{date}</span>
                      <span className="text-primary text-sm font-medium flex items-center gap-1">Read <ArrowRight className="h-3 w-3" /></span>
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
