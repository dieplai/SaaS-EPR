"use client";

import { useState, useEffect } from "react";
import { X, Zap, TrendingUp, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UsageData {
  tokens: { used: number; total: number };
  nextTokenResetAt?: string;
}

interface UsageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  planName?: string;
  usageData?: UsageData;
}

// Helper function to format large numbers
function formatNumber(num: number | undefined | null, label: string): string {
  const safeNum = num ?? 0;

  // For tokens, use K, M notation
  if (label.includes('Token')) {
    if (safeNum >= 1000000) {
      return `${(safeNum / 1000000).toFixed(1)}M`;
    }
    if (safeNum >= 1000) {
      return `${(safeNum / 1000).toFixed(0)}K`;
    }
    return safeNum.toLocaleString();
  }

  // For storage (GB)
  if (label.includes('Lưu trữ')) {
    return safeNum.toLocaleString();
  }

  // For messages, use regular locale string
  return safeNum.toLocaleString();
}

// Helper function to calculate time until token reset
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

function ProgressBar({
  label,
  used,
  total,
  icon: Icon,
  color = "primary"
}: {
  label: string;
  used: number | undefined | null;
  total: number | undefined | null;
  icon: React.ElementType;
  color?: string;
}) {
  // Safe guards
  const safeUsed = used ?? 0;
  const safeTotal = total ?? 1;
  const percentage = Math.min((safeUsed / safeTotal) * 100, 100);
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  const getGradient = () => {
    if (isCritical) return 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%)';
    if (isWarning) return 'linear-gradient(135deg, rgb(251, 191, 36) 0%, rgb(245, 158, 11) 100%)';
    return 'linear-gradient(135deg, rgb(82, 195, 108) 0%, rgb(70, 180, 95) 100%)';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, rgba(82, 195, 108, 0.15) 0%, rgba(82, 195, 108, 0.05) 100%)',
              backdropFilter: 'blur(5px)',
              boxShadow: '0 2px 8px rgba(82, 195, 108, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(82, 195, 108, 0.2)',
            }}
          >
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-refined font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground font-refined mt-0.5">
              {formatNumber(used, label)} / {formatNumber(total, label)} {label.includes('Lưu trữ') ? 'GB' : label.includes('Token') ? 'tokens' : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-display font-bold ${
            isCritical ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-primary'
          }`}>
            {percentage.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 rounded-full overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        }}
      >
        <div
          className="h-full transition-all duration-700 ease-out relative overflow-hidden"
          style={{
            width: `${percentage}%`,
            background: getGradient(),
            boxShadow: `0 0 20px ${isCritical ? 'rgba(239, 68, 68, 0.4)' : isWarning ? 'rgba(251, 191, 36, 0.4)' : 'rgba(82, 195, 108, 0.4)'}`,
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
            style={{
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function UsageModal({
  open,
  onOpenChange,
  userName,
  userEmail,
  planName = "Free",
  usageData
}: UsageModalProps) {
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset(usageData?.nextTokenResetAt));

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset(usageData?.nextTokenResetAt));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [usageData?.nextTokenResetAt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] p-0 overflow-hidden border-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
        showCloseButton={false}
      >
        {/* Custom Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-5 right-5 z-10 h-9 w-9 rounded-xl transition-all duration-200 hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <X className="h-4 w-4 text-muted-foreground mx-auto" />
        </button>

        {/* Header Section */}
        <div
          className="relative px-8 pt-8 pb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(82, 195, 108, 0.1) 0%, rgba(82, 195, 108, 0.05) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Decorative blur orb */}
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(82, 195, 108, 0.4) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 flex items-start gap-5">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgb(82, 195, 108) 0%, rgb(70, 180, 95) 100%)',
                boxShadow: '0 8px 24px rgba(82, 195, 108, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              }}
            >
              <span className="text-2xl font-bold text-white">
                {userName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                {userName}
              </h2>
              <p className="text-sm text-muted-foreground font-refined mb-3">
                {userEmail}
              </p>
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-refined font-semibold text-foreground">
                  {planName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Stats Section */}
        <div className="px-8 py-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-refined font-bold text-foreground uppercase tracking-wider">
                Sử dụng gói dịch vụ
              </h3>
            </div>

            <div className="space-y-6">
              {usageData ? (
                <ProgressBar
                  label="Tokens AI"
                  used={usageData.tokens.used}
                  total={usageData.tokens.total}
                  icon={Zap}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground font-refined">
                    Đang tải thông tin sử dụng...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Token Reset Countdown */}
          {timeUntilReset && (
            <div
              className="p-5 rounded-2xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-refined font-semibold text-foreground">
                  Token sẽ được làm mới trong
                </p>
              </div>
              <div className="flex items-center gap-3">
                {timeUntilReset.days > 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-display font-bold text-blue-600">
                      {timeUntilReset.days}
                    </span>
                    <span className="text-xs text-muted-foreground font-refined">
                      ngày
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-display font-bold text-blue-600">
                    {timeUntilReset.hours}
                  </span>
                  <span className="text-xs text-muted-foreground font-refined">
                    giờ
                  </span>
                </div>
                <span className="text-2xl font-bold text-muted-foreground">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-display font-bold text-blue-600">
                    {timeUntilReset.minutes}
                  </span>
                  <span className="text-xs text-muted-foreground font-refined">
                    phút
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade CTA */}
          <div
            className="p-5 rounded-2xl relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(82, 195, 108, 0.15) 0%, rgba(82, 195, 108, 0.05) 100%)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(82, 195, 108, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              border: '1px solid rgba(82, 195, 108, 0.2)',
            }}
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-refined font-bold text-foreground mb-1">
                  Cần thêm dung lượng?
                </p>
                <p className="text-xs text-muted-foreground font-refined">
                  Nâng cấp gói để nhận thêm quota
                </p>
              </div>
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, rgb(82, 195, 108) 0%, rgb(70, 180, 95) 100%)',
                  boxShadow: '0 4px 12px rgba(82, 195, 108, 0.4)',
                }}
              >
                <Zap className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-8 py-5 text-center border-t"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <p className="text-xs text-muted-foreground font-refined">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')} •
            <span className="text-primary font-semibold ml-1">EPR SaaS Platform</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
