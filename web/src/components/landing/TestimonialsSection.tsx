import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TestimonialsSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    {
      name: t('testimonials.testimonial1.name'),
      role: t('testimonials.testimonial1.role'),
      company: t('testimonials.testimonial1.company'),
      content: t('testimonials.testimonial1.content'),
      rating: 5,
    },
    {
      name: t('testimonials.testimonial2.name'),
      role: t('testimonials.testimonial2.role'),
      company: t('testimonials.testimonial2.company'),
      content: t('testimonials.testimonial2.content'),
      rating: 5,
    },
    {
      name: t('testimonials.testimonial3.name'),
      role: t('testimonials.testimonial3.role'),
      company: t('testimonials.testimonial3.company'),
      content: t('testimonials.testimonial3.content'),
      rating: 5,
    },
    {
      name: t('testimonials.testimonial4.name'),
      role: t('testimonials.testimonial4.role'),
      company: t('testimonials.testimonial4.company'),
      content: t('testimonials.testimonial4.content'),
      rating: 5,
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        ".testimonial-title",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
          },
        }
      );

      // Infinite scroll animation
      const track = trackRef.current;
      if (track) {
        const cards = track.querySelectorAll(".testimonial-card");
        const totalWidth = Array.from(cards).reduce((acc, card) => acc + (card as HTMLElement).offsetWidth + 24, 0) / 2;

        gsap.to(track, {
          x: -totalWidth,
          duration: 25,
          ease: "none",
          repeat: -1,
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Duplicate testimonials for infinite scroll
  const allTestimonials = [...testimonials, ...testimonials];

  return (
    <section
      ref={sectionRef}
      className="py-12 md:py-16 relative overflow-hidden"
    >
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 mb-8">
        <div className="testimonial-title flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              {t('testimonials.title')} <span className="text-gradient">{t('testimonials.titleHighlight')}</span>
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium text-primary">
                  {testimonials[i - 1].name.charAt(0)}
                </div>
              ))}
            </div>
            <span>{t('testimonials.count')}</span>
          </div>
        </div>
      </div>

      {/* Marquee track */}
      <div className="relative overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-6 w-max"
        >
          {allTestimonials.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial-card group w-[320px] shrink-0"
            >
              <div className="h-full p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:bg-card/80">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-sm text-foreground/90 mb-4 line-clamp-2">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {testimonial.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
