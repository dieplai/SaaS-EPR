import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import featuresEcoBg from "@/assets/features-eco-bg.jpg";

gsap.registerPlugin(ScrollTrigger);

const FeaturesSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      number: "01",
      title: t('features.feature1.title'),
      description: t('features.feature1.description'),
    },
    {
      number: "02",
      title: t('features.feature2.title'),
      description: t('features.feature2.description'),
    },
    {
      number: "03",
      title: t('features.feature3.title'),
      description: t('features.feature3.description'),
    },
    {
      number: "04",
      title: t('features.feature4.title'),
      description: t('features.feature4.description'),
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".eco-bg", {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.fromTo(
        ".eco-header",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".eco-header",
            start: "top 85%",
          },
        }
      );

      gsap.fromTo(
        ".eco-card",
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: ".eco-grid",
            start: "top 80%",
          },
        }
      );

      const cards = document.querySelectorAll(".eco-card");
      cards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, { y: -8, scale: 1.02, duration: 0.3, ease: "power2.out" });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { y: 0, scale: 1, duration: 0.3, ease: "power2.out" });
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="py-20 md:py-28 relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src={featuresEcoBg}
          alt=""
          className="eco-bg w-full h-[120%] object-cover object-center -translate-y-[10%]"
        />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="eco-header text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 mb-4">
            <span className="text-lg">🌿</span>
            <span className="text-sm font-medium text-primary">{t('features.badge')}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">
            {t('features.title')}
          </h2>
        </div>

        <div className="eco-grid grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="eco-card group relative p-6 md:p-8 rounded-2xl bg-background/40 backdrop-blur-md border border-primary/20 hover:border-primary/50 hover:bg-background/60 transition-colors duration-300 cursor-default"
            >
              <div className="absolute inset-0 rounded-2xl bg-primary/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
              
              <div className="relative">
                <span className="text-4xl md:text-5xl font-display font-bold text-primary/30 group-hover:text-primary/50 transition-colors duration-300">
                  {feature.number}
                </span>
                <h3 className="text-lg md:text-xl font-semibold mt-3 mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 flex flex-wrap justify-center gap-6 md:gap-12">
          {[
            { value: "500+", label: t('features.stat1Label'), icon: "📋" },
            { value: "98%", label: t('features.stat2Label'), icon: "♻️" },
            { value: "24/7", label: t('features.stat3Label'), icon: "🌱" },
          ].map((stat, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-5 py-3 rounded-full bg-background/40 backdrop-blur-sm border border-border/30"
            >
              <span className="text-xl">{stat.icon}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-primary">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
