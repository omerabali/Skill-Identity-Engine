import { Terminal } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="w-full max-w-[1920px] mx-auto px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/Copy%20of%20CV%20Analysis%20Visualization.png" alt="Nexus AI Logo" className="w-10 h-10 rounded-lg object-contain bg-primary/10" />
            <div>
              <span className="font-bold text-foreground">Nexus AI</span>
              <p className="text-xs text-muted-foreground font-mono">Kariyer Analiz Sistemi</p>
            </div>
          </div>

          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">Nasıl Çalışır</a>
            <a href="#principles" className="hover:text-foreground transition-colors">Özellikler</a>
          </div>

          <p className="text-sm text-muted-foreground font-mono">
            © 2026 Nexus AI. AI Destekli.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
