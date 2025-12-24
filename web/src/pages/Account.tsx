import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  CreditCard, 
  Bell, 
  LogOut,
  Edit3,
  Camera,
  Check,
  Zap,
  FileText,
  Crown,
  TrendingUp,
  Calendar,
  Globe,
  Lock,
  Sparkles,
  ChevronLeft,
  Settings,
  HelpCircle,
  Menu,
  X,
  Clock,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import gsap from "gsap";

// Token Reset Countdown Hook
const useTokenResetCountdown = (resetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = resetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [resetDate]);

  return timeLeft;
};

const Account = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Real data from API
  const { user: authUser, logout } = useAuth();
  const { subscription } = useSubscription();

  // User data state (editable fields)
  const [userData, setUserData] = useState({
    name: authUser?.full_name || "",
    email: authUser?.email || "",
    phone: "",
    company: "",
    avatar: "",
  });

  // Update userData when authUser loads
  useEffect(() => {
    if (authUser) {
      setUserData(prev => ({
        ...prev,
        name: authUser.full_name || authUser.email || "",
        email: authUser.email || "",
      }));
    }
  }, [authUser]);

  // Computed values from subscription
  const tokensUsed = (subscription?.total_tokens || 0) - (subscription?.remaining_tokens || 0);
  const tokensTotal = subscription?.total_tokens || 0;
  const plan = subscription?.package_name || "free";

  // Token reset date (7 days cycle) - DIFFERENT from subscription period
  const tokenResetDate = subscription?.next_token_reset_at
    ? new Date(subscription.next_token_reset_at)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Calculate reset cycle days from last and next reset dates
  const resetCycleDays = (() => {
    if (subscription?.last_token_reset_at && subscription?.next_token_reset_at) {
      const lastReset = new Date(subscription.last_token_reset_at);
      const nextReset = new Date(subscription.next_token_reset_at);
      const diffMs = nextReset.getTime() - lastReset.getTime();
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    }
    return 7; // Default 7 days
  })();

  // Subscription renewal date (30 days, 1 year, etc.) - DIFFERENT from token reset
  const subscriptionRenewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  // Use the countdown hook
  const tokenResetCountdown = useTokenResetCountdown(tokenResetDate);

  const [notifications, setNotifications] = useState({
    email: true,
    updates: true,
    marketing: false,
    weekly: true
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Sidebar animation
      gsap.fromTo(
        ".sidebar-item",
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );

      // Profile card
      gsap.fromTo(
        ".profile-mini",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );

      // Content sections
      gsap.fromTo(
        ".content-card",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out", delay: 0.2 }
      );
    });

    return () => ctx.revert();
  }, [activeSection]);

  const handleSaveProfile = () => {
    setIsEditing(false);
    toast({
      title: t('account.saveSuccess'),
      description: t('account.saveSuccessDesc'),
    });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: t('account.logoutSuccess'),
      description: t('account.logoutSuccessDesc'),
    });
  };

  const menuItems = [
    { id: "profile", icon: User, label: t('account.tabs.profile') },
    { id: "security", icon: Shield, label: t('account.tabs.security') },
    { id: "notifications", icon: Bell, label: t('account.tabs.notifications') },
    { id: "billing", icon: CreditCard, label: t('account.tabs.billing') },
    { id: "preferences", icon: Settings, label: t('account.preferences', { defaultValue: "Preferences" }) },
    { id: "help", icon: HelpCircle, label: t('account.help', { defaultValue: "Help & Support" }) },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            {/* Personal Info - Professional Layout */}
            <div className="content-card rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <h2 className="text-lg font-semibold text-foreground">
                  {t('account.personalInfo')}
                </h2>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      {t('account.cancel')}
                    </Button>
                    <Button size="sm" onClick={handleSaveProfile}>
                      {t('account.save')}
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    {t('account.edit')}
                  </Button>
                )}
              </div>

              <div className="divide-y divide-border/50">
                <div className="grid md:grid-cols-3 p-5 hover:bg-muted/30 transition-colors">
                  <div className="text-sm text-muted-foreground mb-1 md:mb-0">{t('account.fullName')}</div>
                  <div className="md:col-span-2">
                    {isEditing ? (
                      <Input value={userData.name} onChange={(e) => setUserData({...userData, name: e.target.value})} className="bg-muted/50 max-w-md" />
                    ) : (
                      <p className="text-foreground font-medium">{userData.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 p-5 hover:bg-muted/30 transition-colors">
                  <div className="text-sm text-muted-foreground mb-1 md:mb-0">{t('account.emailAddress')}</div>
                  <div className="md:col-span-2">
                    {isEditing ? (
                      <Input value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} className="bg-muted/50 max-w-md" />
                    ) : (
                      <p className="text-foreground font-medium">{userData.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 p-5 hover:bg-muted/30 transition-colors">
                  <div className="text-sm text-muted-foreground mb-1 md:mb-0">{t('account.phoneNumber')}</div>
                  <div className="md:col-span-2">
                    {isEditing ? (
                      <Input value={userData.phone} onChange={(e) => setUserData({...userData, phone: e.target.value})} className="bg-muted/50 max-w-md" />
                    ) : (
                      <p className="text-foreground font-medium">{userData.phone}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 p-5 hover:bg-muted/30 transition-colors">
                  <div className="text-sm text-muted-foreground mb-1 md:mb-0">{t('account.company')}</div>
                  <div className="md:col-span-2">
                    {isEditing ? (
                      <Input value={userData.company} onChange={(e) => setUserData({...userData, company: e.target.value})} className="bg-muted/50 max-w-md" />
                    ) : (
                      <p className="text-foreground font-medium">{userData.company}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="content-card rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-xl font-display font-semibold text-foreground mb-6">
              {t('account.passwordSecurity')}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('account.password')}</p>
                    <p className="text-sm text-muted-foreground">{t('account.lastChanged')}: 30 {t('account.daysAgo')}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">{t('account.change')}</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('account.twoFactor')}</p>
                    <p className="text-sm text-muted-foreground">{t('account.twoFactorDesc')}</p>
                  </div>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('account.activeSessions')}</p>
                    <p className="text-sm text-muted-foreground">2 {t('account.devices')}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">{t('account.manage')}</Button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="content-card rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-xl font-display font-semibold text-foreground mb-6">
              {t('account.notificationPrefs')}
            </h2>
            
            <div className="space-y-4">
              {[
                { key: 'email', title: t('account.emailNotif'), desc: t('account.emailNotifDesc') },
                { key: 'updates', title: t('account.productUpdates'), desc: t('account.productUpdatesDesc') },
                { key: 'marketing', title: t('account.marketing'), desc: t('account.marketingDesc') },
                { key: 'weekly', title: t('account.weeklyDigest'), desc: t('account.weeklyDigestDesc') },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch 
                    checked={notifications[item.key as keyof typeof notifications]} 
                    onCheckedChange={(checked) => setNotifications({...notifications, [item.key]: checked})}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            <div className="content-card rounded-2xl border border-border/50 bg-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-semibold text-foreground">
                  {t('account.currentPlan')}
                </h2>
                <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                  <Crown className="w-3 h-3 mr-1" />
                  {plan}
                </Badge>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-2xl font-bold text-foreground mb-1">{tokensTotal} {t('account.tokensPerMonth')}</p>
                    <p className="text-muted-foreground">
                      {t('account.renewsOn')}: {subscriptionRenewalDate
                        ? subscriptionRenewalDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/pricing">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('account.upgradePlan')}
                    </Link>
                  </Button>
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{t('account.tokensUsedThisMonth')}</span>
                    <span className="font-medium text-foreground">{tokensUsed}/{tokensTotal}</span>
                  </div>
                  <Progress value={tokensTotal > 0 ? (tokensUsed / tokensTotal) * 100 : 0} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{t('account.paymentMethod')}</h3>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">{t('account.expires')}: 12/2026</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">{t('account.update')}</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="content-card rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-xl font-display font-semibold text-foreground mb-6">
              {t('account.preferences', { defaultValue: "Preferences" })}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('account.language')}</p>
                    <p className="text-sm text-muted-foreground">Tiếng Việt / English</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">{t('account.change')}</Button>
              </div>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="content-card rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-xl font-display font-semibold text-foreground mb-6">
              {t('account.help', { defaultValue: "Help & Support" })}
            </h2>
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Need help? Contact our support team.</p>
              <Button asChild>
                <Link to="/contact">
                  {t('nav.contact')}
                </Link>
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shadow-lg"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-40
          w-72 bg-card border-r border-border
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Back Button */}
        <div className="p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="sidebar-item w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('common.back', { defaultValue: "Back" })}
          </Button>
        </div>

        {/* Profile Mini Card */}
        <div className="profile-mini p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-14 h-14 border-2 border-primary/20">
                <AvatarImage src={userData.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                  {userData.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{userData.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{userData.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  <Crown className="w-3 h-3 mr-1" />
                  {plan}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setMobileMenuOpen(false);
              }}
              className={`
                sidebar-item w-full flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200
                ${activeSection === item.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Token Usage with Countdown */}
        <div className="p-4 mx-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
          {/* Token Progress */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('account.tokensUsed')}</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{tokensUsed}/{tokensTotal}</span>
          </div>
          <Progress value={tokensTotal > 0 ? (tokensUsed / tokensTotal) * 100 : 0} className="h-2 mb-4" />
          
          {/* Reset Countdown */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('account.tokenResetIn')}</span>
            </div>
            
            {/* Countdown Grid */}
            <div className="grid grid-cols-4 gap-1">
              <div className="text-center p-2 rounded-lg bg-background/50">
                <div className="text-lg font-bold text-foreground leading-none">
                  {String(tokenResetCountdown.days).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{t('account.days')}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50">
                <div className="text-lg font-bold text-foreground leading-none">
                  {String(tokenResetCountdown.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{t('account.hours')}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50">
                <div className="text-lg font-bold text-foreground leading-none">
                  {String(tokenResetCountdown.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{t('account.minutes')}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50">
                <div className="text-lg font-bold text-foreground leading-none animate-pulse">
                  {String(tokenResetCountdown.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{t('account.seconds')}</div>
              </div>
            </div>
            
            {/* Reset Cycle Info */}
            <div className="flex items-center justify-center gap-1 mt-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {t('account.resetCycle')}: {resetCycleDays} {t('account.days')}
              </span>
            </div>
          </div>
          
          <Button size="sm" variant="outline" className="w-full" asChild>
            <Link to="/pricing">
              <Sparkles className="w-4 h-4 mr-2" />
              {t('account.upgrade')}
            </Link>
          </Button>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-border mt-4">
          <Button
            variant="ghost"
            className="sidebar-item w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            {t('account.logout')}
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main ref={contentRef} className="flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {menuItems.find(m => m.id === activeSection)?.label}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('account.manageSettings', { defaultValue: "Manage your account settings and preferences" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex">
                <Check className="w-3 h-3 mr-1 text-green-500" />
                {t('account.verified')}
              </Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Account;
