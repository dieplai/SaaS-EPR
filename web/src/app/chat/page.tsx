"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  ArrowLeft,
  Sparkles,
  Plus,
  MessageSquare,
  Trash2,
  Edit3,
  Menu,
  X,
  User,
  Leaf,
  Zap,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { api, ChatMessage, Subscription } from "@/lib/api";
import Link from "next/link";
import { UsageModal } from "@/components/usage-modal";

// Thinking indicator component
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex gap-1">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            animation: 'thinking-bounce 1.2s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            animation: 'thinking-bounce 1.2s ease-in-out infinite',
            animationDelay: '0.15s'
          }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            animation: 'thinking-bounce 1.2s ease-in-out infinite',
            animationDelay: '0.3s'
          }}
        />
      </div>
      <span className="text-xs text-[#1A4D2E]/60" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Đang phân tích...
      </span>
    </div>
  );
}

// Sources component - Detailed like Streamlit
function SourcesSection({ documents, source }: { documents?: any[]; source?: string }) {
  if (!documents || documents.length === 0) return null;

  const [expanded, setExpanded] = useState(false);

  const getSourceLabel = (sourceType?: string) => {
    switch (sourceType) {
      case 'legal': return '📚 Tài Liệu Pháp Lý Tham Khảo';
      case 'faq': return '💡 Câu Hỏi Thường Gặp';
      case 'web_search': return '🌐 Kết Quả Tìm Kiếm Web';
      default: return '📖 Nguồn Tham Khảo';
    }
  };

  return (
    <div
      className="mt-3 pt-3 border-t"
      style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left transition-all duration-200 group"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#22C55E'
            }}
          >
            {getSourceLabel(source)}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22C55E'
            }}
          >
            {documents.length} {documents.length === 1 ? 'tài liệu' : 'tài liệu'}
          </span>
        </div>
        <ChevronRight
          className="h-4 w-4 transition-transform duration-200"
          style={{
            color: '#22C55E',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {documents.map((doc, idx) => {
            const metadata = doc.metadata || {};

            // Extract all metadata fields (handle both Vietnamese and English keys)
            const chuong = metadata.Chương || metadata.Chuong;
            const chuongName = metadata.Chương_Name || metadata.Chuong_Name;
            const muc = metadata.Mục || metadata.Muc;
            const mucName = metadata.Mục_Name || metadata.Muc_Name;
            const dieu = metadata.Điều || metadata.Dieu;
            const dieuName = metadata.Điều_Name || metadata.Dieu_Name;
            const content = doc.page_content || doc.content || '';

            // Build title parts array
            const titleParts = [];
            if (chuong) {
              titleParts.push({
                icon: '📘',
                label: 'Chương',
                number: chuong,
                name: chuongName
              });
            }
            if (muc) {
              titleParts.push({
                icon: '📑',
                label: 'Mục',
                number: muc,
                name: mucName
              });
            }
            if (dieu) {
              titleParts.push({
                icon: '📄',
                label: 'Điều',
                number: dieu,
                name: dieuName
              });
            }

            return (
              <div
                key={idx}
                className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.05) 100%)',
                  border: '1.5px solid rgba(34, 197, 94, 0.2)',
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(34, 197, 94, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.1)';
                }}
              >
                {/* Document Number Badge */}
                <div
                  className="inline-block px-2 py-0.5 rounded-md mb-3"
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: '#22C55E',
                    fontWeight: 600
                  }}
                >
                  Tài liệu #{idx + 1}
                </div>

                {/* Hierarchical Title Parts */}
                {titleParts.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {titleParts.map((part, partIdx) => (
                      <div key={partIdx} className="flex items-start gap-2">
                        <span style={{ fontSize: '14px' }}>{part.icon}</span>
                        <div className="flex-1">
                          <span
                            className="font-semibold"
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '13px',
                              color: '#22C55E'
                            }}
                          >
                            {part.label} {part.number}
                          </span>
                          {part.name && (
                            <span
                              className="ml-2"
                              style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '12px',
                                color: '#9CA3AF',
                                fontWeight: 500
                              }}
                            >
                              {part.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Content Preview */}
                <div
                  className="pt-2 border-t"
                  style={{ borderColor: 'rgba(34, 197, 94, 0.15)' }}
                >
                  <p
                    className="text-xs leading-relaxed"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#D1D5DB',
                      lineHeight: '1.6'
                    }}
                  >
                    {content.length > 300 ? `${content.substring(0, 300)}...` : content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Organic blob background decoration
function OrganicBlob({ delay = 0, left = 10, top = 20, size = 300, opacity = 0.15 }: { delay?: number; left?: number; top?: number; size?: number; opacity?: number }) {
  return (
    <div
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(26, 77, 46, 0.1) 50%, transparent 100%)',
        opacity: opacity,
        animation: `float ${20 + delay * 5}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock conversation history - in production, this would come from API
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: '1', title: 'Hướng dẫn quản lý EPR', timestamp: new Date() },
    { id: '2', title: 'Quy định tái chế 2024', timestamp: new Date(Date.now() - 86400000) },
    { id: '3', title: 'Báo cáo chất thải tháng 12', timestamp: new Date(Date.now() - 172800000) },
  ]);

  const [currentChat, setCurrentChat] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý AI chuyên về quản lý EPR và tuân thủ môi trường. Tôi có thể hỗ trợ bạn với các vấn đề về tái chế, báo cáo chất thải, và quy định pháp luật. Bạn cần tư vấn điều gì hôm nay?",
    },
  ]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (isAuthenticated) {
        const sub = await api.subscriptions.getCurrent();
        setSubscription(sub);
      }
    };

    fetchSubscription();
  }, [isAuthenticated]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChat, isTyping]);

  const handleSendMessage = async () => {
    if (!message.trim() || isTyping) return;

    // Check if user has subscription
    if (!subscription) {
      alert("Bạn chưa đăng ký gói dịch vụ nào.\nVui lòng đăng ký gói để sử dụng chatbot AI.");
      setUsageModalOpen(true);
      return;
    }

    // Check if user has minimum tokens (100 tokens for safety)
    if (subscription.remaining_tokens < 100) {
      alert(`Bạn đã hết tokens! Còn lại: ${subscription.remaining_tokens} tokens.\nVui lòng nâng cấp gói để tiếp tục sử dụng.`);
      setUsageModalOpen(true);
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: message.trim(),
    };

    setCurrentChat((prev) => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);

    const placeholderIndex = currentChat.length + 1;
    setCurrentChat((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
      },
    ]);

    try {
      let streamedContent = "";
      let actualTokensUsed = 0;

      await api.chatbot.sendMessageStreaming(
        {
          message: userMessage.content,
          chatHistory: currentChat,
        },
        // Chunk handler
        (chunk) => {
          streamedContent += chunk;
          setCurrentChat((prev) => {
            const newChat = [...prev];
            newChat[placeholderIndex] = {
              role: "assistant",
              content: streamedContent,
            };
            return newChat;
          });
        },
        // Token usage handler - backend already consumed tokens
        (tokensUsed) => {
          actualTokensUsed = tokensUsed;
          console.log(`[CHAT] 💰 Actual tokens used: ${tokensUsed}`);
        },
        // Complete handler - receive documents and source
        (documents, source) => {
          console.log(`[CHAT] 📚 Received ${documents.length} source documents from ${source}`);
          setCurrentChat((prev) => {
            const newChat = [...prev];
            newChat[placeholderIndex] = {
              role: "assistant",
              content: streamedContent,
              documents: documents,
              source: source,
            };
            return newChat;
          });
        }
      );

      // Refresh subscription to get updated token count
      // (Backend already consumed tokens, we just need to update UI)
      const updatedSub = await api.subscriptions.getCurrent();
      if (updatedSub) {
        setSubscription(updatedSub);

        // Log actual vs remaining
        console.log(`[CHAT] 📊 Tokens: ${actualTokensUsed} used, ${updatedSub.remaining_tokens} remaining`);

        // Warn user when tokens are running low
        if (updatedSub.remaining_tokens < 5000) {
          console.warn(`⚠️ Tokens running low: ${updatedSub.remaining_tokens} remaining`);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);

      setCurrentChat((prev) => {
        const newChat = [...prev];
        newChat[placeholderIndex] = {
          role: "assistant",
          content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
        };
        return newChat;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setCurrentChat([
      {
        role: "assistant",
        content: "Xin chào! Tôi là trợ lý AI chuyên về quản lý EPR. Bạn cần tôi hỗ trợ điều gì?",
      },
    ]);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="text-center">
          <div className="relative mb-8">
            <div
              className="absolute inset-0 blur-3xl rounded-full animate-pulse-soft"
              style={{ background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)' }}
            />
            <div
              className="relative h-20 w-20 rounded-2xl flex items-center justify-center mx-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(26, 77, 46, 0.1) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                boxShadow: '0 8px 32px rgba(34, 197, 94, 0.2)'
              }}
            >
              <Sparkles className="h-10 w-10 animate-pulse" style={{ color: '#22C55E' }} />
            </div>
          </div>
          <p
            className="text-lg"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#E5E5E5',
              fontWeight: 500
            }}
          >
            Đang tải cuộc trò chuyện...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes thinking-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
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

        @keyframes pulse-soft {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }

        .animate-pulse-soft {
          animation: pulse-soft 3s ease-in-out infinite;
        }

        /* Custom scrollbar - Dark theme */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #16A34A 0%, #15803D 100%);
        }

        /* Message animations */
        @keyframes message-appear {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .message-item {
          animation: message-appear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Gradient border animation */
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      <div
        className="flex h-screen overflow-hidden relative"
        style={{
          background: '#0A0A0A',
        }}
      >
        {/* Organic background blobs */}
        <OrganicBlob delay={0} left={5} top={10} size={500} opacity={0.08} />
        <OrganicBlob delay={3} left={75} top={60} size={400} opacity={0.06} />
        <OrganicBlob delay={6} left={40} top={80} size={350} opacity={0.05} />

        {/* Sidebar - Admin style (absolute positioned) */}
        <div
          className={`absolute left-0 top-0 bottom-0 z-50 transition-all duration-300 ease-out ${
            sidebarOpen ? "w-72" : "w-0"
          } flex flex-col overflow-hidden`}
          style={{
            background: 'linear-gradient(180deg, rgba(15, 15, 15, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(34, 197, 94, 0.15)',
            boxShadow: sidebarOpen ? '8px 0 32px rgba(0, 0, 0, 0.5)' : 'none',
          }}
        >
          {sidebarOpen && (
            <div className="flex flex-col h-full relative">
              {/* Sidebar Header */}
              <div className="p-5 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(26, 77, 46, 0.15) 100%)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    <Leaf className="h-5 w-5" style={{ color: '#22C55E' }} />
                  </div>
                  <div>
                    <h2
                      className="text-base font-bold"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        color: '#FFFFFF',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      EPR Assistant
                    </h2>
                    <p
                      className="text-xs"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        color: '#6B7280',
                        fontWeight: 400
                      }}
                    >
                      AI-Powered Platform
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleNewChat}
                  className="w-full h-10 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                    borderRadius: '10px',
                    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: 'white'
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)'
                    }}
                  />
                  <Plus className="h-4 w-4 mr-2 relative z-10" />
                  <span className="relative z-10">New Conversation</span>
                </Button>
              </div>

              {/* Conversation History */}
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-1">
                  <div
                    className="text-[10px] font-bold px-3 py-2 uppercase tracking-wider"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#6B7280',
                      letterSpacing: '0.08em'
                    }}
                  >
                    Recent Chats
                  </div>
                  {conversations.map((conv, idx) => (
                    <button
                      key={conv.id}
                      className="w-full group relative p-3 text-left transition-all duration-200"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#22C55E' }} />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate group-hover:text-[#22C55E] transition-colors"
                            style={{ color: '#E5E5E5' }}
                          >
                            {conv.title}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: '#6B7280' }}
                          >
                            {conv.timestamp.toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1">
                        <button
                          className="p-1.5 rounded-md transition-all duration-200 hover:scale-110"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <Edit3 className="h-3 w-3" style={{ color: '#9CA3AF' }} />
                        </button>
                        <button
                          className="p-1.5 rounded-md transition-all duration-200 hover:scale-110"
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                          }}
                        >
                          <Trash2 className="h-3 w-3" style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* User Info */}
              <div
                className="p-3 border-t"
                style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
              >
                <button
                  onClick={() => setUsageModalOpen(true)}
                  className="w-full flex items-center gap-3 p-2.5 mb-2 transition-all duration-200 cursor-pointer group rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(34, 197, 94, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
                    }}
                  >
                    <span
                      className="text-xs font-bold text-white"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {user?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        color: '#E5E5E5'
                      }}
                    >
                      {user?.full_name}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        color: '#6B7280'
                      }}
                    >
                      {subscription?.package_name || 'Free Plan'}
                    </p>
                  </div>
                </button>

                <div className="flex gap-2">
                  <Link href="/" className="flex-1">
                    <button
                      className="w-full h-9 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#9CA3AF'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#E5E5E5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#9CA3AF';
                      }}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="h-9 px-3 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                  >
                    <LogOut className="h-3.5 w-3.5" style={{ color: '#EF4444' }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Chat Area - Full width, content centered */}
        <div className="flex-1 flex flex-col relative">
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute left-6 top-6 z-30 h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{
              background: 'rgba(20, 20, 20, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(20, 20, 20, 0.8)';
              e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)';
            }}
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" style={{ color: '#22C55E' }} />
            ) : (
              <Menu className="h-4 w-4" style={{ color: '#22C55E' }} />
            )}
          </button>

          {/* Header - Full width */}
          <header
            className="relative px-8 py-5 border-b"
            style={{
              background: 'rgba(15, 15, 15, 0.8)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(26, 77, 46, 0.15) 100%)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)'
                  }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: '#22C55E' }} />
                </div>
                <div>
                  <h1
                    className="text-lg font-bold mb-0.5"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#FFFFFF',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    EPR AI Assistant
                  </h1>
                  <p
                    className="text-sm flex items-center gap-2"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#6B7280'
                    }}
                  >
                    {isTyping ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ background: '#22C55E' }}
                          />
                          <span
                            className="relative inline-flex rounded-full h-2 w-2"
                            style={{ background: '#22C55E' }}
                          />
                        </span>
                        Analyzing your question...
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5" style={{ color: '#22C55E' }} />
                        Ready to assist
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Token indicator */}
              {subscription && (
                <div
                  className="px-4 py-2 rounded-lg"
                  style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                  }}
                >
                  <p
                    className="text-xs"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      color: '#6B7280'
                    }}
                  >
                    Tokens: <span style={{ color: '#22C55E', fontWeight: 600 }}>
                      {subscription.remaining_tokens.toLocaleString()}
                    </span> / {subscription.total_tokens.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </header>

          {/* Chat Messages - Centered */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-8 py-8 pb-32"
          >
            <div className="max-w-4xl mx-auto space-y-6">
              {currentChat.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-4 message-item ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(26, 77, 46, 0.15) 100%)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                        }}
                      >
                        <Sparkles className="h-5 w-5" style={{ color: '#22C55E' }} />
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex-1 space-y-2 ${
                      msg.role === "user" ? "max-w-[75%]" : "max-w-[85%]"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div
                        className="text-xs font-semibold ml-1"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          color: '#22C55E',
                          letterSpacing: '0.03em'
                        }}
                      >
                        AI ASSISTANT
                      </div>
                    )}

                    <div
                      className={`px-5 py-3.5 transition-all duration-200 ${
                        msg.role === "user"
                          ? "ml-auto"
                          : ""
                      }`}
                      style={msg.role === "user" ? {
                        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                        borderRadius: '16px 16px 4px 16px',
                        boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                      } : {
                        background: 'rgba(20, 20, 20, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px 16px 16px 4px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      {msg.content ? (
                        <>
                          <p
                            className="text-[15px] leading-relaxed whitespace-pre-wrap"
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              color: msg.role === "user" ? 'white' : '#E5E5E5',
                              fontWeight: msg.role === "user" ? 500 : 400,
                            }}
                          >
                            {msg.content}
                          </p>
                          {/* Show sources only for assistant messages */}
                          {msg.role === "assistant" && (
                            <SourcesSection documents={msg.documents} source={msg.source} />
                          )}
                        </>
                      ) : (
                        <ThinkingIndicator />
                      )}
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="flex-shrink-0">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(26, 77, 46, 0.15) 100%)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                        }}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            color: '#22C55E'
                          }}
                        >
                          {user?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Input Area - Fixed at bottom, centered */}
          <div
            className="fixed bottom-0 left-0 right-0 px-8 py-6 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0.8) 50%, transparent 100%)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="max-w-4xl mx-auto pointer-events-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Ask about EPR regulations, waste management, compliance..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    disabled={isTyping}
                    className="h-14 pr-4 pl-5 transition-all duration-300"
                    style={{
                      background: 'rgba(20, 20, 20, 0.9)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      borderRadius: '14px',
                      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '15px',
                      color: '#E5E5E5',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)';
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
                    }}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isTyping}
                  className="h-14 w-14 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                    borderRadius: '14px',
                    boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    border: 'none',
                  }}
                >
                  {isTyping ? (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0s' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.15s' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </div>
                  ) : (
                    <Send className="h-5 w-5 text-white" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Modal */}
        <UsageModal
          open={usageModalOpen}
          onOpenChange={setUsageModalOpen}
          userName={user?.full_name || "User"}
          userEmail={user?.email || ""}
          planName={subscription?.package_name || "Free"}
          usageData={subscription ? {
            tokens: {
              used: subscription.total_tokens - subscription.remaining_tokens,
              total: subscription.total_tokens
            },
            nextTokenResetAt: subscription.next_token_reset_at
          } : undefined}
        />
      </div>
    </>
  );
}
