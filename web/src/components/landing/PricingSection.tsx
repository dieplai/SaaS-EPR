import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { adminApiClient } from "@/lib/admin-api-client";
import { formatPrice, formatYearlyPrice } from "@/lib/currency";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface PackagePlan {
  id: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyPeriod: string;
  yearlyPeriod: string;
  tokens: string;
  features: string[];
  cta: string;
  popular: boolean;
}

const PricingSection = () => {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load packages from API
  useEffect(() => {
    const loadPackages = async () => {
      try {
        setIsLoading(true);
        const packages = await adminApiClient.packages.list();

        // Map packages to plan format
        const mappedPlans: PackagePlan[] = packages
          .filter(pkg => pkg.is_active)
          .sort((a, b) => a.price - b.price) // Sort by price
          .map((pkg, index) => {
            const currentLanguage = i18n.language;
            const monthlyPrice = formatPrice(pkg.price, currentLanguage);
            const yearlyPrice = formatYearlyPrice(pkg.price, currentLanguage);

            return {
              id: pkg.id,
              name: pkg.name,
              monthlyPrice,
              yearlyPrice,
              monthlyPeriod: currentLanguage === 'vi' ? '/tháng' : '/month',
              yearlyPeriod: currentLanguage === 'vi' ? '/năm' : '/year',
              tokens: `${pkg.token_limit.toLocaleString()} tokens/tháng`,
              features: pkg.features,
              cta: pkg.name.toLowerCase().includes('enterprise') || pkg.name.toLowerCase().includes('doanh')
                ? t('pricing.enterprise.cta')
                : t('pricing.professional.cta'),
              popular: index === 1, // Middle package (Pro) is popular
            };
          });

        setPlans(mappedPlans);
      } catch (error) {
        console.error("Failed to load packages:", error);
        // Fallback to empty array or show error
      } finally {
        setIsLoading(false);
      }
    };

    loadPackages();
  }, [t, i18n.language]);

  useEffect(() => {
    if (isLoading) return; // Don't animate while loading

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        ".pricing-header > *",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".pricing-header",
            start: "top 85%",
          },
        }
      );

      // Cards stagger with scale
      gsap.fromTo(
        ".pricing-card",
        {
          opacity: 0,
          y: 60,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".pricing-grid",
            start: "top 80%",
          },
        }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, [isLoading, plans]); // Re-run when plans load

  // Animate price change
  useEffect(() => {
    gsap.fromTo(
      ".price-display",
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }
    );
  }, [isYearly]);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="py-24 md:py-32 relative overflow-hidden bg-background"
    >
      {/* Background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative">
        {/* Header */}
        <div className="pricing-header text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-5">
            {t('pricing.badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            {t('pricing.title')}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium transition-colors duration-150 ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              {t('pricing.monthly')}
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 rounded-full bg-muted border border-border/50 transition-colors duration-150 hover:border-primary/30"
            >
              <div 
                className={`absolute top-1 w-5 h-5 rounded-full bg-gradient-to-r from-primary to-secondary shadow-md transition-all duration-150 ease-out ${
                  isYearly ? "left-8" : "left-1"
                }`} 
              />
            </button>
            <span className={`text-sm font-medium transition-colors duration-150 ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              {t('pricing.yearly')}
            </span>
          </div>
          <div className="w-28 ml-3">
            <span className={`px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium transition-all duration-150 ${
              isYearly ? "opacity-100" : "opacity-0"
            }`}>
              {t('pricing.save')}
            </span>
          </div>
        </div>

        {/* Pricing Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="pricing-grid grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
            <div
              key={index}
              className="pricing-card relative group"
            >
              {/* Glow effect - CSS transition */}
              <div className={`absolute -inset-1 rounded-3xl opacity-0 scale-95 blur-xl transition-all duration-100 ease-out group-hover:opacity-100 group-hover:scale-100 ${
                plan.popular 
                  ? "bg-gradient-to-b from-primary/40 to-secondary/40" 
                  : "bg-primary/20"
              }`} />
              
              {/* Card inner */}
              <div className={`relative h-full rounded-2xl border transition-all duration-100 ease-out group-hover:-translate-y-2 ${
                plan.popular 
                  ? "bg-gradient-to-b from-card to-card/80 border-primary/30" 
                  : "bg-card/60 border-border/50 group-hover:border-primary/30"
              }`}>
                
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-4 py-1 bg-gradient-to-r from-primary to-secondary rounded-full text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30">
                      {t('pricing.popular')}
                    </div>
                  </div>
                )}

                <div className="p-7">
                  {/* Name */}
                  <h3 className="text-xl font-display font-bold text-foreground mb-6">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-6 min-h-[72px]">
                    {isYearly ? (
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="price-display text-3xl font-display font-bold text-foreground">
                            {plan.yearlyPrice}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {plan.yearlyPeriod}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-sm text-muted-foreground/60 line-through">
                            {plan.monthlyPrice}{plan.monthlyPeriod}
                          </span>
                          <span className="text-xs text-primary font-medium">
                            ({i18n.language === 'vi' ? 'Tiết kiệm 20%' : 'Save 20%'})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="price-display text-3xl font-display font-bold text-foreground">
                          {plan.monthlyPrice}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {plan.monthlyPeriod}
                        </span>
                      </div>
                    )}
                    <p className="text-primary text-sm mt-2 font-medium">
                      {plan.tokens}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border/50 mb-6" />

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.popular ? "bg-primary/20" : "bg-muted"
                        }`}>
                          <Check className={`w-3 h-3 ${
                            plan.popular ? "text-primary" : "text-muted-foreground"
                          }`} />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link to={
                    plan.name.toLowerCase().includes('enterprise') ||
                    plan.name.toLowerCase().includes('doanh')
                      ? "/contact"
                      : "/signup"
                  }>
                    <Button
                      className={`w-full group/btn ${
                        plan.popular
                          ? "btn-glow text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-14 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <span>{t('pricing.trustBadge1')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <span>{t('pricing.trustBadge2')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <span>{t('pricing.trustBadge3')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
