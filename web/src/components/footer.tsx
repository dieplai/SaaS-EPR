import Link from "next/link";
import { Leaf, Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  const footerLinks = {
    product: [
      { name: "Tính năng", href: "#" },
      { name: "Bảng giá", href: "/pricing" },
      { name: "Tài liệu", href: "#" },
      { name: "API", href: "#" },
    ],
    company: [
      { name: "Giới thiệu", href: "/about" },
      { name: "Tin tức", href: "/news" },
      { name: "Tuyển dụng", href: "#" },
      { name: "Đối tác", href: "#" },
    ],
    legal: [
      { name: "Chính sách bảo mật", href: "#" },
      { name: "Điều khoản sử dụng", href: "#" },
      { name: "Chính sách cookie", href: "#" },
    ],
    support: [
      { name: "Trung tâm hỗ trợ", href: "#" },
      { name: "Liên hệ", href: "/contact" },
      { name: "Câu hỏi thường gặp", href: "#" },
    ],
  };

  return (
    <footer className="bg-secondary/30 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          {/* Brand section */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <div className="relative bg-gradient-eco p-2 rounded-xl">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="text-lg font-display font-bold text-gradient-eco">
                EPR SaaS
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Giải pháp toàn diện cho quản lý trách nhiệm mở rộng của nhà sản xuất.
              Hướng tới tương lai bền vững và thân thiện với môi trường.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>contact@eprsaas.vn</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+84 123 456 789</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Hà Nội, Việt Nam</span>
              </div>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground mb-4">
              Sản phẩm
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground mb-4">
              Công ty
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground mb-4">
              Hỗ trợ
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground mb-4">
              Pháp lý
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EPR SaaS. Bảo lưu mọi quyền.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
