"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  Users,
  Package as PackageIcon,
  Settings,
  LogOut,
  Home,
  Loader2,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  TrendingUp,
  DollarSign,
  Activity,
  Eye,
  BarChart3,
  Shield,
  Zap,
  ChevronRight,
  Menu,
  Bell,
  Moon,
  Sun,
  Clock,
  ToggleLeft,
  ToggleRight,
  Save,
} from "lucide-react";
import Link from "next/link";

type Section = "dashboard" | "users" | "packages" | "settings";

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  token_limit: number;
  duration_days: number;
  features?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PackageFormData {
  name: string;
  description: string;
  price: number;
  token_limit: number;
  duration_days: number;
  is_active: boolean;
}

const API_URL = '/api';

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [packageForm, setPackageForm] = useState<PackageFormData>({
    name: "",
    description: "",
    price: 0,
    token_limit: 0,
    duration_days: 30,
    is_active: true,
  });

  // Token Reset Settings State
  const [tokenResetSettings, setTokenResetSettings] = useState({
    enabled: true,
    cycle_days: 7,
    updated_at: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [freeAccountTokenLimit, setFreeAccountTokenLimit] = useState(5000);
  const [savingFreeAccountSettings, setSavingFreeAccountSettings] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
      return;
    }

    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loading, router]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const response = await apiRequest<{ data: Package[] }>('/packages');
      setPackages(response.data || []);
    } catch (error) {
      console.error("Failed to load packages:", error);
      setPackages([]);
    } finally {
      setLoadingData(false);
    }
  };

  const loadTokenResetSettings = async () => {
    setLoadingSettings(true);
    try {
      const response = await fetch(`${API_URL}/admin/settings/token-reset`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTokenResetSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to load token reset settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadFreeAccountSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/settings/free-account`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setFreeAccountTokenLimit(data.data.token_limit || 5000);
      }
    } catch (error) {
      console.error("Failed to load free account settings:", error);
    }
  };

  const handleSaveTokenResetSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch(`${API_URL}/admin/settings/token-reset`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(tokenResetSettings),
      });

      if (response.ok) {
        alert("✅ Cài đặt đã được lưu thành công!");
        loadTokenResetSettings();
      } else {
        const error = await response.json();
        alert(`❌ Lỗi: ${error.error || "Không thể lưu cài đặt"}`);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("❌ Lỗi kết nối đến server");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveFreeAccountSettings = async () => {
    setSavingFreeAccountSettings(true);
    try {
      const response = await fetch(`${API_URL}/admin/settings/free-account`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token_limit: freeAccountTokenLimit }),
      });

      if (response.ok) {
        alert("✅ Cài đặt tài khoản miễn phí đã được lưu thành công!");
        loadFreeAccountSettings();
      } else {
        const error = await response.json();
        alert(`❌ Lỗi: ${error.error || "Không thể lưu cài đặt"}`);
      }
    } catch (error) {
      console.error("Failed to save free account settings:", error);
      alert("❌ Lỗi kết nối đến server");
    } finally {
      setSavingFreeAccountSettings(false);
    }
  };

  // Load settings when switching to settings tab
  useEffect(() => {
    if (activeSection === 'settings' && isAdmin) {
      loadTokenResetSettings();
      loadFreeAccountSettings();
    }
  }, [activeSection, isAdmin]);

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/packages', {
        method: 'POST',
        body: JSON.stringify(packageForm),
      });
      await loadData();
      setShowPackageModal(false);
      resetPackageForm();
      alert('Tạo gói dịch vụ thành công!');
    } catch (error) {
      console.error("Failed to create package:", error);
      alert('Lỗi: ' + (error instanceof Error ? error.message : 'Không thể tạo gói'));
    }
  };

  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    try {
      await apiRequest(`/admin/packages/${editingPackage.id}`, {
        method: 'PUT',
        body: JSON.stringify(packageForm),
      });
      await loadData();
      setShowPackageModal(false);
      setEditingPackage(null);
      resetPackageForm();
      alert('Cập nhật gói dịch vụ thành công!');
    } catch (error) {
      console.error("Failed to update package:", error);
      alert('Lỗi: ' + (error instanceof Error ? error.message : 'Không thể cập nhật gói'));
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa gói này?")) return;

    try {
      await apiRequest(`/admin/packages/${id}`, {
        method: 'DELETE',
      });
      await loadData();
      alert('Xóa gói dịch vụ thành công!');
    } catch (error) {
      console.error("Failed to delete package:", error);
      alert('Lỗi: ' + (error instanceof Error ? error.message : 'Không thể xóa gói'));
    }
  };

  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.price,
      token_limit: pkg.token_limit,
      duration_days: pkg.duration_days,
      is_active: pkg.is_active,
    });
    setShowPackageModal(true);
  };

  const resetPackageForm = () => {
    setPackageForm({
      name: "",
      description: "",
      price: 0,
      token_limit: 0,
      duration_days: 30,
      is_active: true,
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0B0D]">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-emerald-500/20 rounded-full animate-pulse" />
            <Loader2 className="relative mx-auto h-12 w-12 animate-spin text-emerald-500" />
          </div>
          <p className="mt-6 text-slate-400 font-medium">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { id: "dashboard" as Section, label: "Tổng quan", icon: LayoutDashboard },
    { id: "packages" as Section, label: "Gói dịch vụ", icon: PackageIcon },
    { id: "users" as Section, label: "Người dùng", icon: Users },
    { id: "settings" as Section, label: "Cài đặt", icon: Settings },
  ];

  const stats = [
    {
      label: "Gói dịch vụ",
      value: packages.length,
      icon: PackageIcon,
      gradient: "from-blue-500 to-cyan-500",
      bg: "from-blue-500/10 to-cyan-500/10",
      change: "+12%",
    },
    {
      label: "Gói hoạt động",
      value: packages.filter(p => p.is_active).length,
      icon: Zap,
      gradient: "from-emerald-500 to-teal-500",
      bg: "from-emerald-500/10 to-teal-500/10",
      change: "+8%",
    },
    {
      label: "Tổng doanh thu",
      value: `${(packages.reduce((sum, p) => sum + p.price, 0) / 1000000).toFixed(1)}M đ`,
      icon: DollarSign,
      gradient: "from-violet-500 to-purple-500",
      bg: "from-violet-500/10 to-purple-500/10",
      change: "+23%",
    },
    {
      label: "Tăng trưởng",
      value: "15.4%",
      icon: TrendingUp,
      gradient: "from-orange-500 to-amber-500",
      bg: "from-orange-500/10 to-amber-500/10",
      change: "+5%",
    },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-[#0A0B0D]' : 'bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } transition-all duration-500 ease-out backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-r border-slate-200/50 dark:border-slate-700/50`}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="relative border-b border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
                    <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div>
                    <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      EPR Admin
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Control Panel</p>
                  </div>
                </Link>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Admin Info */}
          {!sidebarCollapsed && (
            <div className="border-b border-slate-200/50 dark:border-slate-700/50 p-6 animate-slide-in">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full blur-md opacity-40" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-lg font-bold text-white shadow-lg shadow-violet-500/30">
                    {user?.full_name?.charAt(0) || 'A'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {user?.full_name || 'Admin'}
                  </p>
                  <p className="truncate text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all duration-300 animate-slide-in ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`${isActive ? 'scale-110' : 'group-hover:scale-105'} transition-transform duration-300`}>
                      <Icon className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    {!sidebarCollapsed && (
                      <span className="font-semibold text-sm">{item.label}</span>
                    )}
                    {isActive && !sidebarCollapsed && (
                      <ChevronRight className="ml-auto h-4 w-4 animate-pulse" />
                    )}
                    {isActive && (
                      <div className="absolute -left-1 top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-r-full bg-white shadow-lg shadow-white/50" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-4 space-y-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {!sidebarCollapsed && <span className="text-sm font-medium">Chế độ {darkMode ? 'sáng' : 'tối'}</span>}
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut className="h-5 w-5" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Đăng xuất</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${sidebarCollapsed ? 'ml-20' : 'ml-72'} min-h-screen p-8 transition-all duration-500 ease-out relative`}>
        <div className="mx-auto max-w-7xl">
          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between animate-slide-up">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Tổng quan hệ thống
                  </h1>
                  <p className="mt-2 text-slate-600 dark:text-slate-400">Theo dõi hiệu suất và số liệu quan trọng</p>
                </div>
                <button className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700">
                  <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {loadingData ? (
                <div className="flex h-96 items-center justify-center">
                  <div className="text-center">
                    <div className="relative">
                      <div className="absolute inset-0 blur-2xl bg-emerald-500/20 rounded-full animate-pulse" />
                      <Loader2 className="relative mx-auto h-12 w-12 animate-spin text-emerald-500" />
                    </div>
                    <p className="mt-6 text-slate-600 dark:text-slate-400">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <div
                          key={index}
                          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-500 animate-scale-in backdrop-blur-xl"
                          style={{
                            animationDelay: `${index * 0.1}s`,
                            backdropFilter: 'blur(20px)',
                          }}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${stat.gradient} text-white`}>
                                {stat.change}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                              {stat.label}
                            </p>
                            <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                              {stat.value}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Charts */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-8 shadow-lg backdrop-blur-xl animate-slide-up">
                      <div className="mb-6 flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Doanh thu</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">7 tháng gần nhất</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-emerald-500" />
                      </div>
                      <div className="flex h-48 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-700/50">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Biểu đồ sẽ hiển thị ở đây</p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-8 shadow-lg backdrop-blur-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                      <div className="mb-6 flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hoạt động</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Gần đây</p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="space-y-4">
                        {[
                          { icon: PackageIcon, text: "Gói mới được tạo", time: "5 phút trước", color: "emerald" },
                          { icon: Users, text: "Người dùng đăng ký", time: "2 giờ trước", color: "blue" },
                        ].map((item, index) => {
                          const ItemIcon = item.icon;
                          return (
                            <div
                              key={index}
                              className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-${item.color}-100 dark:bg-${item.color}-900/30`}>
                                <ItemIcon className={`h-5 w-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.text}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{item.time}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Packages Section */}
          {activeSection === "packages" && (
            <div className="space-y-8 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Quản lý gói dịch vụ
                  </h1>
                  <p className="mt-2 text-slate-600 dark:text-slate-400">{packages.length} gói dịch vụ</p>
                </div>
                <button
                  onClick={() => {
                    setEditingPackage(null);
                    resetPackageForm();
                    setShowPackageModal(true);
                  }}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Tạo gói mới
                  </div>
                </button>
              </div>

              {/* Packages Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg, index) => (
                  <div
                    key={pkg.id}
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl transition-all duration-500 animate-scale-in backdrop-blur-xl"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative border-b border-slate-200 dark:border-slate-700 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{pkg.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{pkg.description}</p>
                        </div>
                        <span
                          className={`ml-3 shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                            pkg.is_active
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                          }`}
                        >
                          {pkg.is_active ? "Hoạt động" : "Tắt"}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          {pkg.price.toLocaleString()}đ
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">/ {pkg.duration_days} ngày</p>
                      </div>
                    </div>

                    <div className="relative p-6">
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Token limit</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {pkg.token_limit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Thời hạn</span>
                          <span className="font-bold text-slate-900 dark:text-white">{pkg.duration_days} ngày</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(pkg)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                          <Edit className="h-4 w-4" />
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Section */}
          {activeSection === "users" && (
            <div className="space-y-8 animate-slide-up">
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Quản lý người dùng
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Chức năng đang được phát triển</p>
              </div>

              <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-16 text-center shadow-lg backdrop-blur-xl">
                <Users className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Quản lý người dùng</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tính năng sẽ được cập nhật trong phiên bản tiếp theo</p>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === "settings" && (
            <div className="space-y-8 animate-slide-up">
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Cài đặt hệ thống
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Quản lý cấu hình hệ thống</p>
              </div>

              {loadingSettings ? (
                <div className="flex h-96 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="space-y-6">
                {/* Free Account Settings */}
                <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 shadow-lg backdrop-blur-xl">
                  <div className="border-b border-slate-200 dark:border-slate-700 p-6 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tài Khoản Miễn Phí</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                          Cấu hình token limit cho tài khoản free
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <label className="block">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                          Token Limit (Free)
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                          Số lượng tokens cho tài khoản miễn phí mặc định
                        </p>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            min="100"
                            max="100000"
                            value={freeAccountTokenLimit}
                            onChange={(e) => setFreeAccountTokenLimit(parseInt(e.target.value) || 100)}
                            className="px-4 py-3 rounded-lg border text-slate-900 dark:text-white font-semibold text-lg w-40 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                          />
                          <span className="text-slate-600 dark:text-slate-400">tokens</span>
                        </div>
                      </label>
                      <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          💡 <strong>Lưu ý:</strong> Tài khoản free sẽ được reset tokens theo chu kỳ giống như gói trả phí. Đây là token limit mặc định khi user đăng ký hoặc hết hạn gói trả phí.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={handleSaveFreeAccountSettings}
                        disabled={savingFreeAccountSettings}
                        className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 disabled:opacity-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl disabled:shadow-none"
                      >
                        <Save className="h-4 w-4" />
                        {savingFreeAccountSettings ? "Đang lưu..." : "Lưu Cài Đặt"}
                      </button>
                    </div>

                    <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50/50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800">
                      <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Tài khoản Free hoạt động như thế nào?
                      </h3>
                      <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Mọi user khi đăng ký sẽ tự động có tài khoản Free</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>User hết hạn gói trả phí sẽ tự động về tài khoản Free</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Token của tài khoản Free cũng được reset theo chu kỳ setting</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Không có subscription trong DB, chỉ tracking ở users table</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Token Auto-Reset Settings */}
                <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 shadow-lg backdrop-blur-xl">
                  <div className="border-b border-slate-200 dark:border-slate-700 p-6 bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Token Auto-Reset</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                          Tự động làm mới tokens cho users theo chu kỳ
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                          Bật tính năng Auto-Reset
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Tự động reset tokens về mức ban đầu sau mỗi chu kỳ
                        </p>
                      </div>
                      <button
                        onClick={() => setTokenResetSettings({ ...tokenResetSettings, enabled: !tokenResetSettings.enabled })}
                        className="relative transition-all duration-200"
                      >
                        {tokenResetSettings.enabled ? (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700">
                            <ToggleRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Bật</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                            <ToggleLeft className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Tắt</span>
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Cycle Days Setting */}
                    <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <label className="block">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                          Chu kỳ Reset (ngày)
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                          Số ngày để tự động reset tokens về mức limit ban đầu
                        </p>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={tokenResetSettings.cycle_days}
                            onChange={(e) => setTokenResetSettings({ ...tokenResetSettings, cycle_days: parseInt(e.target.value) || 1 })}
                            className="px-4 py-3 rounded-lg border text-slate-900 dark:text-white font-semibold text-lg w-32 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                            disabled={!tokenResetSettings.enabled}
                          />
                          <span className="text-slate-600 dark:text-slate-400">ngày</span>
                        </div>
                      </label>
                      <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          💡 <strong>Ví dụ:</strong> Nếu chu kỳ là 7 ngày, tokens của user sẽ được reset về mức gói ban đầu sau mỗi 7 ngày kể từ lần reset trước.
                        </p>
                      </div>
                    </div>

                    {/* Last Updated Info */}
                    {tokenResetSettings.updated_at && (
                      <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Cập nhật lần cuối: <span className="text-slate-900 dark:text-white font-semibold">{new Date(tokenResetSettings.updated_at).toLocaleString('vi-VN')}</span>
                        </p>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={handleSaveTokenResetSettings}
                        disabled={savingSettings}
                        className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 disabled:opacity-50 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl disabled:shadow-none"
                      >
                        <Save className="h-4 w-4" />
                        {savingSettings ? "Đang lưu..." : "Lưu Cài Đặt"}
                      </button>
                    </div>

                    {/* Info Panel */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Cách hoạt động
                      </h3>
                      <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Mỗi user có chu kỳ reset riêng, tính từ lần reset trước đó</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Chỉ áp dụng cho subscriptions đang active và chưa hết hạn</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Tokens sẽ được reset về mức total_tokens của gói đã đăng ký</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Scheduler chạy tự động mỗi giờ để kiểm tra và reset</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>User có thể xem countdown trong Usage Modal và Account page</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Package Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="mx-auto w-full max-w-2xl animate-scale-in">
            <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-700 p-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {editingPackage ? "Sửa gói dịch vụ" : "Tạo gói dịch vụ mới"}
                </h2>
                <button
                  onClick={() => {
                    setShowPackageModal(false);
                    setEditingPackage(null);
                    resetPackageForm();
                  }}
                  className="rounded-xl p-2 text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={editingPackage ? handleUpdatePackage : handleCreatePackage} className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Tên gói</label>
                    <input
                      type="text"
                      required
                      value={packageForm.name}
                      onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                      placeholder="Ví dụ: Gói Pro"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Mô tả</label>
                    <textarea
                      value={packageForm.description}
                      onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                      placeholder="Mô tả gói dịch vụ"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Giá (VNĐ)</label>
                      <input
                        type="number"
                        required
                        value={packageForm.price}
                        onChange={(e) => setPackageForm({ ...packageForm, price: Number(e.target.value) })}
                        className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Token limit</label>
                      <input
                        type="number"
                        required
                        value={packageForm.token_limit}
                        onChange={(e) =>
                          setPackageForm({ ...packageForm, token_limit: Number(e.target.value) })
                        }
                        className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                        placeholder="10000"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Thời hạn (ngày)</label>
                      <input
                        type="number"
                        required
                        value={packageForm.duration_days}
                        onChange={(e) =>
                          setPackageForm({ ...packageForm, duration_days: Number(e.target.value) })
                        }
                        className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                        placeholder="30"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={packageForm.is_active}
                        onChange={(e) => setPackageForm({ ...packageForm, is_active: e.target.checked })}
                        className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <label htmlFor="is_active" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Kích hoạt gói
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPackageModal(false);
                      setEditingPackage(null);
                      resetPackageForm();
                    }}
                    className="rounded-xl border-2 border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 transition-all"
                  >
                    {editingPackage ? "Cập nhật" : "Tạo gói"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.05);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
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

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
