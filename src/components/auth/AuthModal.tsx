import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signin" | "signup";
}

const AuthModal = ({ isOpen, onClose, defaultMode = "signin" }: AuthModalProps) => {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast.success("Hesap oluşturuldu! Artık giriş yapabilirsiniz.");
        onClose();
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Tekrar hoş geldiniz!");
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Kimlik doğrulama başarısız");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md mx-4"
        >
          <div className="relative bg-card border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    {mode === "signin" ? "Tekrar Hoş Geldiniz" : "Hesap Oluştur"}
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    {mode === "signin" ? "// yolculuğunuza devam edin" : "// becerilerinizi takip etmeye başlayın"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Ad Soyad</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-muted/50"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {mode === "signin" ? "Giriş Yap" : "Hesap Oluştur"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mode === "signin"
                    ? "Hesabınız yok mu? Kayıt olun"
                    : "Zaten hesabınız var mı? Giriş yapın"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
