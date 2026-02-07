import { motion } from "framer-motion";
import { FileText, Github, TrendingUp, Target } from "lucide-react";
import ConfidenceScore from "./ConfidenceScore";

const HowItWorks = () => {
  const steps = [
    {
      icon: FileText,
      title: "CV Analizi",
      description: "CV'nizi yükleyin, AI deneyim, eğitim, beceri ve format kalitesini değerlendirir.",
    },
    {
      icon: Github,
      title: "GitHub Analizi",
      description: "GitHub kullanıcı adınızı girin, projeleriniz ve katkılarınız analiz edilsin.",
    },
    {
      icon: TrendingUp,
      title: "Beceri Haritası",
      description: "Tüm kaynaklardan tespit edilen becerileriniz tek bir görünümde birleşir.",
    },
    {
      icon: Target,
      title: "Kariyer Yol Haritası",
      description: "Hedef rolünüz için eksik becerilerinizi ve öğrenme yolunuzu görün.",
    },
  ];

  const confidenceFactors = [
    { label: "CV Kalitesi", value: 85, description: "CV'nizin genel formatı ve içerik kalitesi" },
    { label: "GitHub Aktivite", value: 72, description: "Commit sıklığı ve proje çeşitliliği" },
    { label: "Beceri Derinliği", value: 90, description: "Tespit edilen becerilerdeki uzmanlık" },
    { label: "Deneyim", value: 65, description: "İş deneyimi ve proje geçmişi" },
  ];

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-transparent" />

      <div className="w-full max-w-[1920px] mx-auto px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-mono text-primary text-sm">// NASIL ÇALIŞIR</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">
            Kariyer Analiz Süreci
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            CV'niz ve GitHub profiliniz üzerinden kapsamlı bir kariyer analizi yapıyoruz. Güçlü yönlerinizi, gelişim alanlarınızı ve kariyer hedeflerinize ulaşmak için gereken adımları belirliyoruz.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-px rounded-lg bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 rounded-lg border border-border bg-card/50 backdrop-blur-sm h-full">
                <step.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Confidence calculation */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold">Güven Skoru Hesaplama</h3>
            <p className="text-muted-foreground">
              Her beceri için çoklu kaynaklardan elde edilen verileri birleştirerek bir güven skoru hesaplıyoruz. Bu skor, becerinizin ne kadar güvenilir olduğunu gösterir.
            </p>

            <div className="font-mono text-sm bg-muted/50 p-4 rounded-lg border border-border">
              <span className="text-muted-foreground">// Ağırlıklı güven formülü</span>
              <br />
              <span className="text-primary">güven_skoru</span> = (CV × 0.3) + (GitHub × 0.25) + (Beceri × 0.25) + (Deneyim × 0.2)
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 space-y-6"
          >
            {confidenceFactors.map((factor, i) => (
              <ConfidenceScore key={i} {...factor} delay={i * 0.1} />
            ))}

            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="font-mono font-semibold text-primary">Genel Güven Skoru</span>
                <span className="font-mono text-2xl font-bold text-primary">78%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
