import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, GitBranch, Plus, AlertTriangle, FileText, Github } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import SkillCard from "@/components/dashboard/SkillCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AddSkillModal from "@/components/dashboard/AddSkillModal";

interface UserSkill {
  id: string;
  confidence_score: number;
  last_used_at: string | null;
  skill: {
    id: string;
    name: string;
    category: string;
  };
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSkills();
    }
  }, [user]);

  const fetchSkills = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_skills")
      .select(`
        id,
        confidence_score,
        last_used_at,
        skill:skills(id, name, category)
      `)
      .eq("user_id", user?.id)
      .order("confidence_score", { ascending: false });

    if (!error && data) {
      setSkills(data as unknown as UserSkill[]);
    }
    setLoading(false);
  };

  const averageConfidence = skills.length > 0
    ? Math.round(skills.reduce((sum, s) => sum + s.confidence_score, 0) / skills.length)
    : 0;

  const topSkills = skills.slice(0, 3);
  const weakSkills = [...skills].sort((a, b) => a.confidence_score - b.confidence_score).slice(0, 3);

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

      <main className="pt-24 pb-12 px-8">
        <div className="w-full max-w-[1920px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">Genel Bakış</h1>
            <p className="text-muted-foreground">Kariyer analizinizin özeti</p>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl border border-border bg-card/50 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">CV Analizi</h3>
                  <p className="text-sm text-muted-foreground">CV'nizi yükleyip analiz edin</p>
                </div>
              </div>
              <Button onClick={() => navigate("/dashboard/cv")}>Analiz Et</Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl border border-border bg-card/50 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Github className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">GitHub Analizi</h3>
                  <p className="text-sm text-muted-foreground">Profil ve repolarınızı inceleyin</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate("/dashboard/github")}>Analiz Et</Button>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-xl border border-border bg-card/50"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground">Toplam Beceri</span>
              </div>
              <p className="text-4xl font-bold text-foreground font-mono">{skills.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-xl border border-border bg-card/50"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-skill-high/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-skill-high" />
                </div>
                <span className="text-muted-foreground">Ortalama Güven</span>
              </div>
              <p className="text-4xl font-bold text-foreground font-mono">{averageConfidence}%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-xl border border-border bg-card/50"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <span className="text-muted-foreground">Kanıt Puanı</span>
              </div>
              <p className="text-4xl font-bold text-foreground font-mono">{skills.length * 10}</p>
            </motion.div>
          </div>

          {/* Skills sections */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Top Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">En Güçlü Beceriler</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/skills")}>
                  Tümünü Gör
                </Button>
              </div>

              {topSkills.length > 0 ? (
                <div className="space-y-3">
                  {topSkills.map((us) => (
                    <SkillCard
                      key={us.id}
                      name={us.skill.name}
                      category={us.skill.category}
                      confidence={us.confidence_score}
                      lastUsed={us.last_used_at ? new Date(us.last_used_at).toLocaleDateString("tr-TR") : undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-lg border border-dashed border-border text-center">
                  <GitBranch className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Henüz beceri eklenmemiş</p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Becerini Ekle
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Skills to Improve */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-skill-medium" />
                  <h2 className="text-lg font-semibold text-foreground">Gelişim Alanları</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/roles")}>
                  Eksik Analizi
                </Button>
              </div>

              {weakSkills.length > 0 ? (
                <div className="space-y-3">
                  {weakSkills.map((us) => (
                    <SkillCard
                      key={us.id}
                      name={us.skill.name}
                      category={us.skill.category}
                      confidence={us.confidence_score}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-lg border border-dashed border-border text-center">
                  <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Gelişim alanlarını görmek için beceri ekleyin</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <AddSkillModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={fetchSkills}
        existingSkillIds={skills.map((s) => s.skill.id)}
      />
    </div>
  );
};

export default Dashboard;
