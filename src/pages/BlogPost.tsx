import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { mockData } from "@/lib/mockData";

export default function BlogPost() {
  const { slug } = useParams();
  const blog = mockData.blogs.find((b) => b.slug === slug);

  if (!blog) return (
    <div className="section-padding container text-center">
      <h1 className="text-2xl font-bold">Blog not found</h1>
      <Link to="/blogs" className="text-primary mt-4 inline-block">← Back to Blogs</Link>
    </div>
  );

  return (
    <div>
      <section className="bg-[hsl(210_60%_20%)] text-white py-20">
        <div className="container max-w-3xl">
          <Link to="/blogs" className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold">{blog.title}</h1>
          <div className="flex items-center gap-4 mt-4 text-sm opacity-70">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {blog.date}</span>
            <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> {blog.category}</span>
          </div>
        </div>
      </section>
      <section className="section-padding">
        <div className="container max-w-3xl prose">
          <p className="text-lg text-muted-foreground mb-6">{blog.excerpt}</p>
          <p className="text-muted-foreground">Nepal's electric vehicle revolution is gaining momentum as more people realize the environmental and economic benefits of switching to electric transportation. EV Yatayat Sewa has been at the forefront of this movement, providing reliable and affordable electric bus services across major routes.</p>
          <p className="text-muted-foreground mt-4">Our commitment to sustainability goes beyond just operating electric buses. We invest in renewable energy sources for our charging infrastructure, train our drivers in eco-efficient driving techniques, and continuously improve our services based on passenger feedback.</p>
          <p className="text-muted-foreground mt-4">As we look ahead, we're excited about the possibilities. With government support and growing public awareness, we believe that electric public transportation will become the norm rather than the exception in Nepal within the next decade.</p>
        </div>
      </section>
    </div>
  );
}
