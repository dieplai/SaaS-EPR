import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, Clock, Tag, ArrowRight, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Mock blog data - replace with real API
const blogPosts = [
  {
    id: 1,
    slug: "epr-compliance-guide-2024",
    title: "Complete Guide to EPR Compliance in Vietnam 2024",
    excerpt: "Navigate the complexities of Extended Producer Responsibility with our comprehensive guide covering latest regulations and best practices.",
    category: "Compliance",
    author: {
      name: "Dr. Minh Nguyen",
      avatar: "https://ui-avatars.com/api/?name=Minh+Nguyen&background=22c55e&color=fff",
      role: "Environmental Law Expert"
    },
    publishedAt: "2024-12-20",
    readingTime: 8,
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200&q=80",
    featured: true,
    tags: ["EPR", "Compliance", "Vietnam", "2024"]
  },
  {
    id: 2,
    slug: "packaging-waste-management",
    title: "Packaging Waste Management: Legal Requirements",
    excerpt: "Understanding your obligations for packaging waste under Vietnam's circular economy framework.",
    category: "Regulations",
    author: {
      name: "Lan Tran",
      avatar: "https://ui-avatars.com/api/?name=Lan+Tran&background=3b82f6&color=fff",
      role: "Sustainability Consultant"
    },
    publishedAt: "2024-12-15",
    readingTime: 6,
    image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=1200&q=80",
    featured: false,
    tags: ["Packaging", "Waste", "Circular Economy"]
  },
  {
    id: 3,
    slug: "electronics-recycling-requirements",
    title: "Electronics Recycling: New Mandates for 2024",
    excerpt: "Major changes in electronics waste management and what businesses need to know.",
    category: "Industry News",
    author: {
      name: "Hung Le",
      avatar: "https://ui-avatars.com/api/?name=Hung+Le&background=8b5cf6&color=fff",
      role: "Tech Policy Analyst"
    },
    publishedAt: "2024-12-10",
    readingTime: 5,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
    featured: false,
    tags: ["Electronics", "E-waste", "Recycling"]
  },
  {
    id: 4,
    slug: "plastic-reduction-strategies",
    title: "5 Proven Strategies for Plastic Reduction",
    excerpt: "Practical approaches to reduce plastic usage while maintaining EPR compliance.",
    category: "Best Practices",
    author: {
      name: "Dr. Minh Nguyen",
      avatar: "https://ui-avatars.com/api/?name=Minh+Nguyen&background=22c55e&color=fff",
      role: "Environmental Law Expert"
    },
    publishedAt: "2024-12-05",
    readingTime: 7,
    image: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=1200&q=80",
    featured: false,
    tags: ["Plastic", "Sustainability", "Strategy"]
  },
  {
    id: 5,
    slug: "epr-penalties-guide",
    title: "Understanding EPR Penalties and How to Avoid Them",
    excerpt: "A comprehensive breakdown of fines, penalties, and compliance deadlines.",
    category: "Compliance",
    author: {
      name: "Lan Tran",
      avatar: "https://ui-avatars.com/api/?name=Lan+Tran&background=3b82f6&color=fff",
      role: "Sustainability Consultant"
    },
    publishedAt: "2024-12-01",
    readingTime: 9,
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80",
    featured: false,
    tags: ["Penalties", "Legal", "Compliance"]
  },
  {
    id: 6,
    slug: "circular-economy-vietnam",
    title: "Vietnam's Circular Economy Roadmap 2030",
    excerpt: "How the national circular economy strategy impacts EPR obligations.",
    category: "Policy",
    author: {
      name: "Hung Le",
      avatar: "https://ui-avatars.com/api/?name=Hung+Le&background=8b5cf6&color=fff",
      role: "Tech Policy Analyst"
    },
    publishedAt: "2024-11-28",
    readingTime: 10,
    image: "https://images.unsplash.com/photo-1569163139394-de4798aa62b0?w=1200&q=80",
    featured: false,
    tags: ["Policy", "Circular Economy", "Strategy"]
  }
];

const Blog = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const sectionRef = useRef<HTMLDivElement>(null);

  const categories = [
    { key: 'all', label: t('blog.categories.all') },
    { key: 'compliance', label: t('blog.categories.compliance') },
    { key: 'regulations', label: t('blog.categories.regulations') },
    { key: 'industryNews', label: t('blog.categories.industryNews') },
    { key: 'bestPractices', label: t('blog.categories.bestPractices') },
    { key: 'policy', label: t('blog.categories.policy') }
  ];

  const categoryMapping: Record<string, string> = {
    'compliance': 'Compliance',
    'regulations': 'Regulations',
    'industryNews': 'Industry News',
    'bestPractices': 'Best Practices',
    'policy': 'Policy'
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === categoryMapping[selectedCategory];
    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts.find(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.fromTo(
        ".blog-hero",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      );

      // Featured post animation
      gsap.fromTo(
        ".featured-post",
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: 0.3,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".featured-post",
            start: "top 80%",
          }
        }
      );

      // Blog cards stagger
      gsap.fromTo(
        ".blog-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".blog-grid",
            start: "top 80%",
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [filteredPosts]);

  return (
    <div className="min-h-screen bg-background" ref={sectionRef}>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="blog-hero max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-0">
              <TrendingUp className="w-3 h-3 mr-1" />
              {t('blog.badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6">
              {t('blog.title')} <span className="text-gradient">{t('blog.titleHighlight')}</span> {t('blog.titleEnd')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('blog.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('blog.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg rounded-2xl border-border/50 bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {categories.map(category => (
                <Badge
                  key={category.key}
                  variant={selectedCategory === category.key ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedCategory === category.key
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => setSelectedCategory(category.key)}
                >
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12">
          <div className="container mx-auto px-4 md:px-6">
            <Link to={`/blog/${featuredPost.slug}`}>
              <div className="featured-post group max-w-7xl mx-auto">
                <div className="relative rounded-3xl overflow-hidden border border-primary/20 bg-card">
                  <div className="grid lg:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="relative h-[400px] lg:h-[600px] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 z-10" />
                      <img
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <Badge className="absolute top-6 left-6 z-20 bg-primary text-primary-foreground">
                        {t('blog.featured')}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                      <Badge variant="outline" className="w-fit mb-4">
                        <Tag className="w-3 h-3 mr-1" />
                        {featuredPost.category}
                      </Badge>

                      <h2 className="text-3xl lg:text-5xl font-display font-bold mb-4 group-hover:text-primary transition-colors">
                        {featuredPost.title}
                      </h2>

                      <p className="text-lg text-muted-foreground mb-6">
                        {featuredPost.excerpt}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-6 mb-6">
                        <div className="flex items-center gap-2">
                          <img
                            src={featuredPost.author.avatar}
                            alt={featuredPost.author.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium">{featuredPost.author.name}</p>
                            <p className="text-xs text-muted-foreground">{featuredPost.author.role}</p>
                          </div>
                        </div>
                        <div className="h-4 w-px bg-border" />
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {featuredPost.readingTime} {t('blog.minRead')}
                          </span>
                        </div>
                      </div>

                      <Button className="w-fit group/btn">
                        {t('blog.readArticle')}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="py-12 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="blog-grid grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {regularPosts.map(post => (
              <Link to={`/blog/${post.slug}`} key={post.id}>
                <article className="blog-card group h-full">
                  <div className="h-full rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/20 transition-all duration-500 flex flex-col">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <Badge className="absolute top-4 right-4 z-20" variant="secondary">
                        {post.category}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-display font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{post.author.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{post.readingTime} {t('blog.minRead')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* No Results */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">{t('blog.noResults')}</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
