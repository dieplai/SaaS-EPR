"use client";

import { useState, useEffect } from "react";
import { X, Send, MessageSquare, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/auth-context";
import { api, ChatMessage } from "@/lib/api";

export function ChatWidget() {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentChat, setCurrentChat] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý AI của EPR SaaS. Tôi có thể giúp bạn với các câu hỏi về quản lý EPR, tái chế, tuân thủ quy định và nhiều hơn nữa. Bạn cần tôi hỗ trợ điều gì?",
    },
  ]);

  // Don't show widget if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isTyping) return;

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

      await api.chatbot.sendMessageStreaming(
        {
          message: userMessage.content,
          chatHistory: currentChat,
        },
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
        }
      );
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

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-chat-bubble shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        >
          <MessageSquare className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse">
            AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 glass-effect rounded-2xl shadow-2xl transition-all duration-300 ${
            isMinimized
              ? "bottom-6 right-6 w-80 h-16"
              : "bottom-6 right-6 w-[420px] h-[600px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 gradient-chat-bubble rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Trợ lý AI EPR
                </h3>
                {!isMinimized && (
                  <p className="text-xs text-white/80">
                    {isTyping ? "Đang trả lời..." : "Sẵn sàng hỗ trợ"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4 text-white" />
                ) : (
                  <Minimize2 className="h-4 w-4 text-white" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          {!isMinimized && (
            <>
              <ScrollArea className="h-[calc(100%-140px)] p-4">
                <div className="space-y-4">
                  {currentChat.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        msg.role === "user" ? "justify-end" : ""
                      }`}
                    >
                      <div
                        className={`max-w-[85%] ${
                          msg.role === "user" ? "order-2" : ""
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            msg.role === "user"
                              ? "gradient-chat-bubble text-white"
                              : "bg-white/80 text-foreground"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Nhập câu hỏi về EPR..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSendMessage()
                    }
                    className="flex-1 h-10 rounded-xl bg-white/60"
                    disabled={isTyping}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isTyping}
                    className="h-10 w-10 gradient-chat-bubble text-white rounded-xl"
                  >
                    {isTyping ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
