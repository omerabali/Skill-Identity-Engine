import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Map, Loader2, ExternalLink, Clock, BookOpen, Wrench, Target, ChevronDown, ChevronUp } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserSkill {
  skill_id: string;
  confidence_score: number;
  skill: {
    id: string;
    name: string;
    category: string;
  };
}

interface TargetRole {
  id: string;
  role_id: string;
  fit_score: number | null;
  role: {
    id: string;
    name: string;
    category: string;
    description: string | null;
  };
}

interface RoadmapResource {
  title: string;
  type: string;
  url: string;
  provider: string;
  estimatedHours: number;
  isFree: boolean;
}

interface RoadmapProject {
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
}

interface RoadmapSkill {
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  priority: string;
  resources: RoadmapResource[];
  projects: RoadmapProject[];
  milestones: string[];
}

interface RoadmapPhase {
  phase: number;
  title: string;
  durationWeeks: number;
  skills: RoadmapSkill[];
}

interface Roadmap {
  overview: string;
  estimatedTotalWeeks: number;
  phases: RoadmapPhase[];
  tips: string[];
}

const RoadmapPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [targetRoles, setTargetRoles] = useState<TargetRole[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [selectedRole, setSelectedRole] = useState<TargetRole | null>(null);
  const [roadmapState, setRoadmapState] = useState<"idle" | "loading" | "ready">("idle");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<number[]>([0]);

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
    
    const [rolesResult, skillsResult] = await Promise.all([
      supabase
        .from("user_target_roles")
        .select(`
          id,
          role_id,
          fit_score,
          role:target_roles(id, name, category, description)
        `)
        .eq("user_id", user?.id),
      supabase
        .from("user_skills")
        .select(`
          skill_id,
          confidence_score,
          skill:skills(id, name, category)
        `)
        .eq("user_id", user?.id),
    ]);

    if (!rolesResult.error && rolesResult.data) {
      setTargetRoles(rolesResult.data as unknown as TargetRole[]);
    }
    if (!skillsResult.error && skillsResult.data) {
      setUserSkills(skillsResult.data as unknown as UserSkill[]);
    }

    setLoading(false);
  };

  const generateRoadmap = async (role: TargetRole) => {
    setSelectedRole(role);
    setRoadmapState("loading");

    try {
      // Fetch skill requirements for this role
      const { data: requirements } = await supabase
        .from("role_skill_requirements")
        .select(`
          required_level,
          importance,
          skill:skills(id, name, category)
        `)
        .eq("role_id", role.role_id);

      // Calculate skill gaps
      const skillGaps = (requirements || []).map((req: any) => {
        const userSkill = userSkills.find((us) => us.skill_id === req.skill.id);
        const currentLevel = userSkill?.confidence_score || 0;
        const gap = req.required_level - currentLevel;
        return {
          skillName: req.skill.name,
          currentLevel,
          requiredLevel: req.required_level,
          gap: Math.max(0, gap),
          importance: req.importance,
        };
      }).filter((sg: any) => sg.gap > 0).sort((a: any, b: any) => b.gap - a.gap);

      const { data, error } = await supabase.functions.invoke("generate-roadmap", {
        body: {
          targetRole: role.role.name,
          skillGaps,
          userSkills: userSkills.map((us) => ({
            name: us.skill.name,
            level: us.confidence_score,
          })),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRoadmap(data.roadmap);
      setRoadmapState("ready");
      setExpandedPhases([0]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Yol haritası oluşturulamadı";
      toast.error(errorMessage);
      setRoadmapState("idle");
      setSelectedRole(null);
    }
  };

  const togglePhase = (phaseIndex: number) => {
    setExpandedPhases((prev) =>
      prev.includes(phaseIndex) ? prev.filter((p) => p !== phaseIndex) : [...prev, phaseIndex]
    );
  };

  if (authLoading || loading) {
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
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Map className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Öğrenme Yol Haritası</h1>
            </div>
            <p className="text-muted-foreground">
              Hedef rollerinize ulaşmak için AI tarafından oluşturulan kişiselleştirilmiş öğrenme yolları
            </p>
          </motion.div>

          {roadmapState === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {targetRoles.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Hedef Rol Seçilmedi</h3>
                    <p className="text-muted-foreground mb-4">
                      Kişiselleştirilmiş öğrenme yol haritası oluşturmak için önce hedef roller ekleyin
                    </p>
                    <Button onClick={() => navigate("/dashboard/roles")}>Hedef Rol Ekle</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Hedef Rol Seçin</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {targetRoles.map((tr) => (
                      <Card
                        key={tr.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => generateRoadmap(tr)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">{tr.role.name}</h3>
                              <Badge variant="outline" className="mb-3">
                                {tr.role.category}
                              </Badge>
                              {tr.role.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {tr.role.description}
                                </p>
                              )}
                            </div>
                            {tr.fit_score !== null && (
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">{tr.fit_score}%</p>
                                <p className="text-xs text-muted-foreground">Uyum Puanı</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {roadmapState === "loading" && (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Yol Haritanız Oluşturuluyor...</h3>
                <p className="text-muted-foreground">
                  AI, becerilerinizi analiz ediyor ve {selectedRole?.role.name} için kişiselleştirilmiş öğrenme yolu oluşturuyor
                </p>
              </CardContent>
            </Card>
          )}

          {roadmapState === "ready" && roadmap && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Roadmap Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedRole?.role.name} Yol Haritası</CardTitle>
                      <CardDescription className="mt-2">{roadmap.overview}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setRoadmapState("idle")}>
                      Rol Değiştir
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{roadmap.estimatedTotalWeeks} hafta</span>
                      <span className="text-muted-foreground">toplam süre</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{roadmap.phases.length} aşama</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phases */}
              <div className="space-y-4">
                {roadmap.phases.map((phase, phaseIndex) => (
                  <Collapsible
                    key={phaseIndex}
                    open={expandedPhases.includes(phaseIndex)}
                    onOpenChange={() => togglePhase(phaseIndex)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                {phase.phase}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{phase.title}</CardTitle>
                                <CardDescription>{phase.durationWeeks} hafta</CardDescription>
                              </div>
                            </div>
                            {expandedPhases.includes(phaseIndex) ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-6 pt-0">
                          {phase.skills.map((skill, skillIndex) => (
                            <div key={skillIndex} className="p-4 rounded-lg border border-border">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-semibold">{skill.skillName}</h4>
                                  <Badge
                                    variant={
                                      skill.priority === "high"
                                        ? "destructive"
                                        : skill.priority === "medium"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {skill.priority === "high" ? "yüksek" : skill.priority === "medium" ? "orta" : "düşük"} öncelik
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {skill.currentLevel}% → {skill.targetLevel}%
                                </div>
                              </div>

                              <Progress
                                value={skill.currentLevel}
                                className="h-2 mb-4"
                              />

                              {/* Resources */}
                              <div className="mb-4">
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  Öğrenme Kaynakları
                                </h5>
                                <div className="grid gap-2">
                                  {skill.resources.slice(0, 3).map((resource, rIndex) => (
                                    <a
                                      key={rIndex}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between p-2 rounded bg-muted/50 hover:bg-muted transition-colors group"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {resource.type}
                                        </Badge>
                                        <span className="text-sm">{resource.title}</span>
                                        {resource.isFree && (
                                          <Badge variant="secondary" className="text-xs">
                                            Ücretsiz
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <span className="text-xs">{resource.estimatedHours}s</span>
                                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>

                              {/* Projects */}
                              <div className="mb-4">
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <Wrench className="w-4 h-4" />
                                  Pratik Projeleri
                                </h5>
                                <div className="grid gap-2">
                                  {skill.projects.slice(0, 2).map((project, pIndex) => (
                                    <div
                                      key={pIndex}
                                      className="p-2 rounded bg-muted/50 border border-border"
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">{project.title}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {project.difficulty === "easy" ? "kolay" : project.difficulty === "medium" ? "orta" : "zor"}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {project.description}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Milestones */}
                              <div>
                                <h5 className="text-sm font-medium mb-2">Kilometre Taşları</h5>
                                <ul className="space-y-1">
                                  {skill.milestones.map((milestone, mIndex) => (
                                    <li
                                      key={mIndex}
                                      className="text-sm text-muted-foreground flex items-center gap-2"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                      {milestone}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💡 Başarı İpuçları</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {roadmap.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary font-bold">{i + 1}.</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RoadmapPage;
