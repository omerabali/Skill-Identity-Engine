import { motion } from "framer-motion";
import { ArrowRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleCardProps {
  name: string;
  category: string;
  description?: string;
  fitScore?: number;
  onSelect?: () => void;
  isSelected?: boolean;
}

const RoleCard = ({ name, category, description, fitScore, onSelect, isSelected }: RoleCardProps) => {
  const getFitColor = (score: number) => {
    if (score >= 80) return "text-skill-high";
    if (score >= 50) return "text-skill-medium";
    return "text-skill-low";
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`p-5 rounded-lg border transition-all ${
        isSelected 
          ? "border-primary bg-primary/10" 
          : "border-border bg-card/50 hover:bg-card hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            <span className="text-xs text-muted-foreground font-mono">{category}</span>
          </div>
        </div>
        {fitScore !== undefined && (
          <div className="text-right">
            <span className={`font-mono text-2xl font-bold ${getFitColor(fitScore)}`}>
              {fitScore}%
            </span>
            <p className="text-xs text-muted-foreground">Role Fit</p>
          </div>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}

      <Button 
        variant={isSelected ? "default" : "outline"} 
        size="sm" 
        className="w-full group"
        onClick={onSelect}
      >
        {isSelected ? "Selected" : "Analyze Gap"}
        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Button>
    </motion.div>
  );
};

export default RoleCard;