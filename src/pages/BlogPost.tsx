import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { Blog } from "@/modules/website/types";

const MEDIA_BASE = "https://system.evyatayatsewa.com";
function imgUrl(path: string | null): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `${MEDIA_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      return;
    }
    setBlog(null);
    setNotFound(false);
    websitePublicApi
      .blogBySlug(slug)
      .then((res) => {
        if (res && typeof res === "object" && "id" in res) {
          setBlog(res as Blog);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="section-padding container text-center">
        <h1 className="text-2xl font-bold">Blog not found</h1>
        <Link to="/blogs" className="text-primary mt-4 inline-block">← Back to Blogs</Link>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="section-padding container text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const dateStr = blog.created_at ? new Date(blog.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

  return (
    <div>
      <section className="bg-[hsl(210_60%_20%)] text-white py-20">
        <div className="container max-w-3xl">
          <Link to="/blogs" className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold">{blog.name}</h1>
          <div className="flex items-center gap-4 mt-4 text-sm opacity-70">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {dateStr}</span>
            <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> Blog</span>
          </div>
        </div>
      </section>
      <section className="section-padding">
        <div className="container max-w-3xl">
          {blog.image && (
            <img src={imgUrl(blog.image)} alt={blog.name} className="w-full rounded-xl mb-8 object-cover max-h-80" />
          )}
          <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: blog.content || "" }} />
        </div>
      </section>
    </div>
  );
}
