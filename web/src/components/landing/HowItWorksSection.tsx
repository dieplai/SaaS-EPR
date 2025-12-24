import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import stepAskImg from "@/assets/step-ask.png";
import stepAnalyzeImg from "@/assets/step-analyze.png";
import stepAnswersImg from "@/assets/step-answers.png";

gsap.registerPlugin(ScrollTrigger);

const HowItWorksSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      number: "01",
      image: stepAskImg,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
    },
    {
      number: "02",
      image: stepAnalyzeImg,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
    },
    {
      number: "03",
      image: stepAnswersImg,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title word reveal animation (same style as section 2)
      gsap.fromTo(
        ".how-title-word",
        { opacity: 0, y: 60, rotationX: -90 },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".how-header",
            start: "top 85%",
          },
        }
      );

      // Connecting line animation
      gsap.fromTo(
        ".how-connecting-line",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.5,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: ".how-connecting-line",
            start: "top 75%",
          },
        }
      );

      // Cards slide up with stagger
      gsap.fromTo(
        ".step-card",
        { opacity: 0, y: 80 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 75%",
          },
        }
      );

      // Number badges scale animation
      gsap.fromTo(
        ".step-number",
        { opacity: 0, scale: 0 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 75%",
          },
        }
      );

      // Hover interactions for cards
      const cards = document.querySelectorAll(".step-card");
      cards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, {
            scale: 1.02,
            duration: 0.3,
            ease: "power2.out",
          });
          gsap.to(card.querySelector(".card-line"), {
            width: "100%",
            duration: 0.4,
            ease: "power2.out",
          });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          });
          gsap.to(card.querySelector(".card-line"), {
            width: "0%",
            duration: 0.4,
            ease: "power2.out",
          });
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="py-32 md:py-40 relative overflow-hidden bg-background"
    >
      {/* Background blurs */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative">
        {/* Header - same style as section 2 */}
        <div className="how-header text-center mb-20 md:mb-28">
          <div className="overflow-hidden">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight">
              <span className="how-title-word inline-block text-muted-foreground/40">{t('howItWorks.title1')}</span>{" "}
              <span className="how-title-word inline-block text-primary">{t('howItWorks.title2')}</span>{" "}
              <span className="how-title-word inline-block text-muted-foreground/40">{t('howItWorks.title3')}</span>
            </h2>
          </div>
          <div className="mt-8 flex justify-center">
            <div className="how-connecting-line h-px w-32 md:w-48 bg-gradient-to-r from-primary/50 via-secondary to-primary/50 origin-left" />
          </div>
        </div>

        {/* Cards Grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto"
        >
          {steps.map((step, index) => (
            <div
              key={index}
              className="step-card group cursor-default"
            >
              <div className="border-t border-border/50 pt-8">
                {/* Number */}
                <span className="step-number text-5xl md:text-6xl font-display font-bold text-primary/20 group-hover:text-primary/40 transition-colors duration-300">
                  {step.number}
                </span>

                {/* Image */}
                <div className="relative overflow-hidden rounded-2xl my-6">
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl overflow-hidden">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Animated line on hover */}
                <div className="card-line h-0.5 bg-primary/50 mt-6 w-0" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom decoration */}
        <div className="mt-20 flex justify-center">
          <div className="w-px h-16 bg-gradient-to-b from-border to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
