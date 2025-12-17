"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api, Subscription } from "@/lib/api";
import {
  User,
  Building2,
  CreditCard,
  Shield,
  Bell,
  LogOut,
  ChevronRight,
  Loader2,
  Sparkles,
  Calendar,
  TrendingUp,
  Settings,
  Home,
  Clock,
  Zap,
} from "lucide-react";
import Link from "next/link";

type Section = "profile" | "company" | "subscription" | "security" | "notifications";

function getTimeUntilReset(nextResetAt?: string): { days: number; hours: number; minutes: number } | null {
  if (!nextResetAt) return null;

  const now = new Date();
  const resetDate = new Date(nextResetAt);
  const diff = resetDate.getTime() - now.getTime();

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState<ReturnType<typeof getTimeUntilReset>>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sub = await api.subscriptions.getCurrent();
        setSubscription(sub);
        setTimeUntilReset(getTimeUntilReset(sub?.next_token_reset_at));
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset(subscription?.next_token_reset_at));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [subscription?.next_token_reset_at]);

  const navigationItems = [
    { id: "profile" as Section, label: "Hồ sơ cá nhân", icon: User },
    { id: "company" as Section, label: "Thông tin công ty", icon: Building2 },
    { id: "subscription" as Section, label: "Gói dịch vụ", icon: CreditCard },
    { id: "security" as Section, label: "Bảo mật", icon: Shield },
    { id: "notifications" as Section, label: "Thông báo", icon: Bell },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="flex h-full flex-col">
          {/* Logo & Home */}
          <div className="border-b border-slate-200/60 p-6">
            <Link href="/" className="flex items-center gap-3 text-slate-900 hover:text-emerald-600 transition-colors">
              <Home className="h-5 w-5" />
              <span className="text-sm font-medium">Về trang chủ</span>
            </Link>
          </div>

          {/* User Info */}
          <div className="border-b border-slate-200/60 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-lg shadow-emerald-500/20">
                {user?.full_name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.full_name || "User"}
                </p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-500/10"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : "group-hover:scale-105"}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Logout Button */}
          <div className="border-t border-slate-200/60 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 min-h-screen p-8">
        <div className="mx-auto max-w-5xl">
          {/* Profile Section */}
          {activeSection === "profile" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hồ sơ cá nhân</h1>
                <p className="mt-2 text-slate-600">Quản lý thông tin cá nhân của bạn</p>
              </div>

              <div className="space-y-6">
                {/* Avatar Card */}
                <div className="group overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm shadow-slate-900/5 transition-all hover:shadow-md hover:shadow-slate-900/10">
                  <div className="flex items-center gap-8">
                    <div className="relative">
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl font-bold text-white shadow-lg shadow-emerald-500/30">
                        {user?.full_name?.charAt(0) || "U"}
                      </div>
                      <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900">{user?.full_name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{user?.email}</p>
                      <div className="mt-4 flex gap-3">
                        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20">
                          Thay đổi ảnh
                        </button>
                        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50">
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Info Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-900/5">
                  <div className="border-b border-slate-200/60 bg-slate-50/50 px-8 py-5">
                    <h3 className="text-lg font-semibold text-slate-900">Thông tin cá nhân</h3>
                  </div>
                  <div className="p-8">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Họ và tên</label>
                        <input
                          type="text"
                          defaultValue={user?.full_name}
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                        <input
                          type="email"
                          defaultValue={user?.email}
                          disabled
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Số điện thoại</label>
                        <input
                          type="tel"
                          placeholder="+84 123 456 789"
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Chức vụ</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Giám đốc Môi trường"
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                      <button className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50">
                        Hủy
                      </button>
                      <button className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40">
                        Lưu thay đổi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Company Section */}
          {activeSection === "company" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Thông tin công ty</h1>
                <p className="mt-2 text-slate-600">Quản lý thông tin doanh nghiệp của bạn</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-900/5">
                <div className="border-b border-slate-200/60 bg-slate-50/50 px-8 py-5">
                  <h3 className="text-lg font-semibold text-slate-900">Chi tiết công ty</h3>
                </div>
                <div className="p-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">Tên công ty</label>
                      <input
                        type="text"
                        defaultValue={user?.company_name}
                        placeholder="Công ty TNHH ABC"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Mã số thuế</label>
                      <input
                        type="text"
                        placeholder="0123456789"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Ngành nghề</label>
                      <input
                        type="text"
                        placeholder="Sản xuất"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">Địa chỉ</label>
                      <input
                        type="text"
                        placeholder="123 Đường ABC, Quận XYZ"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Thành phố</label>
                      <input
                        type="text"
                        placeholder="Hà Nội"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Website</label>
                      <input
                        type="url"
                        placeholder="https://company.com"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end gap-3">
                    <button className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50">
                      Hủy
                    </button>
                    <button className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40">
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Section */}
          {activeSection === "subscription" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gói dịch vụ</h1>
                <p className="mt-2 text-slate-600">Quản lý gói đăng ký và token của bạn</p>
              </div>

              {loading ? (
                <div className="flex h-96 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : subscription ? (
                <div className="space-y-6">
                  {/* Subscription Overview */}
                  <div className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50/50 shadow-sm shadow-emerald-500/10">
                    <div className="p-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-slate-900">
                              {subscription.package_name || "Gói đăng ký"}
                            </h2>
                            <span className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1 text-xs font-medium text-white shadow-lg shadow-emerald-500/30">
                              {subscription.status === "active" ? "Đang hoạt động" : subscription.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            Gia hạn tự động: <span className="font-medium">{subscription.auto_renew ? "Bật" : "Tắt"}</span>
                          </p>
                        </div>
                        <button className="rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-500/30">
                          Nâng cấp gói
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Token Usage */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-900/5">
                    <div className="border-b border-slate-200/60 bg-slate-50/50 px-8 py-5">
                      <h3 className="text-lg font-semibold text-slate-900">Sử dụng Token</h3>
                    </div>
                    <div className="p-8">
                      <div className="mb-6">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-600">Token còn lại</p>
                            <div className="mt-2 flex items-baseline gap-2">
                              <span className="text-4xl font-bold text-emerald-600">
                                {subscription.remaining_tokens.toLocaleString()}
                              </span>
                              <span className="text-lg text-slate-400">
                                / {subscription.total_tokens.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-600">Tỷ lệ sử dụng</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                              {((subscription.remaining_tokens / subscription.total_tokens) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 transition-all duration-500"
                            style={{
                              width: `${(subscription.remaining_tokens / subscription.total_tokens) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                              <Calendar className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-600">Kỳ thanh toán</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {new Date(subscription.current_period_start).toLocaleDateString("vi-VN")} -{" "}
                                {new Date(subscription.current_period_end).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                              <TrendingUp className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-600">Làm mới vào</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {new Date(subscription.current_period_end).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Token Reset Countdown */}
                      {timeUntilReset && subscription.next_token_reset_at && (
                        <div className="mt-6 overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 shadow-sm shadow-emerald-500/10">
                          <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                                <Clock className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-emerald-900 flex items-center gap-2">
                                  <Zap className="h-4 w-4" />
                                  Token sẽ được làm mới trong
                                </h4>
                                <p className="text-xs text-emerald-700 mt-0.5">
                                  Tokens sẽ reset về {subscription.total_tokens.toLocaleString()} tokens
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {timeUntilReset.days > 0 && (
                                <div className="flex flex-col items-center px-6 py-3 rounded-lg bg-white/60 border border-emerald-200/60 shadow-sm">
                                  <span className="text-3xl font-bold text-emerald-600">
                                    {timeUntilReset.days}
                                  </span>
                                  <span className="text-xs font-medium text-emerald-700 mt-1">
                                    ngày
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col items-center px-6 py-3 rounded-lg bg-white/60 border border-emerald-200/60 shadow-sm">
                                <span className="text-3xl font-bold text-emerald-600">
                                  {timeUntilReset.hours}
                                </span>
                                <span className="text-xs font-medium text-emerald-700 mt-1">
                                  giờ
                                </span>
                              </div>
                              <span className="text-3xl font-bold text-emerald-400">:</span>
                              <div className="flex flex-col items-center px-6 py-3 rounded-lg bg-white/60 border border-emerald-200/60 shadow-sm">
                                <span className="text-3xl font-bold text-emerald-600">
                                  {timeUntilReset.minutes}
                                </span>
                                <span className="text-xs font-medium text-emerald-700 mt-1">
                                  phút
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
                        <h4 className="mb-3 font-semibold text-blue-900">Cách hoạt động của Token</h4>
                        <ul className="space-y-2 text-sm text-blue-800">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>Mỗi lần sử dụng chatbot sẽ tiêu tốn token</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>Token sẽ được làm mới mỗi 30 ngày kể từ ngày bắt đầu kỳ</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>Token không sử dụng hết sẽ không được cộng dồn</span>
                          </li>
                          {subscription.auto_renew && (
                            <li className="flex items-start gap-2">
                              <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0" />
                              <span>Gói của bạn sẽ tự động gia hạn khi hết kỳ</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
                  <CreditCard className="h-16 w-16 text-slate-300" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">Chưa có gói đăng ký</h3>
                  <p className="mt-2 text-sm text-slate-600">Bạn chưa đăng ký gói dịch vụ nào</p>
                  <button className="mt-6 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40">
                    Xem các gói dịch vụ
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Security Section */}
          {activeSection === "security" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bảo mật</h1>
                <p className="mt-2 text-slate-600">Quản lý mật khẩu và cài đặt bảo mật</p>
              </div>

              <div className="space-y-6">
                {/* Change Password */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-900/5">
                  <div className="border-b border-slate-200/60 bg-slate-50/50 px-8 py-5">
                    <h3 className="text-lg font-semibold text-slate-900">Đổi mật khẩu</h3>
                  </div>
                  <div className="p-8">
                    <div className="space-y-6">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu hiện tại</label>
                        <input
                          type="password"
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu mới</label>
                        <input
                          type="password"
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</label>
                        <input
                          type="password"
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                      <button className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50">
                        Hủy
                      </button>
                      <button className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40">
                        Cập nhật mật khẩu
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2FA */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-900/5">
                  <div className="border-b border-slate-200/60 bg-slate-50/50 px-8 py-5">
                    <h3 className="text-lg font-semibold text-slate-900">Xác thực hai yếu tố</h3>
                  </div>
                  <div className="p-8">
                    <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                      <div>
                        <h4 className="font-semibold text-slate-900">Xác thực 2FA</h4>
                        <p className="mt-1 text-sm text-slate-600">
                          Bảo vệ tài khoản của bạn với lớp bảo mật bổ sung
                        </p>
                      </div>
                      <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800">
                        Bật 2FA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === "notifications" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Thông báo</h1>
                <p className="mt-2 text-slate-600">Cấu hình các thông báo bạn muốn nhận</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-900/5">
                <div className="border-b border-slate-200/60 bg-slate-50/50 px-8 py-5">
                  <h3 className="text-lg font-semibold text-slate-900">Cài đặt thông báo</h3>
                </div>
                <div className="divide-y divide-slate-200/60">
                  {[
                    { title: "Email về cập nhật sản phẩm", description: "Nhận thông báo về tính năng mới và cập nhật", defaultChecked: true },
                    { title: "Nhắc nhở hết hạn báo cáo", description: "Nhận email nhắc nhở khi đến hạn nộp báo cáo", defaultChecked: true },
                    { title: "Cảnh báo vượt hạn mức", description: "Thông báo khi gần đạt hoặc vượt hạn mức gói dịch vụ", defaultChecked: true },
                    { title: "Thông báo hóa đơn", description: "Nhận email khi có hóa đơn mới", defaultChecked: false },
                    { title: "Tin tức và bài viết", description: "Nhận bản tin hàng tuần về EPR và môi trường", defaultChecked: false },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-6">
                      <div>
                        <h4 className="font-medium text-slate-900">{item.title}</h4>
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" defaultChecked={item.defaultChecked} className="peer sr-only" />
                        <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200/60 px-8 py-5">
                  <div className="flex justify-end gap-3">
                    <button className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50">
                      Hủy
                    </button>
                    <button className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40">
                      Lưu cài đặt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes slide-in-from-bottom-4 {
          from {
            transform: translateY(1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-in {
          animation: fade-in 0.3s ease-out, slide-in-from-bottom-4 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
