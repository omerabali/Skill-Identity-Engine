import { motion } from "framer-motion";

interface ConfidenceScoreProps {
  label: string;
  value: number;
  description: string;
  delay?: number;
}

const ConfidenceScore = ({ label, value, description, delay = 0 }: ConfidenceScoreProps) => {
  const getColor = (v: number) => {
    if (v >= 80) return "bg-skill-high";
    if (v >= 50) return "bg-skill-medium";
    return "bg-skill-low";
  };

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="flex justify-between items-center">
        <span className="font-mono text-sm text-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor(value)} rounded-full`}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </motion.div>
  );
};

export default ConfidenceScore;