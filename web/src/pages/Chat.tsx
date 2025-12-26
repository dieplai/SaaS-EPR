import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Bot,
  User,
  Recycle,
  Coins,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
  Pencil,
  Settings,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  ChevronUp,
  X,
  CreditCard,
  Bell,
  Shield,
  Palette,
  Check,
  Zap,
  Crown,
  ExternalLink,
  Building2,
  QrCode,
  ArrowLeft,
  ClipboardCopy,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { chatbotClient } from "@/lib/api-client";
import { adminApiClient } from "@/lib/admin-api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const suggestedQuestions = [
  "EPR là gì và tại sao doanh nghiệp cần tuân thủ?",
  "Quy định về bao bì nhựa tại Việt Nam như thế nào?",
  "Làm sao để đăng ký EPR cho sản phẩm của tôi?",
  "Mức phí EPR cho bao bì nhựa được tính như thế nào?",
];

interface PlanPackage {
  id: string;
  name: string;
  price: number;
  token_limit: number;
  features: string[];
}

const Chat = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "personalization" | "data">("general");
  const [planOpen, setPlanOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanPackage | null>(null);
  const [plans, setPlans] = useState<PlanPackage[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return false; // Default to light mode
  });
  const [notifications, setNotifications] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Real hooks
  const { user: authUser, logout } = useAuth();
  const { subscription } = useSubscription();

  // Toggle dark/light mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load conversations from backend
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await chatbotClient.getConversations();

        // Ensure data is an array
        if (Array.isArray(data)) {
          const mappedConversations = data.map((conv: any) => ({
            id: conv.id || conv.session_id,
            title: conv.title || "New chat",
            messages: [], // Messages will be loaded separately when needed
            createdAt: new Date(conv.created_at),
            updatedAt: new Date(conv.last_message_at || conv.created_at),
          }));

          setConversations(mappedConversations);

          // Don't auto-select - always start with new chat
        } else {
          console.warn("getConversations returned non-array:", data);
          setConversations([]);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
        setConversations([]);
      }
    };
    loadConversations();
  }, []);

  // User data from auth + subscription
  const user = {
    name: authUser?.full_name || authUser?.email || "User",
    email: authUser?.email || "",
    avatar: null,
    plan: subscription?.package_name || "Free",
    tokens: subscription?.remaining_tokens || 0,
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Load messages when active conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversationId) return;

      // Check if messages are already loaded
      const conv = conversations.find(c => c.id === activeConversationId);
      if (conv && conv.messages.length > 0) return;

      // Skip loading for local conversations (not saved to backend yet)
      // Local conversations have timestamp IDs or start with "session_"
      const isLocalConversation = /^\d+$/.test(activeConversationId) || activeConversationId.startsWith("session_");
      if (isLocalConversation) {
        console.log("Skipping message load for local conversation:", activeConversationId);
        return;
      }

      try {
        const data = await chatbotClient.getConversation(activeConversationId);
        if (data && data.messages) {
          // Update the conversation with loaded messages
          setConversations(prev =>
            prev.map(c =>
              c.id === activeConversationId
                ? {
                    ...c,
                    messages: data.messages.map((msg: any) => ({
                      id: msg.id || Date.now().toString(),
                      role: msg.role,
                      content: msg.content,
                      timestamp: new Date(msg.created_at || Date.now()),
                    })),
                    title: data.title || c.title,
                  }
                : c
            )
          );
        }
      } catch (error) {
        console.error("Failed to load conversation messages:", error);
      }
    };

    loadMessages();
  }, [activeConversationId, conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input on mount (for better UX)
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Load pricing packages from DB
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const packages = await adminApiClient.packages.list();
        const activePlans = packages
          .filter(pkg => pkg.is_active)
          .sort((a, b) => a.price - b.price); // Sort by price ascending
        setPlans(activePlans);
      } catch (error) {
        console.error("Failed to load packages:", error);
      }
    };
    loadPackages();
  }, []);

  const createNewConversation = () => {
    // Simply reset active conversation ID
    // Actual conversation will be created in backend when user sends first message
    setActiveConversationId(null);
    // Auto-focus to input for immediate typing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const deleteConversation = async (id: string) => {
    try {
      await chatbotClient.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(conversations.length > 1 ? conversations.find(c => c.id !== id)?.id || null : null);
      }
      toast({
        title: "Deleted",
        description: "Conversation has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageContent = input.trim();
    setInput("");
    setIsLoading(true);
    setThinkingStatus(""); // Reset thinking status for new message

    try {
      let sessionId = activeConversationId;

      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userMessageContent,
        timestamp: new Date(),
      };

      // If no active conversation, create one in backend
      if (!sessionId) {
        try {
          // Call backend API to create conversation in database
          const createdConversation = await chatbotClient.createConversation();
          sessionId = createdConversation?.session_id;

          if (!sessionId) {
            throw new Error("Failed to create conversation");
          }

          // Create conversation in local state
          const newConversation: Conversation = {
            id: sessionId,
            title: userMessageContent.slice(0, 30) + (userMessageContent.length > 30 ? "..." : ""),
            messages: [userMessage],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setConversations(prev => [newConversation, ...prev]);
          setActiveConversationId(sessionId);
        } catch (error) {
          console.error("Failed to create conversation:", error);
          toast({
            title: "Error",
            description: "Failed to create conversation. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          setThinkingStatus("");
          return;
        }
      } else {
        // Add to existing conversation
        setConversations(prev =>
          prev.map(c =>
            c.id === sessionId
              ? {
                  ...c,
                  messages: [...c.messages, userMessage],
                  updatedAt: new Date(),
                }
              : c
          )
        );
      }

      // Create placeholder AI message for streaming
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      // Add placeholder AI message to UI
      setConversations(prev =>
        prev.map(c =>
          c.id === sessionId
            ? {
                ...c,
                messages: [...c.messages, aiMessage],
                updatedAt: new Date(),
              }
            : c
        )
      );

      // Send to chatbot API with streaming callbacks
      await chatbotClient.sendMessage(
        userMessageContent,
        sessionId,
        // onChunk callback - update message content as chunks arrive
        (chunk: string) => {
          // Clear thinking status when first chunk arrives
          setThinkingStatus("");
          setConversations(prev =>
            prev.map(c =>
              c.id === sessionId
                ? {
                    ...c,
                    messages: c.messages.map(m =>
                      m.id === aiMessageId
                        ? { ...m, content: m.content + chunk }
                        : m
                    ),
                  }
                : c
            )
          );
        },
        // onComplete callback - update title if first message
        (completeResponse: string, sources: any[]) => {
          setThinkingStatus("");
          setConversations(prev =>
            prev.map(c =>
              c.id === sessionId
                ? {
                    ...c,
                    title: c.messages.length === 2 ? userMessageContent.slice(0, 30) + (userMessageContent.length > 30 ? "..." : "") : c.title,
                    updatedAt: new Date(),
                  }
                : c
            )
          );
        },
        // onStatus callback - update thinking status
        (status: string, stage: string) => {
          setThinkingStatus(status);
        },
        // onTokenUsage callback - refresh subscription when tokens consumed
        (tokensUsed: number, consumed: boolean) => {
          if (consumed && tokensUsed > 0) {
            // Invalidate subscription query to refetch updated token count
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
          }
        }
      );

    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setThinkingStatus(""); // Clear thinking status on completion
      // Auto-focus back to input for seamless typing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    // Auto-focus to input after setting suggested question
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The response has been copied.",
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((acc, conv) => {
    const dateLabel = formatDate(conv.updatedAt);
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar - Fixed */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } h-screen bg-muted/30 border-r border-border flex flex-col transition-all duration-300 overflow-hidden shrink-0 fixed left-0 top-0 z-30`}
      >
        <div className="p-3 border-b border-border">
          <Button
            onClick={createNewConversation}
            variant="outline"
            className="w-full justify-start gap-2 bg-background hover:bg-muted"
          >
            <Plus className="w-4 h-4" />
            New chat
          </Button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {Object.entries(groupedConversations).map(([dateLabel, convs]) => (
            <div key={dateLabel}>
              <p className="text-xs text-muted-foreground px-2 mb-2 font-medium">
                {dateLabel}
              </p>
              <div className="space-y-1">
                {convs.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      activeConversationId === conv.id
                        ? "bg-muted"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setActiveConversationId(conv.id)}
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm truncate text-foreground">
                      {conv.title}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="gap-2">
                          <Pencil className="w-4 h-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => deleteConversation(conv.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {conversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No conversations yet
            </div>
          )}
        </div>

        {/* Sidebar Footer - User Profile */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56 bg-popover border border-border shadow-xl">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="py-1">
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="w-4 h-4" />
                  Cài đặt
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer"
                  onClick={() => setPlanOpen(true)}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="flex-1">Gói của tôi</span>
                  <span className="text-xs text-primary font-medium">{user.plan}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <HelpCircle className="w-4 h-4" />
                  Trợ giúp & FAQ
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive cursor-pointer" onClick={() => logout()}>
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 bg-background border border-border">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="text-lg font-display font-semibold">Cài đặt</DialogTitle>
          </DialogHeader>
          
          <div className="flex min-h-[400px]">
            {/* Settings Sidebar */}
            <div className="w-48 border-r border-border p-2 space-y-1">
              <button
                onClick={() => setSettingsTab("general")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  settingsTab === "general" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Settings className="w-4 h-4" />
                Chung
              </button>
              <button
                onClick={() => setSettingsTab("personalization")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  settingsTab === "personalization" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Palette className="w-4 h-4" />
                Cá nhân hóa
              </button>
              <button
                onClick={() => setSettingsTab("data")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  settingsTab === "data" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Shield className="w-4 h-4" />
                Dữ liệu & Bảo mật
              </button>
            </div>

            {/* Settings Content */}
            <div className="flex-1 p-6">
              {settingsTab === "general" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-4">Thông tin tài khoản</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-xl font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-3 border-t border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">Gói đăng ký</p>
                          <p className="text-xs text-muted-foreground">Gói hiện tại của bạn</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {user.plan}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSettingsOpen(false);
                              setPlanOpen(true);
                            }}
                          >
                            Nâng cấp
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-3 border-t border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">Token còn lại</p>
                          <p className="text-xs text-muted-foreground">Số lượt hỏi còn lại trong tháng</p>
                        </div>
                        <div className="flex items-center gap-2 text-primary">
                          <Coins className="w-4 h-4" />
                          <span className="font-medium">{user.tokens}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "personalization" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-4">Giao diện</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          {darkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
                          <div>
                            <p className="text-sm font-medium text-foreground">Chế độ tối</p>
                            <p className="text-xs text-muted-foreground">Sử dụng giao diện tối</p>
                          </div>
                        </div>
                        <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                      </div>
                      <div className="flex items-center justify-between py-3 border-t border-border">
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Thông báo</p>
                            <p className="text-xs text-muted-foreground">Nhận thông báo về cập nhật</p>
                          </div>
                        </div>
                        <Switch checked={notifications} onCheckedChange={setNotifications} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "data" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-4">Quản lý dữ liệu</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Xóa tất cả cuộc hội thoại</p>
                          <p className="text-xs text-muted-foreground">Xóa vĩnh viễn lịch sử chat của bạn</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={async () => {
                            try {
                              // Delete all conversations using the new API
                              const result = await chatbotClient.deleteAllConversations();
                              setConversations([]);
                              setActiveConversationId(null);
                              toast({
                                title: "Đã xóa",
                                description: `${result?.deleted_count || 0} cuộc hội thoại đã được xóa.`
                              });
                            } catch (error) {
                              toast({ title: "Lỗi", description: "Không thể xóa tất cả cuộc hội thoại.", variant: "destructive" });
                            }
                          }}
                        >
                          Xóa tất cả
                        </Button>
                      </div>
                      <div className="flex items-center justify-between py-3 border-t border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">Xuất dữ liệu</p>
                          <p className="text-xs text-muted-foreground">Tải xuống dữ liệu của bạn</p>
                        </div>
                        <Button variant="outline" size="sm">Xuất</Button>
                      </div>
                      <div className="flex items-center justify-between py-3 border-t border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground text-destructive">Xóa tài khoản</p>
                          <p className="text-xs text-muted-foreground">Xóa vĩnh viễn tài khoản và dữ liệu</p>
                        </div>
                        <Button variant="destructive" size="sm">Xóa tài khoản</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Modal - ChatGPT Style */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-w-3xl p-0 gap-0 bg-background border border-border overflow-hidden">
          {/* Header with gradient */}
          <div className="relative px-6 py-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-display font-semibold">Gói của bạn</DialogTitle>
                  <p className="text-sm text-muted-foreground">Quản lý gói đăng ký và thanh toán</p>
                </div>
              </div>
            </DialogHeader>
            
            {/* Current plan status bar */}
            <div className="mt-4 flex items-center gap-4 p-4 rounded-xl bg-background/80 backdrop-blur border border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Gói {user.plan}</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">Đang hoạt động</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gia hạn: {subscription?.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-lg font-bold text-foreground">{user.tokens}</span>
                  <span className="text-sm text-muted-foreground">/ {subscription?.total_tokens || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">tokens còn lại</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Plans Grid - Dynamic from DB */}
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan, index) => {
                const isCurrentPlan = user.plan === plan.name;
                const isPro = index === 1; // Middle plan (Pro)
                const isEnterprise = plan.name.toLowerCase().includes('enterprise') || plan.name.toLowerCase().includes('doanh');

                return (
                  <div
                    key={plan.id}
                    className={`relative p-5 rounded-2xl ${
                      isPro
                        ? 'border-2 border-primary bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border border-border bg-card hover:border-muted-foreground/30'
                    } transition-all group`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                          Gói hiện tại
                        </span>
                      </div>
                    )}

                    <div className={`mb-4 ${isCurrentPlan ? 'pt-2' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        isPro ? 'bg-primary/20' :
                        isEnterprise ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' :
                        'bg-muted'
                      }`}>
                        {isPro ? <Sparkles className="w-5 h-5 text-primary" /> :
                         isEnterprise ? <Crown className="w-5 h-5 text-amber-500" /> :
                         <Bot className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <h3 className="font-semibold text-foreground">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        {plan.price === 0 ? (
                          <span className="text-2xl font-bold text-foreground">Miễn phí</span>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-foreground">${plan.price}</span>
                            <span className="text-sm text-muted-foreground">/tháng</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-2.5 mb-5">
                      <li className={`flex items-center gap-2 text-sm ${isPro ? 'text-foreground' : 'text-muted-foreground'}`}>
                        <Check className={`w-4 h-4 ${
                          isPro ? 'text-primary' :
                          isEnterprise ? 'text-amber-500/60' :
                          'text-muted-foreground/60'
                        }`} />
                        {plan.token_limit.toLocaleString()} tokens/tháng
                      </li>
                      {plan.features.map((feature, i) => (
                        <li key={i} className={`flex items-center gap-2 text-sm ${isPro ? 'text-foreground' : 'text-muted-foreground'}`}>
                          <Check className={`w-4 h-4 ${
                            isPro ? 'text-primary' :
                            isEnterprise ? 'text-amber-500/60' :
                            'text-muted-foreground/60'
                          }`} />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant="outline"
                      className={`w-full ${
                        isEnterprise ? 'group-hover:border-amber-500/50 group-hover:text-amber-500' : ''
                      } transition-colors`}
                      onClick={() => {
                        navigate(`/payment?plan=${plan.id}&period=monthly`);
                      }}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? 'Gói hiện tại' : 'Chọn gói này'}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Billing Section */}
            <div className="pt-5 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Visa •••• 4242</p>
                    <p className="text-xs text-muted-foreground">Hết hạn 12/2025 • Thanh toán tiếp theo: $19 vào 01/02</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Lịch sử
                  </Button>
                  <Button variant="outline" size="sm">
                    Thay đổi
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 bg-background border border-border overflow-hidden">
          {/* Header */}
          <div className="relative px-6 py-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border">
            <button 
              onClick={() => setPaymentOpen(false)}
              className="absolute left-4 top-4 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <DialogHeader className="pl-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-display font-semibold">Thanh toán chuyển khoản</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan
                      ? `Gói ${selectedPlan.name} - ${selectedPlan.price === 0 ? 'Miễn phí' : `$${selectedPlan.price}/tháng`}`
                      : 'Chọn gói'}
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* Bank Info */}
            <div className="p-5 rounded-xl bg-muted/50 border border-border space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Vietcombank</p>
                  <p className="text-sm text-muted-foreground">Ngân hàng TMCP Ngoại thương Việt Nam</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Số tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-foreground">1234567890123</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText("1234567890123");
                        toast({ title: "Đã sao chép", description: "Số tài khoản đã được sao chép." });
                      }}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <ClipboardCopy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chủ tài khoản</span>
                  <span className="font-medium text-foreground">CONG TY ABC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Số tiền</span>
                  <span className="font-bold text-primary text-lg">
                    {selectedPlan === "pro" ? "450,000 VNĐ" : 
                     selectedPlan === "enterprise" ? "Liên hệ báo giá" : "Miễn phí"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Nội dung CK</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground bg-primary/10 px-2 py-1 rounded">
                      EPR{user.email.split("@")[0].toUpperCase().slice(0, 8)}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`EPR${user.email.split("@")[0].toUpperCase().slice(0, 8)}`);
                        toast({ title: "Đã sao chép", description: "Nội dung chuyển khoản đã được sao chép." });
                      }}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <ClipboardCopy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="flex flex-col items-center py-6">
              <div className="w-40 h-40 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center mb-3">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Quét mã QR để chuyển khoản nhanh
              </p>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Lưu ý:</strong> Sau khi chuyển khoản, gói của bạn sẽ được kích hoạt trong vòng 24 giờ. Nếu cần hỗ trợ, vui lòng liên hệ hotline: <strong>1900-xxxx</strong>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setPaymentOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button 
                className="flex-1"
                onClick={() => {
                  toast({ 
                    title: "Cảm ơn bạn!", 
                    description: "Chúng tôi sẽ xác nhận thanh toán trong vòng 24 giờ." 
                  });
                  setPaymentOpen(false);
                }}
              >
                Đã chuyển khoản
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div 
        className={`flex-1 flex flex-col h-screen transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Header - Fixed */}
        <header className="h-14 bg-background/80 backdrop-blur-xl border-b border-border shrink-0">
          <div className="px-4 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  title="Quay về trang chủ"
                >
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-muted-foreground hover:text-foreground"
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="w-5 h-5" />
                ) : (
                  <PanelLeft className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={createNewConversation}
                className="text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {activeConversation?.title || "New chat"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                <Coins className="w-4 h-4" />
                <span className="font-medium">{user.tokens} tokens</span>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area - Scrollable */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <div className="max-w-4xl mx-auto px-4 py-6 pb-4">
              {messages.length === 0 ? (
                /* Empty State */
                <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[60vh]">
                  <h1 className="text-4xl font-display font-bold text-foreground mb-3">
                    Tôi có thể giúp gì cho bạn?
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-md mb-10">
                    Hỏi tôi bất cứ điều gì về quy định và tuân thủ EPR
                  </p>

                  {/* Suggested Questions */}
                  <div className="grid sm:grid-cols-2 gap-3 w-full max-w-2xl">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="p-4 text-left border border-border rounded-xl hover:bg-muted/50 hover:border-primary/30 transition-colors group"
                      >
                        <span className="text-base text-foreground/80 group-hover:text-foreground transition-colors">
                          {question}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Messages */
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-12 h-12 flex items-center justify-center shrink-0">
                          <img src="/logo_chatbot.png" alt="AI" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] ${
                          message.role === "user" ? "order-first" : ""
                        }`}
                      >
                        {/* Show thinking status if message is empty and status exists */}
                        {message.role === "assistant" && !message.content && thinkingStatus && (
                          <div className="flex items-center gap-2 text-base text-muted-foreground italic py-2">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.1s]" />
                              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                            </div>
                            <span>{thinkingStatus}</span>
                          </div>
                        )}

                        {/* Show message content */}
                        {message.content && (
                        <div
                          className={`rounded-2xl px-5 py-4 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : ""
                          }`}
                        >
                          <div
                            className={`prose prose-base max-w-none ${
                              message.role === "user"
                                ? "prose-invert"
                                : ""
                            }`}
                          >
                            {message.content.split("\n").map((line, i) => {
                              if (line.startsWith("## ")) {
                                return (
                                  <h3 key={i} className="text-lg font-display font-semibold mb-2 mt-0">
                                    {line.replace("## ", "")}
                                  </h3>
                                );
                              }
                              if (line.startsWith("### ")) {
                                return (
                                  <h4 key={i} className="font-semibold mt-3 mb-1.5 text-base">
                                    {line.replace("### ", "")}
                                  </h4>
                                );
                              }
                              if (line.startsWith("- **")) {
                                const parts = line.replace("- **", "").split("**");
                                return (
                                  <p key={i} className="flex items-start gap-2 my-1 text-base">
                                    <span className="text-primary">•</span>
                                    <span>
                                      <strong>{parts[0]}</strong>
                                      {parts[1]}
                                    </span>
                                  </p>
                                );
                              }
                              if (line.match(/^\d+\. \*\*/)) {
                                const match = line.match(/^(\d+)\. \*\*(.+?)\*\*(.*)$/);
                                if (match) {
                                  return (
                                    <p key={i} className="flex items-start gap-2 my-1 text-base">
                                      <span className="text-primary font-medium">{match[1]}.</span>
                                      <span>
                                        <strong>{match[2]}</strong>
                                        {match[3]}
                                      </span>
                                    </p>
                                  );
                                }
                              }
                              return line ? <p key={i} className="my-1.5 text-base">{line}</p> : <br key={i} />;
                            })}
                          </div>
                        </div>
                        )}

                        {/* Message Actions */}
                        {message.role === "assistant" && message.content && (
                          <div className="flex items-center gap-1 mt-1.5 ml-1">
                            <button
                              onClick={() => copyToClipboard(message.content)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded hover:bg-muted">
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-muted">
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="border-t border-border bg-background p-4 shrink-0">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="relative flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border focus-within:border-primary/50 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message EPR Advisor..."
                  className="flex-1 bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-lg"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;
