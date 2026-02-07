import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Terminal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import SkillGraph from "./SkillGraph";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AuthModal from "./auth/AuthModal";

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: "signin" | "signup" }>({
    open: false,
    mode: "signin",
  });

  const handleAnalyzeClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      setAuthModal({ open: true, mode: "signup" });
    }
  };

  return (
    <>
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "1s" }} />

        <div className="w-full max-w-[1920px] mx-auto px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column - Text content */}
            <div className="space-y-8">


              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
              >
                <span className="text-foreground">CV'nizi </span>
                <span className="text-primary glow-text">akıllıca</span>
                <br />
                <span className="text-foreground">analiz edin.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-lg text-muted-foreground max-w-lg leading-relaxed"
              >
                CV'nizi yükleyin, GitHub profilinizi bağlayın. AI destekli sistemimiz becerilerinizi analiz eder, eksiklerinizi belirler ve kariyer yol haritanızı çizer.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                <Button size="lg" className="group" onClick={handleAnalyzeClick}>
                  <FileText className="mr-2 w-4 h-4" />
                  CV Analizi Başlat
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => window.scrollTo({ top: document.getElementById('how-it-works')?.offsetTop, behavior: 'smooth' })}
                >
                  Nasıl Çalışır?
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex gap-8 pt-8 border-t border-border"
              >
                {[
                  { value: "AI", label: "Destekli" },
                  { value: "Detaylı", label: "Analiz" },
                  { value: "Aksiyon", label: "Odaklı" },
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <p className="font-mono text-2xl font-bold text-primary">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right column - Skill Graph visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-2xl" />
              <div className="relative bg-card/30 backdrop-blur-sm border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-skill-low" />
                  <div className="w-3 h-3 rounded-full bg-skill-medium" />
                  <div className="w-3 h-3 rounded-full bg-skill-high" />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">beceri_grafigi.view</span>
                </div>
                <SkillGraph />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <AuthModal isOpen={authModal.open} onClose={() => setAuthModal({ ...authModal, open: false })} defaultMode={authModal.mode} />
    </>
  );
};

export default Hero;
