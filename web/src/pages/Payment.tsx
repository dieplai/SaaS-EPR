import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { adminApiClient } from "@/lib/admin-api-client";
import { apiClient } from "@/lib/api-client";
import { formatVND } from "@/lib/currency";
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
        const response = await apiClient.post<PaymentData>(
          "/api/v1/payments",
          {
            package_id: planId,
            period: period,
          },
          true // requiresAuth
        );
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
          `/api/v1/payments/${paymentData.payment_id}`,
          true // requiresAuth
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20">
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              {/* Back button */}
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
              >
                <span>←</span>
                <span>Quay lại</span>
              </Link>

              {isLoading || isCreatingPayment ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-gray-600">
                    {isCreatingPayment ? "Đang tạo đơn thanh toán..." : "Đang tải..."}
                  </p>
                </div>
              ) : !packageData || !paymentData ? (
                <div className="text-center py-20">
                  <p className="text-gray-600 mb-4">Không thể tạo đơn thanh toán</p>
                  <Link to="/pricing">
                    <Button>Quay lại trang giá</Button>
                  </Link>
                </div>
              ) : paymentCompleted ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-white">✓</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Thanh toán thành công
                  </h2>
                  <p className="text-gray-600">
                    Gói của bạn đã được kích hoạt. Đang chuyển hướng...
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-border">
                  {/* Header */}
                  <div className="text-center py-8 border-b border-border">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                      Thông Tin Thanh Toán
                    </h1>
                    <p className="text-primary text-sm md:text-base max-w-2xl mx-auto px-4">
                      Quét mã QR bên dưới để thực hiện chuyển khoản nhanh chóng và dễ dàng.
                      Bạn có thể tùy chọn ngân hàng đã liên kết.
                    </p>
                  </div>

                  {/* Main Content */}
                  <div className="grid md:grid-cols-2 gap-8 p-8">
                    {/* Left: QR Code */}
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative bg-background p-8">
                        {/* Corner brackets */}
                        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary" />
                        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-primary" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary" />
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary" />

                        {/* QR Code */}
                        <div className="w-64 h-64 bg-white flex items-center justify-center border border-gray-200">
                          <img
                            src={paymentData.qr_code_url}
                            alt="QR Code"
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      </div>

                      {/* Download Button */}
                      <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = paymentData.qr_code_url;
                          link.download = `QR-${paymentData.order_code}.png`;
                          link.click();
                        }}
                      >
                        ↓ Tải ảnh QR
                      </Button>
                    </div>

                    {/* Right: Payment Info */}
                    <div className="bg-muted/50 dark:bg-slate-800/50 rounded-lg p-6">
                      {/* Package Info */}
                      <div className="mb-6 pb-6 border-b border-border">
                        <div className="text-sm text-muted-foreground mb-1">Gói đã chọn</div>
                        <div className="font-bold text-xl text-foreground">{packageData.name}</div>
                      </div>

                      {/* Bank Info */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-sm text-muted-foreground">Ngân hàng</div>
                          <div className="font-semibold text-foreground text-right">
                            {paymentData.bank_info.bank_name}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-sm text-muted-foreground">Thư hưởng</div>
                          <div className="font-semibold text-foreground text-right uppercase">
                            {paymentData.bank_info.account_holder}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-sm text-muted-foreground">Số tài khoản</div>
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono font-semibold text-foreground">
                              {paymentData.bank_info.account_number}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  paymentData.bank_info.account_number,
                                  "Số tài khoản"
                                )
                              }
                              className="text-xs text-primary hover:text-primary/80 font-medium"
                            >
                              Sao chép
                            </button>
                          </div>
                        </div>

                        <div className="h-px bg-border my-4" />

                        {/* Transfer Content */}
                        <div className="flex items-center justify-between py-3 border-b border-border">
                          <div className="text-sm text-muted-foreground">Nội dung CK</div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-foreground">
                              {paymentData.order_code}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(paymentData.order_code, "Nội dung chuyển khoản")
                              }
                              className="text-xs text-primary hover:text-primary/80 font-medium"
                            >
                              Sao chép
                            </button>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="py-3">
                          <div className="flex items-baseline justify-between mb-1">
                            <div className="text-sm text-muted-foreground">Số tiền</div>
                            <div className="font-bold text-2xl text-foreground">
                              {formatVND(parseFloat(paymentData.amount))}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            Gói {packageData.name} /{" "}
                            {paymentData.period === "yearly" ? "Năm" : "Tháng"}
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          <span className="text-muted-foreground">Đang chờ thanh toán...</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Notice */}
                  <div className="bg-amber-50 dark:bg-amber-950/30 border-t-2 border-amber-400 dark:border-amber-600 p-4 rounded-b-lg">
                    <div className="flex gap-3 max-w-3xl mx-auto">
                      <div className="shrink-0 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        !
                      </div>
                      <div className="text-sm text-amber-900 dark:text-amber-300">
                        <strong>Lưu ý:</strong> Thanh toán sẽ được xác nhận tự động ngay sau khi
                        bạn chuyển khoản. Vui lòng nhập đúng{" "}
                        <strong>nội dung chuyển khoản</strong> để hệ thống có thể xác thực.
                      </div>
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
