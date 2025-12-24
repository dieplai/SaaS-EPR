import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  ChevronRight,
  Tag,
  ArrowLeft,
  Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Mock blog data - replace with real API
const blogPost = {
  slug: "epr-compliance-guide-2024",
  title: "Complete Guide to EPR Compliance in Vietnam 2024",
  excerpt: "Navigate the complexities of Extended Producer Responsibility with our comprehensive guide covering latest regulations and best practices.",
  category: "Compliance",
  author: {
    name: "Dr. Minh Nguyen",
    avatar: "https://ui-avatars.com/api/?name=Minh+Nguyen&background=22c55e&color=fff",
    role: "Environmental Law Expert",
    bio: "Dr. Nguyen has over 15 years of experience in environmental law and policy, specializing in circular economy and EPR frameworks."
  },
  publishedAt: "2024-12-20",
  readingTime: 8,
  image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1600&q=80",
  tags: ["EPR", "Compliance", "Vietnam", "2024"],
  content: `
# Understanding EPR in Vietnam

Extended Producer Responsibility (EPR) has become a cornerstone of Vietnam's environmental policy framework. As we enter 2024, understanding these regulations is crucial for businesses operating in Vietnam.

## What is EPR?

EPR is an environmental policy approach where producers take responsibility for the entire lifecycle of their products, particularly for take-back, recycling, and final disposal. In Vietnam, this applies to several key product categories:

- Packaging materials
- Electronics and electrical equipment
- Batteries and accumulators
- Tires
- Lubricant oils

## Key Regulations for 2024

### Decree 08/2022/ND-CP

This decree outlines the producer responsibility framework for waste management. Key provisions include:

1. **Registration Requirements**: All producers must register with the Ministry of Natural Resources and Environment before selling products
2. **Recycling Targets**: Specific targets set for different materials (e.g., 75% for plastic packaging by 2025)
3. **Reporting Obligations**: Annual reports on production volumes and recycling rates

### Circular 02/2022/TT-BTNMT

Implementing the registration process and fee structures for EPR compliance.

## Compliance Steps

### Step 1: Determine Your Obligations

First, identify which of your products fall under EPR regulations. This includes:

- Reviewing your product portfolio
- Checking material compositions
- Assessing import/domestic production ratios

### Step 2: Register with Authorities

Complete registration through the National Environmental Database portal:

1. Create an account on the portal
2. Submit company information
3. Declare product types and volumes
4. Receive confirmation number

### Step 3: Implement Collection Systems

You have two options:

**Option A: Individual System**
- Establish your own take-back network
- Requires significant infrastructure investment
- Provides direct control over recycling

**Option B: Collective System**
- Join an approved Producer Responsibility Organization (PRO)
- Share costs with other producers
- Easier administrative burden

### Step 4: Meet Recycling Targets

Ensure your chosen system achieves the mandated recycling rates:

- Plastic packaging: 60% (2024), 75% (2025)
- Paper packaging: 70% (2024), 85% (2025)
- Metal packaging: 75% (2024), 90% (2025)
- Glass packaging: 80% (2024), 95% (2025)

## Penalties for Non-Compliance

Vietnam has strict enforcement mechanisms:

- **Unregistered Products**: Fines from 50-100 million VND
- **Missing Recycling Targets**: Fines from 100-200 million VND
- **False Reporting**: Fines from 150-250 million VND plus potential criminal liability

## Best Practices

### 1. Start Early

Don't wait until the deadline. EPR registration and system setup take time:

- Registration: 2-3 months
- System establishment: 6-12 months
- Achieving targets: Ongoing effort

### 2. Choose the Right PRO

If going with a collective system, evaluate PROs on:

- Track record of meeting targets
- Geographic coverage
- Cost structure
- Reporting capabilities
- Industry specialization

### 3. Integrate into Product Design

Consider EPR from the design phase:

- Use recyclable materials
- Design for disassembly
- Reduce packaging weight
- Clearly label materials

### 4. Maintain Detailed Records

Keep comprehensive documentation:

- Production/import volumes
- Material types and weights
- Collection and recycling data
- Financial transactions
- Communications with authorities

## Looking Ahead

Vietnam continues to strengthen its EPR framework. Expected developments in 2024-2025:

- Expansion to additional product categories
- Increased recycling targets
- Digital tracking systems
- Enhanced enforcement
- Regional harmonization with ASEAN

## Conclusion

EPR compliance in Vietnam requires careful planning and ongoing commitment. By understanding the regulations, choosing the right implementation approach, and following best practices, businesses can ensure compliance while contributing to Vietnam's circular economy goals.

Need help navigating EPR compliance? Our AI chatbot can answer your specific questions based on current regulations.
  `
};

const relatedPosts = [
  {
    slug: "packaging-waste-management",
    title: "Packaging Waste Management: Legal Requirements",
    image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&q=80",
    category: "Regulations"
  },
  {
    slug: "epr-penalties-guide",
    title: "Understanding EPR Penalties and How to Avoid Them",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    category: "Compliance"
  },
  {
    slug: "circular-economy-vietnam",
    title: "Vietnam's Circular Economy Roadmap 2030",
    image: "https://images.unsplash.com/photo-1569163139394-de4798aa62b0?w=800&q=80",
    category: "Policy"
  }
];

const BlogPost = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Calculate reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const windowHeight = window.innerHeight;
      const documentHeight = contentRef.current.offsetHeight;
      const scrollTop = window.scrollY;
      const scrollHeight = documentHeight - windowHeight;
      const progress = (scrollTop / scrollHeight) * 100;

      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".post-hero",
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      );

      gsap.fromTo(
        ".post-content",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.3,
          ease: "power3.out"
        }
      );

      gsap.fromTo(
        ".related-post",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".related-section",
            start: "top 80%"
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = blogPost.title;

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "The article link has been copied to your clipboard.",
        });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="min-h-screen bg-background" ref={sectionRef}>
      <Navbar />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-border/30 z-50">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="post-hero max-w-4xl mx-auto">
            {/* Back Button */}
            <Link to="/blog">
              <Button variant="ghost" className="mb-6 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>

            {/* Category & Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Badge variant="outline">
                <Tag className="w-3 h-3 mr-1" />
                {blogPost.category}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(blogPost.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {blogPost.readingTime} min read
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              {blogPost.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-8">
              {blogPost.excerpt}
            </p>

            {/* Author */}
            <div className="flex items-center gap-4 mb-8">
              <img
                src={blogPost.author.avatar}
                alt={blogPost.author.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-semibold">{blogPost.author.name}</p>
                <p className="text-sm text-muted-foreground">{blogPost.author.role}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {blogPost.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden aspect-video border border-border/50">
              <img
                src={blogPost.image}
                alt={blogPost.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24" ref={contentRef}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
            {/* Share Sidebar - Desktop */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-32">
                <div className="flex flex-col gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => handleShare("facebook")}
                  >
                    <Facebook className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => handleShare("twitter")}
                  >
                    <Twitter className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => handleShare("linkedin")}
                  >
                    <Linkedin className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => handleShare("copy")}
                  >
                    <LinkIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <article className="post-content lg:col-span-7">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div
                  className="blog-content"
                  dangerouslySetInnerHTML={{
                    __html: blogPost.content.split('\n').map(line => {
                      if (line.startsWith('# ')) return `<h2 class="text-3xl font-display font-bold mt-12 mb-6">${line.substring(2)}</h2>`;
                      if (line.startsWith('## ')) return `<h3 class="text-2xl font-display font-bold mt-8 mb-4">${line.substring(3)}</h3>`;
                      if (line.startsWith('### ')) return `<h4 class="text-xl font-semibold mt-6 mb-3">${line.substring(4)}</h4>`;
                      if (line.startsWith('- ')) return `<li class="ml-6">${line.substring(2)}</li>`;
                      if (line.match(/^\d+\. /)) return `<li class="ml-6">${line.substring(line.indexOf(' ') + 1)}</li>`;
                      if (line.startsWith('**') && line.endsWith('**')) {
                        const text = line.slice(2, -2);
                        return `<p class="font-semibold text-lg mt-4">${text}</p>`;
                      }
                      return line ? `<p class="mb-4 text-foreground/90 leading-relaxed">${line}</p>` : '';
                    }).join('')
                  }}
                />
              </div>

              {/* Author Bio */}
              <div className="mt-16 p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex gap-6">
                  <img
                    src={blogPost.author.avatar}
                    alt={blogPost.author.name}
                    className="w-20 h-20 rounded-full shrink-0"
                  />
                  <div>
                    <h4 className="text-xl font-display font-bold mb-1">About {blogPost.author.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{blogPost.author.role}</p>
                    <p className="text-muted-foreground">{blogPost.author.bio}</p>
                  </div>
                </div>
              </div>

              {/* Share Buttons - Mobile */}
              <div className="lg:hidden mt-8 p-6 rounded-2xl border border-border/50 bg-card/50">
                <p className="font-semibold mb-4 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share this article
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare("facebook")}
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare("twitter")}
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare("linkedin")}
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare("copy")}
                  >
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </article>

            {/* Table of Contents - Desktop */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-32">
                <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
                  <h4 className="font-semibold mb-4">In this article</h4>
                  <nav className="space-y-2 text-sm">
                    <a href="#" className="block text-muted-foreground hover:text-primary transition-colors py-1">
                      Understanding EPR in Vietnam
                    </a>
                    <a href="#" className="block text-muted-foreground hover:text-primary transition-colors py-1 pl-4">
                      What is EPR?
                    </a>
                    <a href="#" className="block text-muted-foreground hover:text-primary transition-colors py-1">
                      Key Regulations for 2024
                    </a>
                    <a href="#" className="block text-muted-foreground hover:text-primary transition-colors py-1">
                      Compliance Steps
                    </a>
                    <a href="#" className="block text-muted-foreground hover:text-primary transition-colors py-1">
                      Penalties for Non-Compliance
                    </a>
                    <a href="#" className="block text-muted-foreground hover:text-primary transition-colors py-1">
                      Best Practices
                    </a>
                    <a href="#" className="block text-muted-foreground hover:text-primary transition-colors py-1">
                      Looking Ahead
                    </a>
                  </nav>
                </div>

                {/* CTA Card */}
                <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                  <h4 className="font-display font-bold text-lg mb-2">Need EPR Guidance?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Chat with our AI assistant for instant answers to your compliance questions.
                  </p>
                  <Link to="/chat">
                    <Button className="w-full">
                      Try AI Chatbot
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <section className="related-section py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-display font-bold mb-12">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((post, index) => (
                <Link to={`/blog/${post.slug}`} key={post.slug}>
                  <article className="related-post group h-full">
                    <div className="h-full rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/20 transition-all duration-500">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <Badge className="absolute top-4 right-4" variant="secondary">
                          {post.category}
                        </Badge>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-display font-bold group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPost;
