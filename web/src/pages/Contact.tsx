import { useState, useEffect, useRef } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, Building, Clock, Sparkles, ArrowRight, CheckCircle2, Headphones, Globe, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const heroRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.fromTo(
        ".hero-badge",
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
      );

      gsap.fromTo(
        ".hero-title",
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power3.out" }
      );

      gsap.fromTo(
        ".hero-subtitle",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: "power3.out" }
      );

      // Stats
      gsap.fromTo(
        ".hero-stat",
        { opacity: 0, y: 30, scale: 0.9 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.5, 
          stagger: 0.1, 
          delay: 0.6,
          ease: "back.out(1.7)" 
        }
      );

      // Form card
      gsap.fromTo(
        ".form-card",
        { opacity: 0, x: -60, rotateY: 5 },
        { 
          opacity: 1, 
          x: 0, 
          rotateY: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".contact-section",
            start: "top 80%",
          }
        }
      );

      // Info cards
      gsap.fromTo(
        ".info-card",
        { opacity: 0, x: 40 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.6, 
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".contact-section",
            start: "top 75%",
          }
        }
      );

      // Form fields
      gsap.fromTo(
        ".form-field",
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.4, 
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".form-card",
            start: "top 80%",
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      toast({
        title: t('contact.submitSuccess'),
        description: t('contact.submitSuccessDesc'),
      });
      setIsLoading(false);
    }, 1000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: t('contact.emailLabel'),
      value: "contact@eprai.vn",
      href: "mailto:contact@eprai.vn",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Phone,
      title: t('contact.phoneLabel'),
      value: "+84 28 1234 5678",
      href: "tel:+842812345678",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: MapPin,
      title: t('contact.officeLabel'),
      value: t('contact.officeValue'),
      href: null,
      color: "from-orange-500 to-red-500",
    },
  ];

  const features = [
    { icon: Headphones, title: t('contact.feature1'), desc: t('contact.feature1Desc') },
    { icon: Zap, title: t('contact.feature2'), desc: t('contact.feature2Desc') },
    { icon: Globe, title: t('contact.feature3'), desc: t('contact.feature3Desc') },
  ];

  const responsePromiseTags = [
    t('contact.responseTag1', { defaultValue: "Free consultation" }),
    t('contact.responseTag2', { defaultValue: "Live demo" }),
    t('contact.responseTag3', { defaultValue: "Quick quote" }),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section ref={heroRef} className="py-20 md:py-28 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-secondary/10 rounded-full blur-3xl" />
          </div>
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-primary/20 rounded-full animate-float"
                style={{
                  width: `${8 + (i % 3) * 5}px`,
                  height: `${8 + (i % 3) * 5}px`,
                  left: `${15 + i * 14}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.6}s`,
                  animationDuration: `${5 + i}s`
                }}
              />
            ))}
          </div>

          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="text-center max-w-4xl mx-auto">
              <span className="hero-badge inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
                <MessageSquare className="w-4 h-4" />
                {t('contact.badge')}
              </span>
              <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                {t('contact.title')}{" "}
                <span className="text-gradient">{t('contact.titleHighlight')}</span>
                <br />{t('contact.titleEnd')}
              </h1>
              <p className="hero-subtitle text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
                {t('contact.subtitle')}
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="hero-stat p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105"
                  >
                    <feature.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="font-semibold text-foreground">{feature.title}</div>
                    <div className="text-sm text-muted-foreground">{feature.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="contact-section py-16 md:py-24 relative">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-5 gap-10 max-w-6xl mx-auto">
              {/* Form */}
              <div ref={formRef} className="lg:col-span-3">
                <div className="form-card relative group">
                  {/* Glow effect */}
                  <div className="absolute -inset-1 rounded-3xl opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100 bg-gradient-to-r from-primary/30 to-secondary/30" />
                  
                  <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 md:p-10 transition-all duration-300 group-hover:border-primary/30">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                        <Send className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-display font-bold text-foreground">
                          {t('contact.formTitle')}
                        </h2>
                        <p className="text-muted-foreground">
                          {t('contact.formSubtitle')}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="form-field grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-foreground font-medium">
                            {t('contact.firstName')}
                          </Label>
                          <Input
                            id="firstName"
                            placeholder="Nguyen"
                            className="py-6 bg-muted/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-foreground font-medium">
                            {t('contact.lastName')}
                          </Label>
                          <Input
                            id="lastName"
                            placeholder="Van A"
                            className="py-6 bg-muted/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field space-y-2">
                        <Label htmlFor="email" className="text-foreground font-medium">
                          {t('contact.email')}
                        </Label>
                        <div className="relative group/input">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="email@company.com"
                            className="pl-12 py-6 bg-muted/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field space-y-2">
                        <Label htmlFor="company" className="text-foreground font-medium">
                          {t('contact.company')}
                        </Label>
                        <div className="relative group/input">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                          <Input
                            id="company"
                            placeholder="Your company name"
                            className="pl-12 py-6 bg-muted/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field space-y-2">
                        <Label htmlFor="subject" className="text-foreground font-medium">
                          {t('contact.subject')}
                        </Label>
                        <Select>
                          <SelectTrigger className="py-6 bg-muted/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder={t('contact.subjectPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="demo">{t('contact.subjectDemo')}</SelectItem>
                            <SelectItem value="pricing">{t('contact.subjectPricing')}</SelectItem>
                            <SelectItem value="enterprise">{t('contact.subjectEnterprise')}</SelectItem>
                            <SelectItem value="support">{t('contact.subjectSupport')}</SelectItem>
                            <SelectItem value="other">{t('contact.subjectOther')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="form-field space-y-2">
                        <Label htmlFor="message" className="text-foreground font-medium">
                          {t('contact.message')}
                        </Label>
                        <Textarea
                          id="message"
                          placeholder={t('contact.messagePlaceholder')}
                          className="min-h-[140px] bg-muted/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="form-field w-full btn-glow text-primary-foreground py-6 text-base font-semibold hover:scale-[1.02] transition-transform"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                          <>
                            {t('contact.submit')}
                            <ArrowRight className="ml-2 w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div ref={infoRef} className="lg:col-span-2 space-y-6">
                {/* Contact Cards */}
                {contactInfo.map((item, index) => (
                  <div key={index} className="info-card group">
                    <div className="relative rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                          <item.icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {item.title}
                          </p>
                          {item.href ? (
                            <a
                              href={item.href}
                              className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                            >
                              {item.value}
                            </a>
                          ) : (
                            <p className="text-lg font-semibold text-foreground">
                              {item.value}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Office Hours */}
                <div className="info-card">
                  <div className="relative rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/30">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-display font-semibold text-foreground">
                        {t('contact.hoursTitle')}
                      </h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="text-muted-foreground">{t('contact.weekdays')}</span>
                        <span className="text-foreground font-medium">8:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="text-muted-foreground">{t('contact.saturday')}</span>
                        <span className="text-foreground font-medium">9:00 - 12:00</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">{t('contact.sunday')}</span>
                        <span className="text-muted-foreground">{t('contact.closed')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Response Promise */}
                <div className="info-card">
                  <div className="relative rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground mb-2">
                          {t('contact.responsePromise')}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('contact.responsePromiseDesc')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {responsePromiseTags.map((item, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
