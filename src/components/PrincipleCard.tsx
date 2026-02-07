import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PrincipleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

const PrincipleCard = ({ icon: Icon, title, description, index }: PrincipleCardProps) => {
  return (
    <motion.div
      className="group relative p-6 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, borderColor: "hsl(var(--primary))" }}
    >
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        
        <h3 className="font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

export default PrincipleCard;