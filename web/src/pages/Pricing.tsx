import { useEffect, useRef } from "react";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Pricing = () => {
  const { t } = useTranslation();
  const faqRef = useRef<HTMLDivElement>(null);

  const faqs = [
    {
      question: t('faq.q1.question'),
      answer: t('faq.q1.answer'),
    },
    {
      question: t('faq.q2.question'),
      answer: t('faq.q2.answer'),
    },
    {
      question: t('faq.q3.question'),
      answer: t('faq.q3.answer'),
    },
    {
      question: t('faq.q4.question'),
      answer: t('faq.q4.answer'),
    },
    {
      question: t('faq.q5.question'),
      answer: t('faq.q5.answer'),
    },
    {
      question: t('faq.q6.question'),
      answer: t('faq.q6.answer'),
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // FAQ section
      gsap.fromTo(
        ".faq-header",
        { opacity: 0, y: 40 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".faq-section",
            start: "top 80%",
          }
        }
      );

      gsap.fromTo(
        ".faq-item",
        { opacity: 0, x: -30 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.5, 
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".faq-list",
            start: "top 85%",
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Pricing Section from Homepage */}
        <PricingSection />

        {/* FAQ */}
        <section ref={faqRef} className="faq-section py-20 md:py-28 bg-muted/20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="faq-header text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <HelpCircle className="w-4 h-4" />
                {t('faq.badge')}
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                {t('faq.title')}
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                {t('faq.subtitle')}
              </p>
            </div>

            <div className="faq-list max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="faq-item rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm px-6 overflow-hidden hover:border-primary/30 transition-colors"
                  >
                    <AccordionTrigger className="text-foreground hover:text-primary py-5 text-left font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section from Homepage */}
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
