import { useSearchParams, Link, useNavigate } from "react-router-dom";
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
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { adminApiClient } from "@/lib/admin-api-client";
import { apiClient } from "@/lib/api-client";
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

interface PaymentData {
  payment_id: string;
  order_code: string;
  amount: string;
  currency: string;
  period: string;
  qr_code_url: string;
  bank_info: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
  expires_at: string;
  status: string;
}

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get("plan");
  const period = searchParams.get("period") || "monthly";
  const { toast } = useToast();

  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Load package and create payment
  useEffect(() => {
    const initializePayment = async () => {
      if (!planId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load package details
        const pkg = await adminApiClient.packages.getById(planId);
        setPackageData(pkg);

        // Create payment order
        setIsCreatingPayment(true);
        const response = await apiClient.post<PaymentData>("/payments", {
          package_id: planId,
          period: period,
        });
        setPaymentData(response);
        setIsCreatingPayment(false);
      } catch (error) {
        console.error("Failed to initialize payment:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tạo đơn thanh toán. Vui lòng thử lại.",
          variant: "destructive",
        });
        setIsCreatingPayment(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [planId, period, toast]);

  // Poll payment status
  useEffect(() => {
    if (!paymentData || paymentCompleted) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await apiClient.get<{ data: PaymentData }>(
          `/payments/${paymentData.payment_id}`
        );

        if (response.data.status === "completed") {
          setPaymentCompleted(true);
          clearInterval(pollInterval);
          toast({
            title: "Thanh toán thành công!",
            description: "Gói của bạn đã được kích hoạt.",
          });

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      } catch (error) {
        console.error("Failed to poll payment status:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [paymentData, paymentCompleted, toast, navigate]);

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

              {isLoading || isCreatingPayment ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">
                    {isCreatingPayment ? "Đang tạo đơn thanh toán..." : "Đang tải..."}
                  </p>
                </div>
              ) : !packageData || !paymentData ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground mb-4">
                    Không thể tạo đơn thanh toán
                  </p>
                  <Link to="/pricing">
                    <Button>Quay lại trang giá</Button>
                  </Link>
                </div>
              ) : paymentCompleted ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                    Thanh toán thành công!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Gói của bạn đã được kích hoạt. Đang chuyển hướng...
                  </p>
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
                          {formatPrice(parseFloat(paymentData.amount), "vi")}
                        </span>
                        <span className="text-muted-foreground">
                          /{paymentData.period === "yearly" ? "năm" : "tháng"}
                        </span>
                      </div>
                      {paymentData.period === "yearly" && (
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
                          <p className="font-semibold text-foreground">
                            {paymentData.bank_info.bank_name}
                          </p>
                          <p className="text-sm text-muted-foreground">Ngân hàng nội địa</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Số tài khoản</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-foreground">
                              {paymentData.bank_info.account_number}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  paymentData.bank_info.account_number,
                                  "Số tài khoản"
                                )
                              }
                              className="p-1.5 rounded-md hover:bg-muted transition-colors"
                            >
                              <ClipboardCopy className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Chủ tài khoản</span>
                          <span className="font-medium text-foreground">
                            {paymentData.bank_info.account_holder}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Số tiền</span>
                          <span className="font-bold text-primary text-lg">
                            {formatPrice(parseFloat(paymentData.amount), "vi")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Nội dung CK</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-foreground bg-primary/10 px-2 py-1 rounded">
                              {paymentData.order_code}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(paymentData.order_code, "Nội dung chuyển khoản")
                              }
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
                      <div className="w-56 h-56 rounded-xl bg-white border border-border flex items-center justify-center mb-3 overflow-hidden">
                        <img
                          src={paymentData.qr_code_url}
                          alt="QR Code thanh toán"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Quét mã QR để chuyển khoản nhanh
                      </p>
                    </div>

                    {/* Instructions */}
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        <strong>Lưu ý:</strong> Thanh toán sẽ được xác nhận tự động ngay sau khi
                        bạn chuyển khoản. Vui lòng nhập đúng{" "}
                        <strong>nội dung chuyển khoản</strong> để hệ thống có thể xác thực.
                      </p>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-muted/50 border border-border">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Đang chờ thanh toán...
                      </span>
                    </div>
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
