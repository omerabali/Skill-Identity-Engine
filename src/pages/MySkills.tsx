import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2 } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import SkillCard from "@/components/dashboard/SkillCard";
import AddSkillModal from "@/components/dashboard/AddSkillModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserSkill {
  id: string;
  confidence_score: number;
  projects_score: number | null;
  time_score: number | null;
  assessment_score: number | null;
  contribution_score: number | null;
  last_used_at: string | null;
  skill: {
    id: string;
    name: string;
    category: string;
  };
}

const MySkills = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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
        projects_score,
        time_score,
        assessment_score,
        contribution_score,
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

  const handleDelete = async (skillId: string) => {
    setDeleting(skillId);
    const { error } = await supabase
      .from("user_skills")
      .delete()
      .eq("id", skillId);

    if (error) {
      toast.error("Beceri silinemedi");
    } else {
      toast.success("Beceri kaldırıldı");
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      if (selectedSkill?.id === skillId) setSelectedSkill(null);
    }
    setDeleting(null);
  };

  const groupedSkills = skills.reduce((acc, us) => {
    const cat = us.skill.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(us);
    return acc;
  }, {} as Record<string, UserSkill[]>);

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
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-bold text-foreground mb-2">Becerilerim</h1>
              <p className="text-muted-foreground">
                {skills.length} beceri takip ediliyor • Beceri profilinizi yönetin
              </p>
            </motion.div>

            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Beceri Ekle
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : skills.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Henüz beceri yok</h2>
              <p className="text-muted-foreground mb-6">
                İlk becerinizi ekleyerek beceri profilinizi oluşturmaya başlayın
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                İlk Becerinizi Ekleyin
              </Button>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Skills list */}
              <div className="lg:col-span-2 space-y-8">
                {Object.entries(groupedSkills).map(([category, categorySkills], catIndex) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIndex * 0.1 }}
                  >
                    <h3 className="font-mono text-sm text-muted-foreground mb-4">
                      {category} ({categorySkills.length})
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {categorySkills.map((us) => (
                        <div key={us.id} className="relative group">
                          <SkillCard
                            name={us.skill.name}
                            category={us.skill.category}
                            confidence={us.confidence_score}
                            lastUsed={us.last_used_at ? new Date(us.last_used_at).toLocaleDateString("tr-TR") : undefined}
                            onClick={() => setSelectedSkill(us)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(us.id);
                            }}
                            disabled={deleting === us.id}
                          >
                            {deleting === us.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Detail panel */}
              <div className="lg:col-span-1">
                {selectedSkill ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="sticky top-24 p-6 rounded-xl border border-border bg-card/50"
                  >
                    <h3 className="text-xl font-bold mb-1">{selectedSkill.skill.name}</h3>
                    <span className="text-sm text-muted-foreground font-mono">
                      {selectedSkill.skill.category}
                    </span>

                    <div className="mt-6 space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Genel Güven</span>
                          <span className="font-mono font-bold text-primary">{selectedSkill.confidence_score}%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${selectedSkill.confidence_score}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border space-y-3">
                        <h4 className="font-mono text-xs text-muted-foreground">GÜVEN DAĞILIMI</h4>
                        
                        {[
                          { label: "P (Projeler)", value: selectedSkill.projects_score || 0 },
                          { label: "T (Zaman)", value: selectedSkill.time_score || 0 },
                          { label: "A (Değerlendirme)", value: selectedSkill.assessment_score || 0 },
                          { label: "C (Katkı)", value: selectedSkill.contribution_score || 0 },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">{item.label}</span>
                              <span className="font-mono">{item.value}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary/70 rounded-full"
                                style={{ width: `${item.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="sticky top-24 p-6 rounded-xl border border-dashed border-border text-center">
                    <p className="text-muted-foreground">Detayları görmek için bir beceri seçin</p>
                  </div>
                )}
              </div>
            </div>
          )}
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

export default MySkills;
