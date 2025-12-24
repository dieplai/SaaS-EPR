import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Recycle,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Coins,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import dashboardPreview from "@/assets/dashboard-preview.png";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { subscription } = useSubscription();

  const tokensUsed = (subscription?.total_tokens || 0) - (subscription?.remaining_tokens || 0);
  const tokensTotal = subscription?.total_tokens || 0;

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard", active: true },
    { icon: MessageSquare, label: "AI Advisor", href: "/chat", active: false },
    { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", active: false },
    { icon: Settings, label: "Settings", href: "/dashboard/settings", active: false },
  ];

  const complianceItems = [
    { region: "Germany (VerpackG)", status: "compliant", deadline: "May 15, 2025", progress: 100 },
    { region: "France (AGEC)", status: "pending", deadline: "Mar 31, 2025", progress: 75 },
    { region: "UK (EPR)", status: "action", deadline: "Jan 15, 2025", progress: 45 },
    { region: "Spain (RAP)", status: "compliant", deadline: "Jun 30, 2025", progress: 100 },
  ];

  const recentActivity = [
    { action: "AI Query", description: "German packaging requirements", time: "2 hours ago", tokens: 3 },
    { action: "Report Generated", description: "Q4 2024 Compliance Report", time: "Yesterday", tokens: 0 },
    { action: "AI Query", description: "France AGEC deadline extensions", time: "2 days ago", tokens: 5 },
    { action: "Alert", description: "UK EPR deadline approaching", time: "3 days ago", tokens: 0 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "action":
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "compliant":
        return "Compliant";
      case "pending":
        return "In Progress";
      case "action":
        return "Action Required";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Recycle className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-foreground">
                CycleWorks
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Token Balance */}
          <div className="p-4 border-t border-border">
            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI Tokens</p>
                  <p className="text-lg font-bold text-foreground">{tokensUsed} / {tokensTotal}</p>
                </div>
              </div>
              <Progress value={tokensTotal > 0 ? (tokensUsed / tokensTotal) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {subscription?.next_token_reset_at
                  ? `Resets ${new Date(subscription.next_token_reset_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : "Resets in 7 days"}
              </p>
            </div>
          </div>

          {/* User & Logout */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">JD</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">John Doe</p>
                <p className="text-xs text-muted-foreground">Pro Plan</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive">
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-foreground"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search regulations, reports..."
                  className="pl-11 bg-muted/50 border-border/50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </button>
              <Link to="/chat">
                <Button className="btn-glow text-primary-foreground">
                  Ask AI Advisor
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-6 lg:p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Welcome back, John!
            </h1>
            <p className="text-muted-foreground">
              Here's an overview of your EPR compliance status
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[
              { label: "Active Regions", value: "12", change: "+2", icon: TrendingUp },
              { label: "Compliance Rate", value: "87%", change: "+5%", icon: CheckCircle },
              { label: "Pending Actions", value: "3", change: "-1", icon: AlertTriangle },
              { label: "AI Queries Today", value: "8", change: "+3", icon: MessageSquare },
            ].map((stat, index) => (
              <div key={index} className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm text-primary font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-display font-bold text-foreground mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Compliance Tracker */}
            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Compliance Tracker
                </h2>
                <Button variant="ghost" className="text-primary text-sm">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-4">
                {complianceItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-foreground">{item.region}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            item.status === "compliant"
                              ? "bg-primary/10 text-primary"
                              : item.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={item.progress} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Due: {item.deadline}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-display font-semibold text-foreground mb-6">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                        {activity.tokens > 0 && (
                          <span className="text-xs text-primary">
                            -{activity.tokens} tokens
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dashboard Preview Image */}
          <div className="mt-8 glass-card p-6">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">
              Analytics Overview
            </h2>
            <img
              src={dashboardPreview}
              alt="Analytics Dashboard Preview"
              className="w-full rounded-xl opacity-80"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
