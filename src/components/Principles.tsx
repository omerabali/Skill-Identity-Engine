import { motion } from "framer-motion";
import { ShieldCheck, Clock, Layers, Search, AlertTriangle, FileCode } from "lucide-react";
import PrincipleCard from "./PrincipleCard";

const Principles = () => {
  const principles = [
    {
      icon: ShieldCheck,
      title: "Kapsamlı CV Analizi",
      description: "CV'nizdeki deneyim, eğitim, beceriler, format ve dil kullanımını detaylı değerlendiriyor ve puanlıyoruz.",
    },
    {
      icon: Clock,
      title: "GitHub Profil Analizi",
      description: "Repolarınızı, katkılarınızı ve kullandığınız teknolojileri analiz ederek teknik yeteneklerinizi ortaya çıkarıyoruz.",
    },
    {
      icon: Layers,
      title: "Beceri Tespiti",
      description: "AI destekli sistemimiz CV ve GitHub verilerinizden becerilerinizi otomatik tespit eder ve kategorize eder.",
    },
    {
      icon: Search,
      title: "Eksiklik Analizi",
      description: "Hedef pozisyonunuz için gerekli becerileri belirler ve eksiklerinizi net bir şekilde gösterir.",
    },
    {
      icon: AlertTriangle,
      title: "Gelişim Önerileri",
      description: "Kişiselleştirilmiş önerilerle CV'nizi ve beceri profilinizi nasıl güçlendirebileceğinizi öğrenin.",
    },
    {
      icon: FileCode,
      title: "Kariyer Yol Haritası",
      description: "Hedef rolünüze ulaşmak için öğrenmeniz gereken becerileri ve kaynakları içeren kişisel yol haritanız.",
    },
  ];

  return (
    <section id="principles" className="py-24 relative">
      <div className="w-full max-w-[1920px] mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-mono text-primary text-sm">// ÖZELLİKLER</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">
            Size Sunduklarımız
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nexus AI, kariyerinizi bir üst seviyeye taşımak için ihtiyacınız olan tüm araçları sunar. AI destekli analizlerle güçlü ve zayıf yönlerinizi keşfedin.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {principles.map((principle, i) => (
            <PrincipleCard key={i} {...principle} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Principles;
