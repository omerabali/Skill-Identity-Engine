import { motion } from "framer-motion";

interface SkillCardProps {
  name: string;
  category: string;
  confidence: number;
  lastUsed?: string;
  onClick?: () => void;
}

const SkillCard = ({ name, category, confidence, lastUsed, onClick }: SkillCardProps) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "bg-skill-high";
    if (conf >= 50) return "bg-skill-medium";
    return "bg-skill-low";
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 80) return "High";
    if (conf >= 50) return "Medium";
    return "Low";
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          <span className="text-xs text-muted-foreground font-mono">{category}</span>
        </div>
        <div className="text-right">
          <span className="font-mono text-lg font-bold text-primary">{confidence}%</span>
          <p className="text-xs text-muted-foreground">{getConfidenceLabel(confidence)}</p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`h-full ${getConfidenceColor(confidence)} rounded-full`}
        />
      </div>

      {lastUsed && (
        <p className="text-xs text-muted-foreground mt-2">
          Last used: {lastUsed}
        </p>
      )}
    </motion.div>
  );
};

export default SkillCard;