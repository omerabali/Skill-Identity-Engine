import { useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AuthModal from "@/components/auth/AuthModal";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: "signin" | "signup" }>({
    open: false,
    mode: "signin",
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
      >
        <div className="w-full px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <img src="/Copy%20of%20CV%20Analysis%20Visualization.png" alt="Nexus AI Logo" className="w-9 h-9 rounded-lg object-contain bg-primary/10" />
              <span className="font-bold text-lg">Nexus AI</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Nasıl Çalışır</a>
              <a href="#principles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Özellikler</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Button size="sm" onClick={() => navigate("/dashboard")}>Panele Git</Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setAuthModal({ open: true, mode: "signin" })}>Giriş Yap</Button>
                  <Button size="sm" onClick={() => setAuthModal({ open: true, mode: "signup" })}>Kayıt Ol</Button>
                </>
              )}
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-4">
                <a href="#how-it-works" className="text-sm text-muted-foreground">Nasıl Çalışır</a>
                <a href="#principles" className="text-sm text-muted-foreground">Özellikler</a>
                <div className="flex gap-3 pt-4 border-t border-border">
                  {user ? (
                    <Button size="sm" className="flex-1" onClick={() => navigate("/dashboard")}>Panele Git</Button>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => setAuthModal({ open: true, mode: "signin" })}>Giriş Yap</Button>
                      <Button size="sm" className="flex-1" onClick={() => setAuthModal({ open: true, mode: "signup" })}>Kayıt Ol</Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      <AuthModal isOpen={authModal.open} onClose={() => setAuthModal({ ...authModal, open: false })} defaultMode={authModal.mode} />
    </>
  );
};

export default Navbar;
