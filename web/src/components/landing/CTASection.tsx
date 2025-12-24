import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ctaBg from "@/assets/cta-bg.jpg";

gsap.registerPlugin(ScrollTrigger);

const CTASection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cta-content",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".cta-content",
            start: "top 85%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={ctaBg}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="cta-content max-w-5xl mx-auto">
          <div className="glass-card p-10 md:p-16 text-center relative overflow-hidden border-primary/20">
            <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-primary/40 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-primary/40 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-primary/40 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-primary/40 rounded-br-2xl" />

            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/15 border border-primary/30 mb-8 shadow-lg shadow-primary/10">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-semibold text-primary tracking-wide uppercase">
                  {t('cta.badge')}
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                {t('cta.title')}{" "}
                <span className="text-gradient">{t('cta.titleHighlight')}</span>
              </h2>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                {t('cta.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link to="/signup">
                  <Button className="btn-glow text-primary-foreground text-lg px-12 py-7 group shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                    {t('cta.ctaPrimary')}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    className="btn-glass text-foreground text-lg px-12 py-7 border-2"
                  >
                    {t('cta.ctaSecondary')}
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-foreground/80">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  {t('cta.badge1')}
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  {t('cta.badge2')}
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  {t('cta.badge3')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
