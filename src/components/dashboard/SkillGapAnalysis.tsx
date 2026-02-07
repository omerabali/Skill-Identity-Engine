import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

interface SkillGap {
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  importance: string;
  gap: number;
}

interface SkillGapAnalysisProps {
  roleName: string;
  fitScore: number;
  gaps: SkillGap[];
  strengths: SkillGap[];
}

const SkillGapAnalysis = ({ roleName, fitScore, gaps, strengths }: SkillGapAnalysisProps) => {
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "critical": return "text-skill-low bg-skill-low/10 border-skill-low/30";
      case "important": return "text-skill-medium bg-skill-medium/10 border-skill-medium/30";
      default: return "text-muted-foreground bg-muted border-border";
    }
  };

  const getImportanceLabel = (importance: string) => {
    switch (importance) {
      case "critical": return "kritik";
      case "important": return "önemli";
      default: return "iyi olur";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">Açık Analizi: {roleName}</h3>
          <p className="text-sm text-muted-foreground">Mevcut beceri profilinize göre</p>
        </div>
        <div className="text-right">
          <span className={`font-mono text-3xl font-bold ${
            fitScore >= 80 ? "text-skill-high" : fitScore >= 50 ? "text-skill-medium" : "text-skill-low"
          }`}>
            {fitScore}%
          </span>
          <p className="text-sm text-muted-foreground">Uyum Puanı</p>
        </div>
      </div>

      {/* Gaps to address */}
      {gaps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-skill-low" />
            <h4 className="font-semibold text-foreground">Geliştirilmesi Gereken Beceriler ({gaps.length})</h4>
          </div>
          <div className="space-y-2">
            {gaps.map((gap, i) => (
              <motion.div
                key={gap.skillName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded border ${getImportanceColor(gap.importance)}`}>
                    {getImportanceLabel(gap.importance)}
                  </span>
                  <span className="font-medium text-foreground">{gap.skillName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{gap.currentLevel}%</span>
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-primary font-semibold">{gap.requiredLevel}%</span>
                    </div>
                    <span className="text-xs text-skill-low">+{gap.gap}% gerekli</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-skill-high" />
            <h4 className="font-semibold text-foreground">Güçlü Yönleriniz ({strengths.length})</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {strengths.map((strength) => (
              <span
                key={strength.skillName}
                className="px-3 py-1 rounded-full bg-skill-high/10 text-skill-high text-sm border border-skill-high/30"
              >
                {strength.skillName} ({strength.currentLevel}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {gaps.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-skill-high mx-auto mb-3" />
          <h4 className="font-semibold text-foreground">Mükemmel Uyum!</h4>
          <p className="text-muted-foreground">Becerileriniz bu rol için tüm gereksinimleri karşılıyor.</p>
        </div>
      )}
    </div>
  );
};

export default SkillGapAnalysis;
