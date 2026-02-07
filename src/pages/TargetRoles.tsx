import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import RoleCard from "@/components/dashboard/RoleCard";
import SkillGapAnalysis from "@/components/dashboard/SkillGapAnalysis";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TargetRole {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

interface RoleRequirement {
  skill_id: string;
  required_level: number;
  importance: string;
  skill: {
    name: string;
    category: string;
  };
}

interface UserSkill {
  skill_id: string;
  confidence_score: number;
}

interface SkillGap {
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  importance: string;
  gap: number;
}

const TargetRoles = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<TargetRole | null>(null);
  const [requirements, setRequirements] = useState<RoleRequirement[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch roles
    const { data: rolesData } = await supabase
      .from("target_roles")
      .select("*")
      .order("name");
    
    // Fetch user skills
    const { data: skillsData } = await supabase
      .from("user_skills")
      .select("skill_id, confidence_score")
      .eq("user_id", user?.id);

    if (rolesData) setRoles(rolesData);
    if (skillsData) setUserSkills(skillsData);
    
    setLoading(false);
  };

  const handleSelectRole = async (role: TargetRole) => {
    setSelectedRole(role);
    setLoadingAnalysis(true);

    const { data } = await supabase
      .from("role_skill_requirements")
      .select(`
        skill_id,
        required_level,
        importance,
        skill:skills(name, category)
      `)
      .eq("role_id", role.id)
      .order("importance");

    if (data) {
      setRequirements(data as unknown as RoleRequirement[]);
    }
    
    setLoadingAnalysis(false);
  };

  // Calculate gaps and fit score
  const calculateAnalysis = () => {
    if (!requirements.length) return { gaps: [], strengths: [], fitScore: 0 };

    const gaps: SkillGap[] = [];
    const strengths: SkillGap[] = [];
    let totalWeight = 0;
    let weightedScore = 0;

    requirements.forEach((req) => {
      const userSkill = userSkills.find((us) => us.skill_id === req.skill_id);
      const currentLevel = userSkill?.confidence_score || 0;
      const gap = Math.max(0, req.required_level - currentLevel);
      
      const weight = req.importance === "critical" ? 3 : req.importance === "important" ? 2 : 1;
      totalWeight += weight;
      
      const skillFit = Math.min(100, (currentLevel / req.required_level) * 100);
      weightedScore += skillFit * weight;

      const skillGap: SkillGap = {
        skillName: req.skill.name,
        currentLevel,
        requiredLevel: req.required_level,
        importance: req.importance,
        gap,
      };

      if (gap > 0) {
        gaps.push(skillGap);
      } else {
        strengths.push(skillGap);
      }
    });

    // Sort gaps by importance and gap size
    gaps.sort((a, b) => {
      const importanceOrder = { critical: 0, important: 1, "nice-to-have": 2 };
      const aOrder = importanceOrder[a.importance as keyof typeof importanceOrder];
      const bOrder = importanceOrder[b.importance as keyof typeof importanceOrder];
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.gap - a.gap;
    });

    const fitScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

    return { gaps, strengths, fitScore };
  };

  const { gaps, strengths, fitScore } = calculateAnalysis();

  // Group roles by category
  const groupedRoles = roles.reduce((acc, role) => {
    if (!acc[role.category]) acc[role.category] = [];
    acc[role.category].push(role);
    return acc;
  }, {} as Record<string, TargetRole[]>);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="pt-24 pb-12 px-6">
        <div className="container mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">Hedef Roller</h1>
            <p className="text-muted-foreground">
              Beceri açıklarınızı analiz etmek ve kişiselleştirilmiş yol haritası almak için bir rol seçin
            </p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Roles list */}
              <div className="space-y-8">
                {Object.entries(groupedRoles).map(([category, categoryRoles], catIndex) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIndex * 0.1 }}
                  >
                    <h3 className="font-mono text-sm text-muted-foreground mb-4">
                      {category}
                    </h3>
                    <div className="grid gap-4">
                      {categoryRoles.map((role) => (
                        <RoleCard
                          key={role.id}
                          name={role.name}
                          category={role.category}
                          description={role.description || undefined}
                          isSelected={selectedRole?.id === role.id}
                          onSelect={() => handleSelectRole(role)}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Analysis panel */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                {selectedRole ? (
                  loadingAnalysis ? (
                    <div className="p-8 rounded-xl border border-border bg-card/50 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Beceri açıkları analiz ediliyor...</p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-6 rounded-xl border border-border bg-card/50"
                    >
                      <SkillGapAnalysis
                        roleName={selectedRole.name}
                        fitScore={fitScore}
                        gaps={gaps}
                        strengths={strengths}
                      />
                    </motion.div>
                  )
                ) : (
                  <div className="p-8 rounded-xl border border-dashed border-border text-center">
                    <p className="text-muted-foreground">
                      Beceri açığı analizini görmek için bir hedef rol seçin
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TargetRoles;
