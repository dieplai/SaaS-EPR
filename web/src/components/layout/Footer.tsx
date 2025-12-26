import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Twitter, Linkedin, Github, Mail } from "lucide-react";

const Footer = () => {
  const { t } = useTranslation();

  const footerLinks = {
    [t('footer.product')]: [
      { name: t('footer.features'), href: "/#features" },
      { name: t('footer.pricing'), href: "/pricing" },
      { name: t('footer.chatbot'), href: "/chat" },
    ],
    [t('footer.company')]: [
      { name: t('footer.aboutUs'), href: "/about" },
      { name: t('footer.contact'), href: "/contact" },
      { name: t('footer.blog'), href: "/blog" },
    ],
    [t('footer.support')]: [
      { name: t('footer.guide'), href: "/docs" },
      { name: t('footer.faq'), href: "/faq" },
      { name: t('footer.help'), href: "/support" },
    ],
    [t('footer.legal')]: [
      { name: t('footer.privacy'), href: "/privacy" },
      { name: t('footer.terms'), href: "/terms" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com" },
    { icon: Linkedin, href: "https://linkedin.com" },
    { icon: Github, href: "https://github.com" },
    { icon: Mail, href: "mailto:hello@eprai.vn" },
  ];

  return (
    <footer className="relative bg-background border-t border-border/50">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 py-16 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="h-10">
                <img src="/logo.png" alt="EPR AI" className="h-full w-auto object-contain" />
              </div>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-foreground mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Diep Lai. {t('footer.copyright')}
          </p>
          <p className="text-sm text-muted-foreground">
            Designed with 💚 for a sustainable future
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
