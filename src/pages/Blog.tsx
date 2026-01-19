import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight, Search, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";

const categories = ["All", "EV News", "Sustainability", "Charging Tips", "Public Transport"];

const blogPosts = [
  {
    id: 1,
    title: "The Rise of Electric Public Transport in Nepal",
    excerpt: "Discover how EV buses are transforming urban mobility and reducing carbon emissions across major cities in Nepal.",
    date: "Jan 15, 2024",
    author: "Rajesh Kumar",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop",
    category: "EV News",
    featured: true,
  },
  {
    id: 2,
    title: "How to Find the Nearest EV Charging Station",
    excerpt: "A complete guide to using our charging station locator and tips for efficient charging of your electric vehicle.",
    date: "Jan 10, 2024",
    author: "Priya Sharma",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&h=500&fit=crop",
    category: "Charging Tips",
    featured: false,
  },
  {
    id: 3,
    title: "5 Benefits of Switching to EV Commuting",
    excerpt: "From cost savings to environmental impact, learn why more commuters are choosing electric transport for daily travel.",
    date: "Jan 5, 2024",
    author: "Amit Patel",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&fit=crop",
    category: "Sustainability",
    featured: false,
  },
  {
    id: 4,
    title: "Understanding EV Battery Technology",
    excerpt: "Deep dive into the latest advancements in electric vehicle battery technology and what it means for the future.",
    date: "Dec 28, 2023",
    author: "Sunita Rao",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=500&fit=crop",
    category: "EV News",
    featured: false,
  },
  {
    id: 5,
    title: "Government Initiatives for Green Transport",
    excerpt: "An overview of government policies and incentives promoting electric vehicle adoption in Nepal.",
    date: "Dec 20, 2023",
    author: "Rajesh Kumar",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1569359807911-66fd847a9463?w=800&h=500&fit=crop",
    category: "Public Transport",
    featured: false,
  },
  {
    id: 6,
    title: "Reducing Your Carbon Footprint with EVs",
    excerpt: "Practical tips on how switching to electric vehicles can significantly reduce your environmental impact.",
    date: "Dec 15, 2023",
    author: "Sunita Rao",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=500&fit=crop",
    category: "Sustainability",
    featured: false,
  },
];

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogPosts.find((post) => post.featured);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
                Our Blog
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                Latest <span className="gradient-text">Insights</span> & News
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Stay updated with the latest trends in electric mobility, sustainability tips, and EV industry news
              </p>
            </motion.div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-12">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? "gradient-bg text-primary-foreground"
                        : "bg-card border border-border hover:border-primary/30"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Post */}
            {featuredPost && selectedCategory === "All" && !searchQuery && (
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-card rounded-3xl overflow-hidden mb-12"
              >
                <div className="grid lg:grid-cols-2">
                  <div className="relative h-64 lg:h-auto">
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full gradient-bg text-primary-foreground text-xs font-medium">
                        Featured
                      </span>
                    </div>
                  </div>
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium w-fit mb-4">
                      {featuredPost.category}
                    </span>
                    <h2 className="text-2xl lg:text-3xl font-display font-bold mb-4">
                      {featuredPost.title}
                    </h2>
                    <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {featuredPost.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {featuredPost.readTime}
                      </div>
                    </div>
                    <Link
                      to={`/blog/${featuredPost.id}`}
                      className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
                    >
                      Read Article
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            )}
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.filter((post) => !post.featured || selectedCategory !== "All" || searchQuery).map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group rounded-2xl bg-card border border-border overflow-hidden hover:shadow-soft transition-all duration-300"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {post.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </div>
                    </div>
                    <h3 className="text-xl font-display font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{post.author}</span>
                      </div>
                      <Link
                        to={`/blog/${post.id}`}
                        className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:gap-3 transition-all"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
