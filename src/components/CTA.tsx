import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Github, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AuthModal from "./auth/AuthModal";

const CTA = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: "signin" | "signup" }>({
    open: false,
    mode: "signin",
  });

  const handleAnalyzeClick = () => {
    if (user) {
      navigate("/dashboard/cv");
    } else {
      setAuthModal({ open: true, mode: "signup" });
    }
  };

  const handleGitHubClick = () => {
    if (user) {
      navigate("/dashboard/github");
    } else {
      setAuthModal({ open: true, mode: "signup" });
    }
  };

  return (
    <>
      <section className="py-24 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />

        <div className="w-full max-w-[1920px] mx-auto px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-8"
            >
              <Zap className="w-8 h-8 text-primary" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Kariyer yolculuğunuza{" "}
              <span className="text-primary glow-text">bugün</span> başlayın
            </h2>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              CV'nizi analiz edin, GitHub profilinizi bağlayın ve kariyer hedeflerinize ulaşmak için kişiselleştirilmiş yol haritanızı oluşturun.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Button size="lg" className="group text-base px-8" onClick={handleAnalyzeClick}>
                <FileText className="mr-2 w-5 h-5" />
                CV Analizi
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" onClick={handleGitHubClick}>
                <Github className="mr-2 w-5 h-5" />
                GitHub Analizi
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
              className="mt-8 font-mono text-sm text-muted-foreground"
            >
            // AI Destekli • Detaylı Analiz • Kişiselleştirilmiş Öneriler
            </motion.p>
          </motion.div>
        </div>
      </section>

      <AuthModal isOpen={authModal.open} onClose={() => setAuthModal({ ...authModal, open: false })} defaultMode={authModal.mode} />
    </>
  );
};

export default CTA;
