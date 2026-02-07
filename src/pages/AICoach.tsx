import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Send,
  Loader2,
  TrendingUp,
  GraduationCap,
  FileText,
  MessageSquare,
  Sparkles,
  User,
  Plus,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  Copy,
  Share2,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "chat" | "market-analysis" | "learning-path" | "cv-optimization";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface Conversation {
  id: string;
  title: string;
  mode: Mode;
  created_at: string;
  updated_at: string;
}

interface UserContext {
  skills: { name: string; category: string; confidence: number }[];
  targetRoles: string[];
  githubUsername?: string;
  cvAnalysis?: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
  };
}

const modeConfig = {
  chat: {
    icon: MessageSquare,
    label: "Kariyer Koçu",
    description: "Genel kariyer danışmanlığı",
    color: "bg-primary/10 text-primary",
    prompts: [
      "Kariyerimde bir sonraki adım ne olmalı?",
      "Mülakatlara nasıl hazırlanmalıyım?",
      "Maaş pazarlığı nasıl yapılır?",
      "Uzaktan çalışma fırsatları hakkında bilgi ver",
    ],
  },
  "market-analysis": {
    icon: TrendingUp,
    label: "Piyasa Analizi",
    description: "Beceri talebi ve maaş analizi",
    color: "bg-emerald-500/10 text-emerald-600",
    prompts: [
      "Becerilerimin piyasa değeri nedir?",
      "2024'te en çok aranan beceriler hangileri?",
      "React developer maaş aralıkları nedir?",
      "Yapay zeka alanında kariyer fırsatları",
    ],
  },
  "learning-path": {
    icon: GraduationCap,
    label: "Öğrenme Yolu",
    description: "Kişiselleştirilmiş öğrenme planı",
    color: "bg-violet-500/10 text-violet-600",
    prompts: [
      "Senior developer olmak için ne öğrenmeliyim?",
      "Frontend'den full-stack'e geçiş planı",
      "DevOps öğrenme yol haritası oluştur",
      "Machine Learning'e nereden başlamalıyım?",
    ],
  },
  "cv-optimization": {
    icon: FileText,
    label: "CV Optimizasyonu",
    description: "CV iyileştirme önerileri",
    color: "bg-amber-500/10 text-amber-600",
    prompts: [
      "CV'mi nasıl daha etkili hale getirebilirim?",
      "ATS uyumlu CV nasıl yazılır?",
      "Proje açıklamalarımı nasıl geliştirmeliyim?",
      "LinkedIn profilim için öneriler",
    ],
  },
};

const AICoachPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [userContext, setUserContext] = useState<UserContext>({
    skills: [],
    targetRoles: [],
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice recognition
  const { isListening, isSupported, transcript, toggleListening, stopListening } = useSpeechRecognition({
    onResult: (text) => {
      setInput(prev => prev + (prev ? " " : "") + text);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserContext();
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserContext = async () => {
    if (!user) return;

    try {
      // Fetch user skills
      const { data: userSkills } = await supabase
        .from("user_skills")
        .select(`
          confidence_score,
          skills (name, category)
        `)
        .eq("user_id", user.id);

      // Fetch target roles
      const { data: userRoles } = await supabase
        .from("user_target_roles")
        .select(`
          target_roles (name)
        `)
        .eq("user_id", user.id);

      // Fetch GitHub username
      const { data: profile } = await supabase
        .from("profiles")
        .select("github_username")
        .eq("user_id", user.id)
        .single();

      // Fetch latest CV analysis
      const { data: cvAnalysis } = await supabase
        .from("cv_analyses")
        .select("overall_score, strengths, weaknesses")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setUserContext({
        skills: userSkills?.map((us: any) => ({
          name: us.skills?.name || "",
          category: us.skills?.category || "",
          confidence: us.confidence_score,
        })) || [],
        targetRoles: userRoles?.map((ur: any) => ur.target_roles?.name).filter(Boolean) || [],
        githubUsername: profile?.github_username || undefined,
        cvAnalysis: cvAnalysis ? {
          overallScore: cvAnalysis.overall_score || 0,
          strengths: (cvAnalysis.strengths as string[]) || [],
          weaknesses: (cvAnalysis.weaknesses as string[]) || [],
        } : undefined,
      });
    } catch (error) {
      console.error("Error fetching user context:", error);
    }
  };

  const fetchConversations = async () => {
    if (!user) return;
    setLoadingConversations(true);

    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations((data || []).map(c => ({ ...c, mode: c.mode as Mode })));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setMode(conversation.mode as Mode);
      }

      setMessages((messages || []).map(m => ({ ...m, role: m.role as "user" | "assistant" })));
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Konuşma yüklenemedi");
    }
  };

  const createNewConversation = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: user.id,
          title: "Yeni Konuşma",
          mode: mode,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newConv = { ...data, mode: data.mode as Mode };
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const updateConversationTitle = async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    
    try {
      await supabase
        .from("chat_conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, title } : c)
      );
    } catch (error) {
      console.error("Error updating conversation title:", error);
    }
  };

  const saveMessage = async (conversationId: string, role: "user" | "assistant", content: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          role,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving message:", error);
      return null;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }

      toast.success("Konuşma silindi");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Konuşma silinemedi");
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput("");
  };

  // Copy single message to clipboard
  const copyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success("Mesaj kopyalandı");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      toast.error("Kopyalama başarısız");
    }
  };

  // Copy entire conversation
  const copyConversation = async () => {
    if (messages.length === 0) {
      toast.error("Kopyalanacak mesaj yok");
      return;
    }
    
    const conversationText = messages.map(m => 
      `${m.role === 'user' ? '🧑 Sen' : '🤖 AI Koç'}:\n${m.content}`
    ).join('\n\n---\n\n');
    
    try {
      await navigator.clipboard.writeText(conversationText);
      toast.success("Sohbet kopyalandı");
    } catch (err) {
      toast.error("Kopyalama başarısız");
    }
  };

  // Share conversation (Web Share API or fallback)
  const shareConversation = async () => {
    if (messages.length === 0) {
      toast.error("Paylaşılacak mesaj yok");
      return;
    }

    const conversationText = messages.map(m => 
      `${m.role === 'user' ? 'Ben' : 'AI Koç'}:\n${m.content}`
    ).join('\n\n---\n\n');

    const shareData = {
      title: 'AI Kariyer Koçu Sohbeti',
      text: conversationText,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success("Paylaşıldı");
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error("Paylaşım iptal edildi");
        }
      }
    } else {
      // Fallback: copy to clipboard
      await copyConversation();
    }
  };

  const sendMessage = async (content: string = input) => {
    if (!content.trim() || loading) return;

    setLoading(true);
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // Create or use existing conversation
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = await createNewConversation();
        if (!conversationId) throw new Error("Konuşma oluşturulamadı");
        
        // Update title with first message
        await updateConversationTitle(conversationId, content.trim());
      } else {
        // Update conversation's updated_at
        await supabase
          .from("chat_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      }

      // Save user message
      await saveMessage(conversationId, "user", content.trim());

      const response = await supabase.functions.invoke("ai-career-coach", {
        body: {
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userContext,
          mode,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Bir hata oluştu");
      }

      // Handle streaming response
      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessageId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              assistantContent += content;

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Save assistant message
      if (assistantContent) {
        await saveMessage(conversationId, "assistant", assistantContent);
      }
    } catch (error) {
      console.error("AI Coach error:", error);
      toast.error(
        error instanceof Error ? error.message : "Bir hata oluştu"
      );
      setMessages((prev) => prev.filter((m) => m.id !== "temp"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const currentConfig = modeConfig[mode];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          {/* Sidebar - Conversation History */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0"
              >
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Konuşmalar
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowSidebar(false)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
                    <Button
                      onClick={startNewChat}
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Konuşma
                    </Button>

                    <ScrollArea className="flex-1">
                      <div className="space-y-2 pr-2">
                        {loadingConversations ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        ) : conversations.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Henüz konuşma yok
                          </p>
                        ) : (
                          conversations.map((conv) => (
                            <div
                              key={conv.id}
                              className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                currentConversationId === conv.id
                                  ? "bg-primary/10"
                                  : "hover:bg-muted"
                              }`}
                              onClick={() => loadConversation(conv.id)}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {conv.title}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {modeConfig[conv.mode as Mode]?.label || conv.mode}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversation(conv.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle sidebar button when hidden */}
          {!showSidebar && (
            <Button
              size="icon"
              variant="outline"
              className="flex-shrink-0 h-10"
              onClick={() => setShowSidebar(true)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Mode Selector */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(modeConfig).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = mode === key;
                return (
                  <Button
                    key={key}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode(key as Mode)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </Button>
                );
              })}
            </div>

            {/* Chat Card */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${currentConfig.color}`}>
                    <currentConfig.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{currentConfig.label}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {currentConfig.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {userContext.skills.length > 0 && (
                      <Badge variant="secondary">
                        {userContext.skills.length} beceri yüklendi
                      </Badge>
                    )}
                    {messages.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Share2 className="h-4 w-4" />
                            Paylaş
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={copyConversation} className="gap-2">
                            <Copy className="h-4 w-4" />
                            Sohbeti Kopyala
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={shareConversation} className="gap-2">
                            <Share2 className="h-4 w-4" />
                            Paylaş
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className={`p-4 rounded-full ${currentConfig.color} mb-4`}>
                        <Sparkles className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {currentConfig.label}'na Hoş Geldin!
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        {currentConfig.description}. Aşağıdaki önerilerden birini
                        seç veya kendi sorunu yaz.
                      </p>

                      <div className="grid gap-2 w-full max-w-md">
                        {currentConfig.prompts.map((prompt, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            className="justify-start h-auto py-3 px-4 text-left"
                            onClick={() => sendMessage(prompt)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-sm">{prompt}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${
                            message.role === "user" ? "justify-end" : ""
                          }`}
                        >
                          {message.role === "assistant" && (
                            <div className={`p-2 rounded-lg h-fit ${currentConfig.color}`}>
                              <Bot className="h-4 w-4" />
                            </div>
                          )}
                          <div
                            className={`group relative rounded-lg p-4 max-w-[80%] ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {message.role === "assistant" ? (
                              message.content ? (
                                <MarkdownRenderer content={message.content} />
                              ) : (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">
                                {message.content}
                              </p>
                            )}
                            {/* Copy button for each message */}
                            {message.content && (
                              <button
                                onClick={() => copyMessage(message.id, message.content)}
                                className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                                  message.role === "user" 
                                    ? "hover:bg-primary-foreground/20" 
                                    : "hover:bg-muted-foreground/20"
                                }`}
                                title="Mesajı kopyala"
                              >
                                {copiedMessageId === message.id ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                          {message.role === "user" && (
                            <div className="p-2 rounded-lg h-fit bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t bg-background">
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isListening ? "Dinleniyor..." : "Mesajınızı yazın veya mikrofon ile konuşun..."}
                      className={`min-h-[60px] max-h-[120px] resize-none ${isListening ? "border-red-500 bg-red-50/50" : ""}`}
                      disabled={loading}
                    />
                    {isSupported && (
                      <Button
                        onClick={toggleListening}
                        variant={isListening ? "destructive" : "outline"}
                        size="icon"
                        className="h-[60px] w-[60px] shrink-0"
                        disabled={loading}
                      >
                        {isListening ? (
                          <MicOff className="h-5 w-5 animate-pulse" />
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        if (isListening) stopListening();
                        sendMessage();
                      }}
                      disabled={!input.trim() || loading}
                      size="icon"
                      className="h-[60px] w-[60px] shrink-0"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  {isListening && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Konuşmanızı dinliyorum...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AICoachPage;
