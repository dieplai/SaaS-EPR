import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Building2,
  QrCode,
  ArrowLeft,
  ClipboardCopy,
  Check,
  Sparkles,
  Zap,
  Crown,
  Shield,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { adminApiClient } from "@/lib/admin-api-client";
import { formatPrice } from "@/lib/currency";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface PackageData {
  id: string;
  name: string;
  price: number;
  token_limit: number;
  features: string[];
  is_active: boolean;
}

const Payment = () => {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan");
  const period = searchParams.get("period") || "monthly";
  const { toast } = useToast();

  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load package from API
  useEffect(() => {
    const loadPackage = async () => {
      if (!planId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const pkg = await adminApiClient.packages.getById(planId);
        setPackageData(pkg);
      } catch (error) {
        console.error("Failed to load package:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin gói. Vui lòng thử lại.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPackage();
  }, [planId, toast]);

  const bankInfo = {
    bank: "Vietcombank",
    bankFull: "Ngân hàng TMCP Ngoại thương Việt Nam",
    accountNumber: "1234567890123",
    accountName: "CONG TY EPR ADVISOR",
    content: `EPR${Date.now().toString().slice(-8)}`,
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã sao chép", description: `${label} đã được sao chép.` });
  };

  // Get icon based on package name
  const getPackageIcon = () => {
    if (!packageData) return Zap;
    const name = packageData.name.toLowerCase();
    if (name.includes('starter') || name.includes('khởi')) return Sparkles;
    if (name.includes('enterprise') || name.includes('doanh')) return Crown;
    return Zap;
  };

  // Calculate price based on period
  const getDisplayPrice = () => {
    if (!packageData) return "0";
    return period === "yearly"
      ? formatPrice(packageData.price * 12 * 0.8, "vi") // 20% discount
      : formatPrice(packageData.price, "vi");
  };

  const PlanIcon = getPackageIcon();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-12 md:py-16 relative overflow-hidden">
          <div className="absolute inset-0 mesh-bg opacity-50" />
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="max-w-4xl mx-auto">
              {/* Back button */}
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại trang giá
              </Link>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !packageData ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground mb-4">
                    Không tìm thấy thông tin gói
                  </p>
                  <Link to="/pricing">
                    <Button>Quay lại trang giá</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Plan Summary */}
                  <div className="glass-card p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <PlanIcon className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">
                          Gói {packageData.name}
                        </h1>
                        <p className="text-muted-foreground">
                          {packageData.token_limit.toLocaleString()} tokens/tháng
                        </p>
                      </div>
                    </div>

                    <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-display font-bold text-foreground">
                          {getDisplayPrice()}
                        </span>
                        <span className="text-muted-foreground">
                          /{period === "yearly" ? "năm" : "tháng"}
                        </span>
                      </div>
                      {period === "yearly" && (
                        <p className="text-sm text-primary">
                          Tiết kiệm 20% so với thanh toán theo tháng
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3">
                      {packageData.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="w-4 h-4" />
                        <span>Bảo mật thanh toán 100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="glass-card p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-semibold text-foreground">
                          Thanh toán chuyển khoản
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Chuyển khoản ngân hàng nội địa
                        </p>
                      </div>
                    </div>

                    {/* Bank Info Card */}
                    <div className="p-5 rounded-xl bg-muted/50 border border-border space-y-4 mb-6">
                      <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{bankInfo.bank}</p>
                          <p className="text-sm text-muted-foreground">{bankInfo.bankFull}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Số tài khoản</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-foreground">
                              {bankInfo.accountNumber}
                            </span>
                            <button
                              onClick={() => copyToClipboard(bankInfo.accountNumber, "Số tài khoản")}
                              className="p-1.5 rounded-md hover:bg-muted transition-colors"
                            >
                              <ClipboardCopy className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Chủ tài khoản</span>
                          <span className="font-medium text-foreground">{bankInfo.accountName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Số tiền</span>
                          <span className="font-bold text-primary text-lg">
                            {getDisplayPrice()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Nội dung CK</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-foreground bg-primary/10 px-2 py-1 rounded">
                              {bankInfo.content}
                            </span>
                            <button
                              onClick={() => copyToClipboard(bankInfo.content, "Nội dung chuyển khoản")}
                              className="p-1.5 rounded-md hover:bg-muted transition-colors"
                            >
                              <ClipboardCopy className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center py-6 mb-6">
                      <div className="w-40 h-40 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center mb-3">
                        <QrCode className="w-16 h-16 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Quét mã QR để chuyển khoản nhanh
                      </p>
                    </div>

                    {/* Instructions */}
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        <strong>Lưu ý:</strong> Sau khi chuyển khoản, gói của bạn sẽ được kích hoạt
                        trong vòng 24 giờ. Nếu cần hỗ trợ, vui lòng liên hệ hotline:{" "}
                        <strong>1900-xxxx</strong>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Link to="/pricing" className="flex-1">
                        <Button variant="outline" className="w-full">
                          Hủy bỏ
                        </Button>
                      </Link>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          toast({
                            title: "Cảm ơn bạn!",
                            description: "Chúng tôi sẽ xác nhận thanh toán trong vòng 24 giờ.",
                          });
                        }}
                      >
                        Đã chuyển khoản
                      </Button>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Payment;
