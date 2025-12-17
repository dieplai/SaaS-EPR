import type { Metadata } from "next";
import { Inter, Manrope, DM_Sans, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  variable: "--font-elegant",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-refined",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EPR SaaS - Nền tảng Trách nhiệm Mở rộng của Nhà sản xuất",
  description: "Giải pháp SaaS toàn diện cho quản lý trách nhiệm mở rộng của nhà sản xuất (EPR) và tái chế bền vững. Quản lý dễ dàng, minh bạch và thân thiện với môi trường.",
  keywords: ["EPR", "tái chế", "bền vững", "môi trường", "quản lý chất thải", "trách nhiệm nhà sản xuất"],
  authors: [{ name: "EPR SaaS Platform" }],
  openGraph: {
    title: "EPR SaaS - Nền tảng Trách nhiệm Mở rộng của Nhà sản xuất",
    description: "Giải pháp SaaS toàn diện cho quản lý EPR và tái chế bền vững",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${manrope.variable} ${crimsonPro.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
