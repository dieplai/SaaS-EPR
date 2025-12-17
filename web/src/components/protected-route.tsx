"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "user";
}

export function ProtectedRoute({ children, requiredRole = "user" }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-muted-foreground font-refined">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-secondary/20">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>

            <div>
              <h1 className="text-2xl font-display font-bold mb-2 text-foreground">
                Vui lòng đăng nhập
              </h1>
              <p className="text-muted-foreground">
                Bạn cần đăng nhập để truy cập trang này
              </p>
            </div>

            <Button
              onClick={() => router.push("/login")}
              className="w-full gradient-eco text-white"
            >
              Đăng nhập ngay
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role if required
  if (requiredRole === "admin" && user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-secondary/20">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>

            <div>
              <h1 className="text-2xl font-display font-bold mb-2 text-foreground">
                Truy cập bị từ chối
              </h1>
              <p className="text-muted-foreground">
                Bạn không có quyền truy cập trang quản trị. Liên hệ quản trị viên để được cấp quyền.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1"
              >
                Quay lại trang chủ
              </Button>
              <Button
                onClick={() => router.push("/account")}
                className="flex-1 gradient-eco text-white"
              >
                Tài khoản của tôi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
