"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Menu, X, User, LogOut, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

export function Header() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setMobileMenuOpen(false);
  };

  const navigation = [
    { name: "Trang chủ", href: "/" },
    { name: "Giới thiệu", href: "/about" },
    { name: "Tin tức", href: "/news" },
    { name: "Bảng giá", href: "/pricing" },
    { name: "Liên hệ", href: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-stone-900/5 border-b border-stone-200/50'
          : 'bg-white/60 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 blur-lg rounded-2xl opacity-40 group-hover:opacity-60 transition-all duration-300 scale-110" />

            {/* Logo container */}
            <div className="relative bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <Leaf className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xl font-bold text-stone-900 tracking-tight">
              EPR SaaS
            </span>
            <span className="text-[10px] font-medium text-emerald-600 -mt-1">
              Bền vững & Hiệu quả
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="relative px-4 py-2 text-sm font-semibold text-stone-700 hover:text-emerald-600 transition-colors group"
            >
              {item.name}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full group-hover:w-8 transition-all duration-300" />
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-3">
          {isAuthenticated ? (
            <>
              <Link href="/chat">
                <button className="group relative px-4 py-2 text-sm font-semibold text-stone-700 hover:text-emerald-600 transition-all duration-300 flex items-center gap-2">
                  <div className="relative">
                    <Sparkles className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <span>Trợ lý AI</span>
                </button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 transition-all duration-300 group">
                    <Avatar className="h-8 w-8 rounded-lg border-2 border-emerald-200 shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-xs rounded-lg">
                        {user?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-stone-600 group-hover:text-stone-900 transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-white/95 backdrop-blur-xl border border-stone-200/50 shadow-xl rounded-2xl p-2"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                    <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-sm rounded-xl">
                        {user?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-900 truncate">{user?.full_name}</p>
                      <p className="text-xs text-stone-600 truncate">{user?.email}</p>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuItem asChild>
                    <Link
                      href="/account"
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      <User className="h-4 w-4 text-stone-600" />
                      <span className="text-sm font-semibold text-stone-900">Tài khoản</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-600">Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="px-5 py-2 text-sm font-semibold text-stone-700 hover:text-emerald-600 transition-colors rounded-xl hover:bg-stone-100">
                  Đăng nhập
                </button>
              </Link>
              <Link href="/register">
                <button className="group relative px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative">Đăng ký ngay</span>
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-all duration-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200/50 bg-white/95 backdrop-blur-xl animate-slide-down">
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-3 text-base font-semibold text-stone-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            <div className="pt-4 mt-4 border-t border-stone-200/50 space-y-3">
              {isAuthenticated ? (
                <>
                  {user && (
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                      <Avatar className="h-12 w-12 rounded-xl border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold rounded-xl">
                          {user.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-bold text-stone-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-stone-600 truncate">{user.email}</p>
                      </div>
                    </div>
                  )}

                  <Link href="/chat" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-stone-200 text-stone-900 font-semibold rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-300">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      <span>Trợ lý AI</span>
                    </button>
                  </Link>

                  <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-stone-200 text-stone-900 font-semibold rounded-xl hover:bg-stone-50 transition-all duration-300">
                      <User className="h-5 w-5 text-stone-600" />
                      <span>Tài khoản</span>
                    </button>
                  </Link>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-all duration-300"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-5 py-3 bg-white border border-stone-200 text-stone-900 font-semibold rounded-xl hover:bg-stone-50 transition-all duration-300">
                      Đăng nhập
                    </button>
                  </Link>

                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300">
                      Đăng ký ngay
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </header>
  );
}
