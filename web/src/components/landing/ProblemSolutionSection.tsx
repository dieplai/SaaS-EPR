import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ProblemSolutionSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const problems = [
    {
      number: "01",
      title: t('problemSolution.problems.1.title'),
      description: t('problemSolution.problems.1.description'),
    },
    {
      number: "02",
      title: t('problemSolution.problems.2.title'),
      description: t('problemSolution.problems.2.description'),
    },
    {
      number: "03",
      title: t('problemSolution.problems.3.title'),
      description: t('problemSolution.problems.3.description'),
    },
  ];

  const solutions = [
    {
      number: "01",
      title: t('problemSolution.solutionsList.1.title'),
      description: t('problemSolution.solutionsList.1.description'),
    },
    {
      number: "02",
      title: t('problemSolution.solutionsList.2.title'),
      description: t('problemSolution.solutionsList.2.description'),
    },
    {
      number: "03",
      title: t('problemSolution.solutionsList.3.title'),
      description: t('problemSolution.solutionsList.3.description'),
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".section-title-word",
        { opacity: 0, y: 60, rotationX: -90 },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".section-header",
            start: "top 85%",
          },
        }
      );

      gsap.fromTo(
        ".connecting-line",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.5,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: ".connecting-line",
            start: "top 75%",
          },
        }
      );

      gsap.fromTo(
        ".problem-item",
        { opacity: 0, x: -80 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".problems-column",
            start: "top 75%",
          },
        }
      );

      gsap.fromTo(
        ".solution-item",
        { opacity: 0, x: 80 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".solutions-column",
            start: "top 75%",
          },
        }
      );

      gsap.fromTo(
        ".item-number",
        { opacity: 0, scale: 0 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".problems-column",
            start: "top 75%",
          },
        }
      );

      const items = document.querySelectorAll(".hover-item");
      items.forEach((item) => {
        item.addEventListener("mouseenter", () => {
          gsap.to(item, {
            scale: 1.02,
            duration: 0.3,
            ease: "power2.out",
          });
          gsap.to(item.querySelector(".item-line"), {
            width: "100%",
            duration: 0.4,
            ease: "power2.out",
          });
        });
        item.addEventListener("mouseleave", () => {
          gsap.to(item, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          });
          gsap.to(item.querySelector(".item-line"), {
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
    <section ref={sectionRef} className="py-32 md:py-40 relative overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="section-header text-center mb-20 md:mb-28">
          <div className="overflow-hidden">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight">
              <span className="section-title-word inline-block text-muted-foreground/40">{t('problemSolution.title1')}</span>{" "}
              <span className="section-title-word inline-block text-destructive">{t('problemSolution.title2')}</span>{" "}
              <span className="section-title-word inline-block text-muted-foreground/40">{t('problemSolution.title3')}</span>{" "}
              <span className="section-title-word inline-block text-primary">{t('problemSolution.title4')}</span>
            </h2>
          </div>
          <div className="mt-8 flex justify-center">
            <div 
              ref={lineRef}
              className="connecting-line h-px w-32 md:w-48 bg-gradient-to-r from-destructive via-muted-foreground to-primary origin-left"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="problems-column">
            <div className="mb-10">
              <span className="text-xs uppercase tracking-[0.3em] text-destructive/70 font-medium">
                {t('problemSolution.challenges')}
              </span>
              <h3 className="text-2xl md:text-3xl font-display font-semibold mt-2 text-foreground">
                {t('problemSolution.withoutEprAi')}
              </h3>
            </div>
            
            <div className="space-y-6">
              {problems.map((problem, index) => (
                <div
                  key={index}
                  className="problem-item hover-item group cursor-default"
                >
                  <div className="flex items-start gap-6 py-6 border-t border-border/50">
                    <span className="item-number text-4xl md:text-5xl font-display font-bold text-destructive/20 group-hover:text-destructive/40 transition-colors duration-300">
                      {problem.number}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-lg md:text-xl font-semibold text-foreground mb-2 group-hover:text-destructive transition-colors duration-300">
                        {problem.title}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {problem.description}
                      </p>
                      <div className="item-line h-0.5 bg-destructive/50 mt-4 w-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="solutions-column">
            <div className="mb-10">
              <span className="text-xs uppercase tracking-[0.3em] text-primary/70 font-medium">
                {t('problemSolution.solutions')}
              </span>
              <h3 className="text-2xl md:text-3xl font-display font-semibold mt-2 text-foreground">
                {t('problemSolution.withEprAi')}
              </h3>
            </div>
            
            <div className="space-y-6">
              {solutions.map((solution, index) => (
                <div
                  key={index}
                  className="solution-item hover-item group cursor-default"
                >
                  <div className="flex items-start gap-6 py-6 border-t border-border/50">
                    <span className="item-number text-4xl md:text-5xl font-display font-bold text-primary/20 group-hover:text-primary/40 transition-colors duration-300">
                      {solution.number}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-lg md:text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                        {solution.title}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {solution.description}
                      </p>
                      <div className="item-line h-0.5 bg-primary/50 mt-4 w-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 flex justify-center">
          <div className="w-px h-16 bg-gradient-to-b from-border to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;
