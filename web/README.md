# EPR SaaS Platform - Frontend

Nền tảng SaaS toàn diện cho quản lý trách nhiệm mở rộng của nhà sản xuất (EPR) với thiết kế thân thiện với môi trường.

## Tính năng

### Trang đã triển khai

- ✅ **Trang chủ (/)** - Hero section, features, benefits, testimonials
- ✅ **Giới thiệu (/about)** - Mission, vision, values, team
- ✅ **Tin tức (/news)** - News listing, categories, newsletter
- ✅ **Bảng giá (/pricing)** - 3 gói dịch vụ (Cơ bản, Chuyên nghiệp, Doanh nghiệp)
- ✅ **Liên hệ (/contact)** - Contact form, company info
- ✅ **Đăng nhập (/login)** - Login form with OAuth options
- ✅ **Đăng ký (/register)** - Registration form with OAuth options
- ✅ **Đăng xuất (/logout)** - Logout confirmation
- ✅ **Chat AI (/chat)** - ChatGPT-like interface with sidebar history
- ✅ **Quản lý tài khoản (/account)** - User profile, company info, subscription, security
- ✅ **Admin Dashboard (/admin)** - Analytics, user management, subscription management

### Thiết kế

#### Màu sắc
- **Eco-friendly Green Palette**: Forest green, sage, mint với white/off-white
- **Dark Mode Support**: Deep forest night theme
- **Gradients**: Subtle eco gradients (không lạm dụng)

#### Typography
- **Display Font**: Plus Jakarta Sans (Vietnamese support)
- **Body Font**: Inter (Vietnamese support)

#### Đặc điểm thiết kế
- ✅ Modern, clean, professional
- ✅ Eco-friendly branding với green/white color scheme
- ✅ Organic blob shapes và nature-inspired elements
- ✅ Smooth animations và micro-interactions
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ SEO optimized
- ✅ Accessibility compliant

### Component Library
- **shadcn/ui** - Modern UI components
- **Lucide React** - Icon library
- **Tailwind CSS v4** - Utility-first CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Animations**: Custom CSS animations + tw-animate-css

## Cài đặt

```bash
# Cài đặt dependencies
pnpm install

# Chạy development server
pnpm dev

# Build production
pnpm build

# Chạy production server
pnpm start
```

## Cấu trúc thư mục

```
web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Trang chủ
│   │   ├── about/             # Giới thiệu
│   │   ├── news/              # Tin tức
│   │   ├── pricing/           # Bảng giá
│   │   ├── contact/           # Liên hệ
│   │   ├── login/             # Đăng nhập
│   │   ├── register/          # Đăng ký
│   │   ├── logout/            # Đăng xuất
│   │   ├── chat/              # Chat AI
│   │   ├── account/           # Quản lý tài khoản
│   │   ├── admin/             # Admin dashboard
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles & theme
│   │
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── header.tsx        # Header component
│   │   └── footer.tsx        # Footer component
│   │
│   └── lib/                  # Utilities
│       └── utils.ts          # Helper functions
│
├── public/                   # Static assets
├── components.json           # shadcn/ui config
├── next.config.ts           # Next.js config
├── tailwind.config.ts       # Tailwind config (v4)
└── tsconfig.json            # TypeScript config
```

## Tính năng chính

### 1. Trang chủ
- Hero section với CTA
- Feature cards
- Benefits section
- Customer testimonials
- Floating animations

### 2. Chat AI
- ChatGPT/Claude-like interface
- Sidebar với chat history
- Real-time messaging UI
- Responsive mobile menu

### 3. Admin Dashboard
- Analytics overview với stats cards
- Subscription distribution charts
- User management table với CRUD
- Subscription tier management
- Recent activity feed

### 4. Quản lý tài khoản
- Profile management
- Company information
- Subscription details & billing history
- Security settings (password, 2FA)
- Notification preferences

### 5. Bảng giá
- 3 subscription tiers
- Feature comparison
- Add-ons section
- FAQ section

## Ngôn ngữ

- ✅ **100% Tiếng Việt** - Tất cả nội dung trong tiếng Việt
- ✅ Vietnamese font support (Plus Jakarta Sans, Inter)
- ✅ Vietnamese locale (vi_VN)

## Thư viện shadcn/ui đã cài đặt

- Button, Card, Input, Label, Textarea
- Select, Dropdown Menu, Avatar, Badge
- Dialog, Separator, Sheet, Tabs
- Scroll Area, Table, Tooltip, Popover
- Navigation Menu, Sidebar, Chart

## Tối ưu hóa

- ✅ SEO-friendly metadata
- ✅ Vietnamese language support
- ✅ Responsive design
- ✅ Fast page loads
- ✅ Optimized animations
- ✅ Accessible components

## Phát triển tiếp

### Chức năng có thể thêm:
- [ ] Backend integration với API
- [ ] Authentication (NextAuth.js hoặc Clerk)
- [ ] Database integration (PostgreSQL)
- [ ] Real AI chatbot integration
- [ ] Payment integration (VNPay, Momo)
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Multi-language support

## License

Proprietary - EPR SaaS Platform
