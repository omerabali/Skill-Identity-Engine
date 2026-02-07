import { motion } from "framer-motion";

interface SkillNodeProps {
  name: string;
  confidence: number;
  x: number;
  y: number;
  delay?: number;
  size?: "sm" | "md" | "lg";
}

const SkillNode = ({ name, confidence, x, y, delay = 0, size = "md" }: SkillNodeProps) => {
  const sizeClasses = {
    sm: "w-16 h-16 text-xs",
    md: "w-20 h-20 text-sm",
    lg: "w-24 h-24 text-sm",
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "from-skill-high to-emerald-400";
    if (conf >= 50) return "from-skill-medium to-amber-400";
    return "from-skill-low to-red-400";
  };

  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.5, type: "spring" }}
    >
      <motion.div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getConfidenceColor(confidence)} flex items-center justify-center cursor-pointer relative group`}
        whileHover={{ scale: 1.15 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ 
          y: { duration: 2 + delay, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 0.2 }
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        <span className="font-mono font-semibold text-primary-foreground relative z-10 text-center px-1 leading-tight">
          {name}
        </span>
        
        {/* Confidence tooltip */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="font-mono text-xs text-muted-foreground bg-card px-2 py-1 rounded border border-border whitespace-nowrap">
            {confidence}% confidence
          </span>
        </div>
        
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getConfidenceColor(confidence)} opacity-30 blur-xl -z-10`} />
      </motion.div>
    </motion.div>
  );
};

export default SkillNode;