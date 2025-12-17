"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
        console.log("[LOGOUT] User logged out successfully");
      } catch (error) {
        console.error("[LOGOUT] Error during logout:", error);
      }
    };

    handleLogout();
  }, [logout]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-secondary/20">
      <Card className="w-full max-w-md animate-slide-up">
        <CardContent className="p-12 text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <LogOut className="h-8 w-8 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-display font-bold mb-2">
              Đã đăng xuất
            </h1>
            <p className="text-muted-foreground">
              Bạn đã đăng xuất khỏi tài khoản EPR SaaS thành công
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Link href="/login">
              <Button className="w-full gradient-eco text-white hover:opacity-90">
                Đăng nhập lại
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Về trang chủ
              </Button>
            </Link>
          </div>

          <Link href="/" className="flex items-center gap-2 justify-center group mt-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all" />
              <div className="relative bg-gradient-eco p-2 rounded-xl">
                <Leaf className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-lg font-display font-bold text-gradient-eco">
              EPR SaaS
            </span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
