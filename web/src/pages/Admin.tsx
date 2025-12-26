import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Recycle,
  LayoutDashboard,
  Package,
  Settings as SettingsIcon,
  Users,
  LogOut,
  Menu,
  X,
  Plus,
  Edit,
  Save,
  XCircle,
  TrendingUp,
  Activity,
  DollarSign,
  Zap,
  Shield,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { adminApiClient, AdminPackage, TokenResetSettings, FreeAccountSettings } from "@/lib/admin-api-client";

const Admin = () => {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "packages" | "settings">("overview");
  const { toast } = useToast();

  // Loading states
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Package Management State
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<AdminPackage | null>(null);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [packageForm, setPackageForm] = useState<Partial<AdminPackage>>({
    name: "",
    description: "",
    price: 0,
    token_limit: 100,
    duration_days: 30,
    features: [],
    is_active: true,
  });
  const [featureInput, setFeatureInput] = useState("");

  // Settings State
  const [tokenResetSettings, setTokenResetSettings] = useState<TokenResetSettings>({
    enabled: true,
    cycle_days: 30,
  });
  const [freeAccountSettings, setFreeAccountSettings] = useState<FreeAccountSettings>({
    token_limit: 50,
  });

  // Load packages from API
  useEffect(() => {
    loadPackages();
  }, []);

  // Load settings from API when settings section is active
  useEffect(() => {
    if (activeSection === "settings") {
      loadSettings();
    }
  }, [activeSection]);

  const loadPackages = async () => {
    try {
      setIsLoadingPackages(true);
      const data = await adminApiClient.packages.list();
      setPackages(data);
    } catch (error: any) {
      console.error("Failed to load packages:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load packages",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const [tokenReset, freeAccount] = await Promise.all([
        adminApiClient.settings.tokenReset.get(),
        adminApiClient.settings.freeAccount.get(),
      ]);
      setTokenResetSettings(tokenReset);
      setFreeAccountSettings(freeAccount);
    } catch (error: any) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Stats - Calculate from real data
  const activePackages = packages.filter(p => p.is_active).length;
  const totalTokensAvailable = packages.reduce((sum, p) => sum + p.token_limit, 0);
  const averagePrice = packages.length > 0
    ? (packages.reduce((sum, p) => sum + p.price, 0) / packages.length)
    : 0;

  const stats = [
    { label: "Total Packages", value: packages.length.toString(), change: `${activePackages} active`, icon: Package, color: "text-blue-500" },
    { label: "Total Tokens", value: totalTokensAvailable.toLocaleString(), change: "across all plans", icon: Zap, color: "text-primary" },
    { label: "Average Price", value: `$${averagePrice.toFixed(2)}`, change: "USD per package", icon: DollarSign, color: "text-green-600" },
    { label: "System Health", value: "Operational", change: "All services", icon: Activity, color: "text-purple-500" },
  ];

  const navItems = [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "packages", icon: Package, label: "Packages" },
    { id: "settings", icon: SettingsIcon, label: "Settings" },
    { id: "users", icon: Users, label: "Users", disabled: true },
  ];

  const handleEditPackage = (pkg: AdminPackage) => {
    setEditingPackage(pkg);
    setPackageForm(pkg);
    setFeatureInput("");
    setIsPackageDialogOpen(true);
  };

  const handleSavePackage = async () => {
    if (!editingPackage) return;

    try {
      setIsSaving(true);

      // Update existing package
      await adminApiClient.packages.update(editingPackage.id, {
        name: packageForm.name!,
        description: packageForm.description!,
        price: packageForm.price!,
        token_limit: packageForm.token_limit!,
        duration_days: packageForm.duration_days!,
        features: packageForm.features!,
        is_active: packageForm.is_active!,
      });
      toast({ title: "Package Updated", description: "Package has been updated successfully." });

      setIsPackageDialogOpen(false);
      await loadPackages(); // Reload packages
    } catch (error: any) {
      console.error("Failed to save package:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save package",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setPackageForm({
        ...packageForm,
        features: [...(packageForm.features || []), featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    setPackageForm({
      ...packageForm,
      features: packageForm.features?.filter((_, i) => i !== index) || [],
    });
  };

  const handleSaveTokenResetSettings = async () => {
    try {
      setIsSaving(true);
      await adminApiClient.settings.tokenReset.update(tokenResetSettings);
      toast({ title: "Settings Saved", description: "Token reset settings updated successfully." });
    } catch (error: any) {
      console.error("Failed to save token reset settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFreeAccountSettings = async () => {
    try {
      setIsSaving(true);
      await adminApiClient.settings.freeAccount.update(freeAccountSettings);
      toast({ title: "Settings Saved", description: "Free account settings updated successfully." });
    } catch (error: any) {
      console.error("Failed to save free account settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-display font-bold text-foreground block">
                  Admin Panel
                </span>
                <span className="text-xs text-muted-foreground">EPR SaaS</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.disabled && setActiveSection(item.id as any)}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === item.id
                    ? "bg-primary/10 text-primary"
                    : item.disabled
                    ? "text-muted-foreground/50 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.disabled && (
                  <Badge variant="outline" className="ml-auto text-xs">Soon</Badge>
                )}
              </button>
            ))}
          </nav>

          {/* System Status */}
          <div className="p-4 border-t border-border">
            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <p className="text-lg font-bold text-foreground">Operational</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                All services running
              </div>
            </div>
          </div>

          {/* Admin User */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">AD</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">administrator</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={() => logout()}
            >
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
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-foreground"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="flex items-center gap-2">
              <h1 className="text-lg font-display font-bold text-foreground">
                {navItems.find(item => item.id === activeSection)?.label}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden md:flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last sync: 2 min ago
              </Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6 lg:p-8">
          {/* Overview Section */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="glass-card p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
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

              {/* Quick Actions */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                  Quick Actions
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => setActiveSection("settings")}
                    className="h-auto py-4 flex-col gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-0"
                    variant="outline"
                  >
                    <SettingsIcon className="w-5 h-5" />
                    <span>System Settings</span>
                  </Button>
                  <Button
                    onClick={() => setActiveSection("packages")}
                    className="h-auto py-4 flex-col gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 border-0"
                    variant="outline"
                  >
                    <Package className="w-5 h-5" />
                    <span>View Packages</span>
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-display font-semibold text-foreground mb-6">
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  {[
                    { action: "Package Created", detail: "Professional plan updated", time: "2 hours ago", type: "success" },
                    { action: "Settings Changed", detail: "Token reset cycle updated to 30 days", time: "5 hours ago", type: "info" },
                    { action: "New Subscription", detail: "User upgraded to Professional", time: "1 day ago", type: "success" },
                    { action: "System Update", detail: "Backend service updated to v2.1.0", time: "2 days ago", type: "warning" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        activity.type === "success" ? "bg-primary/10 text-primary" :
                        activity.type === "info" ? "bg-blue-500/10 text-blue-500" :
                        "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.detail}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Packages Section */}
          {activeSection === "packages" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  Edit package pricing and token limits (3 fixed packages)
                </p>
              </div>

              {isLoadingPackages ? (
                <div className="glass-card p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="glass-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="font-semibold">Package</TableHead>
                        <TableHead className="font-semibold">Price</TableHead>
                        <TableHead className="font-semibold">Tokens</TableHead>
                        <TableHead className="font-semibold">Duration</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No packages found. Create your first package to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        packages.map((pkg) => (
                      <TableRow key={pkg.id} className="border-border">
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{pkg.name}</p>
                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground">
                            ${pkg.price.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{pkg.token_limit}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{pkg.duration_days} days</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pkg.is_active ? "default" : "secondary"}>
                            {pkg.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditPackage(pkg)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                        </TableRow>
                      ))
                    )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Settings Section */}
          {activeSection === "settings" && (
            <div className="space-y-6">
              {isLoadingSettings ? (
                <div className="glass-card p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Token Reset Settings */}
                  <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-display font-semibold text-foreground">
                      Token Reset Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Configure automatic token reset cycles for subscriptions
                    </p>
                  </div>
                </div>

                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <div>
                      <Label htmlFor="reset-enabled" className="text-base font-medium">
                        Enable Token Reset
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically reset tokens on a regular cycle
                      </p>
                    </div>
                    <Switch
                      id="reset-enabled"
                      checked={tokenResetSettings.enabled}
                      onCheckedChange={(checked) =>
                        setTokenResetSettings({ ...tokenResetSettings, enabled: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cycle-days">Reset Cycle (days)</Label>
                    <Input
                      id="cycle-days"
                      type="number"
                      min="1"
                      max="365"
                      value={tokenResetSettings.cycle_days}
                      onChange={(e) =>
                        setTokenResetSettings({
                          ...tokenResetSettings,
                          cycle_days: parseInt(e.target.value) || 1,
                        })
                      }
                      className="max-w-xs"
                    />
                    <p className="text-sm text-muted-foreground">
                      Tokens will reset every {tokenResetSettings.cycle_days} days
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSaveTokenResetSettings} className="gap-2" disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>

              {/* Free Account Settings */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-display font-semibold text-foreground">
                      Free Account Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Configure default settings for free tier accounts
                    </p>
                  </div>
                </div>

                <div className="space-y-4 max-w-2xl">
                  <div className="space-y-2">
                    <Label htmlFor="free-tokens">Default Token Limit</Label>
                    <Input
                      id="free-tokens"
                      type="number"
                      min="100"
                      max="100000"
                      value={freeAccountSettings.token_limit}
                      onChange={(e) =>
                        setFreeAccountSettings({
                          token_limit: parseInt(e.target.value) || 100,
                        })
                      }
                      className="max-w-xs"
                    />
                    <p className="text-sm text-muted-foreground">
                      Free accounts will receive {freeAccountSettings.token_limit} tokens
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSaveFreeAccountSettings} className="gap-2" disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Package Dialog */}
      <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">
              Edit Package
            </DialogTitle>
            <DialogDescription>
              Update package pricing and token limits
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pkg-name">Package Name</Label>
                <Input
                  id="pkg-name"
                  value={packageForm.name}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Package name cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pkg-price">Price (USD)</Label>
                <Input
                  id="pkg-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={packageForm.price}
                  onChange={(e) =>
                    setPackageForm({ ...packageForm, price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="9.99"
                />
                <p className="text-xs text-muted-foreground">
                  Price in USD (will be auto-converted to VND for Vietnamese users)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pkg-desc">Description</Label>
              <Textarea
                id="pkg-desc"
                value={packageForm.description}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                placeholder="Brief description of the package"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pkg-tokens">Token Limit</Label>
                <Input
                  id="pkg-tokens"
                  type="number"
                  min="0"
                  value={packageForm.token_limit}
                  onChange={(e) =>
                    setPackageForm({ ...packageForm, token_limit: parseInt(e.target.value) || 0 })
                  }
                  placeholder="500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pkg-duration">Duration (days)</Label>
                <Input
                  id="pkg-duration"
                  type="number"
                  min="1"
                  value={packageForm.duration_days}
                  onChange={(e) =>
                    setPackageForm({ ...packageForm, duration_days: parseInt(e.target.value) || 30 })
                  }
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  placeholder="Add a feature"
                />
                <Button type="button" onClick={addFeature} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {packageForm.features?.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {feature}
                    <button onClick={() => removeFeature(index)} className="ml-1">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div>
                <Label htmlFor="pkg-active" className="text-base font-medium">
                  Active Status
                </Label>
                <p className="text-sm text-muted-foreground">
                  Make this package available to users
                </p>
              </div>
              <Switch
                id="pkg-active"
                checked={packageForm.is_active}
                onCheckedChange={(checked) =>
                  setPackageForm({ ...packageForm, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPackageDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSavePackage} className="gap-2" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
