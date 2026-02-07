import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GitCompare, FileText, Github, CheckCircle, XCircle, Loader2, ArrowRight, Download } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
interface CVAnalysis {
  id: string;
  file_name: string;
  extracted_skills: { name: string; category: string; level: string }[];
  created_at: string;
}

interface GitHubAnalysis {
  id: string;
  github_username: string;
  detected_skills: { name: string; category: string; confidence: number }[];
  created_at: string;
}

interface SkillComparison {
  name: string;
  inCV: boolean;
  inGitHub: boolean;
  cvLevel?: string;
  githubConfidence?: number;
  category: string;
}

const SkillComparisonPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cvAnalyses, setCvAnalyses] = useState<CVAnalysis[]>([]);
  const [githubAnalyses, setGithubAnalyses] = useState<GitHubAnalysis[]>([]);
  const [selectedCV, setSelectedCV] = useState<CVAnalysis | null>(null);
  const [selectedGitHub, setSelectedGitHub] = useState<GitHubAnalysis | null>(null);
  const [comparison, setComparison] = useState<SkillComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [existingSkillIds, setExistingSkillIds] = useState<string[]>([]);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchExistingSkills();
    }
  }, [user]);

  const fetchExistingSkills = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_skills")
      .select("skill_id")
      .eq("user_id", user.id);
    if (data) {
      setExistingSkillIds(data.map((s) => s.skill_id));
    }
  };

  useEffect(() => {
    if (selectedCV && selectedGitHub) {
      generateComparison();
    }
  }, [selectedCV, selectedGitHub]);

  const fetchData = async () => {
    const [cvRes, ghRes] = await Promise.all([
      supabase
        .from("cv_analyses")
        .select("id, file_name, extracted_skills, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("github_analyses")
        .select("id, github_username, detected_skills, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false }),
    ]);

    if (cvRes.data) {
      const cvData = cvRes.data as unknown as CVAnalysis[];
      setCvAnalyses(cvData);
      if (cvData.length > 0) setSelectedCV(cvData[0]);
    }
    if (ghRes.data) {
      const ghData = ghRes.data as unknown as GitHubAnalysis[];
      setGithubAnalyses(ghData);
      if (ghData.length > 0) setSelectedGitHub(ghData[0]);
    }
    setLoading(false);
  };

  const generateComparison = () => {
    if (!selectedCV || !selectedGitHub) return;

    const skillMap = new Map<string, SkillComparison>();

    // Add CV skills
    selectedCV.extracted_skills.forEach((skill) => {
      const key = skill.name.toLowerCase();
      skillMap.set(key, {
        name: skill.name,
        inCV: true,
        inGitHub: false,
        cvLevel: skill.level,
        category: skill.category,
      });
    });

    // Merge GitHub skills
    selectedGitHub.detected_skills.forEach((skill) => {
      const key = skill.name.toLowerCase();
      const existing = skillMap.get(key);
      if (existing) {
        existing.inGitHub = true;
        existing.githubConfidence = skill.confidence;
      } else {
        skillMap.set(key, {
          name: skill.name,
          inCV: false,
          inGitHub: true,
          githubConfidence: skill.confidence,
          category: skill.category,
        });
      }
    });

    // Sort: both sources first, then CV only, then GitHub only
    const sorted = Array.from(skillMap.values()).sort((a, b) => {
      const aScore = (a.inCV ? 2 : 0) + (a.inGitHub ? 1 : 0);
      const bScore = (b.inCV ? 2 : 0) + (b.inGitHub ? 1 : 0);
      return bScore - aScore;
    });

    setComparison(sorted);
  };

  const importCommonSkills = async () => {
    if (!user || commonSkills.length === 0) return;
    setImporting(true);

    try {
      // Fetch all skills from database
      const { data: allSkills } = await supabase.from("skills").select("id, name");
      if (!allSkills) throw new Error("Beceriler yüklenemedi");

      const skillsToImport: { user_id: string; skill_id: string; confidence_score: number }[] = [];

      for (const skill of commonSkills) {
        // Find matching skill in database
        const matchedSkill = allSkills.find(
          (s) => s.name.toLowerCase() === skill.name.toLowerCase()
        );
        
        if (matchedSkill && !existingSkillIds.includes(matchedSkill.id)) {
          // Calculate confidence from both sources
          const cvConfidence = skill.cvLevel === "expert" ? 90 : skill.cvLevel === "advanced" ? 75 : skill.cvLevel === "intermediate" ? 55 : 35;
          const ghConfidence = skill.githubConfidence || 50;
          const avgConfidence = Math.round((cvConfidence + ghConfidence) / 2);

          skillsToImport.push({
            user_id: user.id,
            skill_id: matchedSkill.id,
            confidence_score: avgConfidence,
          });
        }
      }

      if (skillsToImport.length === 0) {
        toast.info("Tüm ortak beceriler zaten eklenmiş veya veritabanında bulunamadı");
        setImporting(false);
        return;
      }

      const { error } = await supabase.from("user_skills").insert(skillsToImport);
      if (error) throw error;

      toast.success(`${skillsToImport.length} ortak beceri başarıyla içe aktarıldı!`);
      setExistingSkillIds([...existingSkillIds, ...skillsToImport.map((s) => s.skill_id)]);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Becerileri içe aktarırken hata oluştu");
    } finally {
      setImporting(false);
    }
  };

  const commonSkills = comparison.filter((s) => s.inCV && s.inGitHub);
  const cvOnlySkills = comparison.filter((s) => s.inCV && !s.inGitHub);
  const githubOnlySkills = comparison.filter((s) => !s.inCV && s.inGitHub);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="pt-24 pb-12 px-6">
        <div className="container mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <GitCompare className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Beceri Karşılaştırması</h1>
            </div>
            <p className="text-muted-foreground">
              CV ve GitHub analizlerinden elde edilen becerileri karşılaştırın
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : cvAnalyses.length === 0 && githubAnalyses.length === 0 ? (
            <Card className="p-12 text-center">
              <GitCompare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Karşılaştırma Yapılamıyor</h3>
              <p className="text-muted-foreground mb-6">
                Karşılaştırma için önce CV veya GitHub analizi yapın
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => navigate("/dashboard/cv")}>
                  <FileText className="w-4 h-4 mr-2" />
                  CV Analizi
                </Button>
                <Button onClick={() => navigate("/dashboard/github")}>
                  <Github className="w-4 h-4 mr-2" />
                  GitHub Analizi
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Source Selection */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* CV Selection */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">CV Analizi</h3>
                  </div>
                  {cvAnalyses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      CV analizi bulunamadı.{" "}
                      <button className="text-primary underline" onClick={() => navigate("/dashboard/cv")}>
                        CV yükle
                      </button>
                    </p>
                  ) : (
                    <select
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
                      value={selectedCV?.id || ""}
                      onChange={(e) => setSelectedCV(cvAnalyses.find((c) => c.id === e.target.value) || null)}
                    >
                      {cvAnalyses.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.file_name} ({new Date(cv.created_at).toLocaleDateString("tr-TR")})
                        </option>
                      ))}
                    </select>
                  )}
                </Card>

                {/* GitHub Selection */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Github className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">GitHub Analizi</h3>
                  </div>
                  {githubAnalyses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      GitHub analizi bulunamadı.{" "}
                      <button className="text-primary underline" onClick={() => navigate("/dashboard/github")}>
                        GitHub analizi yap
                      </button>
                    </p>
                  ) : (
                    <select
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
                      value={selectedGitHub?.id || ""}
                      onChange={(e) =>
                        setSelectedGitHub(githubAnalyses.find((g) => g.id === e.target.value) || null)
                      }
                    >
                      {githubAnalyses.map((gh) => (
                        <option key={gh.id} value={gh.id}>
                          @{gh.github_username} ({new Date(gh.created_at).toLocaleDateString("tr-TR")})
                        </option>
                      ))}
                    </select>
                  )}
                </Card>
              </div>

              {/* Comparison Results */}
              {selectedCV && selectedGitHub && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 text-center border-green-500/30 bg-green-500/5">
                      <p className="text-3xl font-bold text-green-500">{commonSkills.length}</p>
                      <p className="text-sm text-muted-foreground">Ortak Beceri</p>
                    </Card>
                    <Card className="p-4 text-center border-blue-500/30 bg-blue-500/5">
                      <p className="text-3xl font-bold text-blue-500">{cvOnlySkills.length}</p>
                      <p className="text-sm text-muted-foreground">Sadece CV'de</p>
                    </Card>
                    <Card className="p-4 text-center border-purple-500/30 bg-purple-500/5">
                      <p className="text-3xl font-bold text-purple-500">{githubOnlySkills.length}</p>
                      <p className="text-sm text-muted-foreground">Sadece GitHub'da</p>
                    </Card>
                  </div>

                  {/* Common Skills */}
                  {commonSkills.length > 0 && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="w-5 h-5" />
                          Ortak Beceriler ({commonSkills.length})
                        </CardTitle>
                        <Button
                          onClick={importCommonSkills}
                          disabled={importing}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {importing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Tümünü İçe Aktar
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {commonSkills.map((skill, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30"
                            >
                              <span className="font-medium">{skill.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {skill.category}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* CV Only Skills */}
                  {cvOnlySkills.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-500">
                          <FileText className="w-5 h-5" />
                          Sadece CV'de Bulunanlar ({cvOnlySkills.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Bu beceriler CV'nizde belirtilmiş ama GitHub'da görülmüyor. GitHub'a projeler ekleyerek
                          kanıtlayabilirsiniz.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {cvOnlySkills.map((skill, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30"
                            >
                              <span className="font-medium">{skill.name}</span>
                              {skill.cvLevel && (
                                <Badge variant="secondary" className="text-xs">
                                  {skill.cvLevel}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* GitHub Only Skills */}
                  {githubOnlySkills.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-500">
                          <Github className="w-5 h-5" />
                          Sadece GitHub'da Bulunanlar ({githubOnlySkills.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Bu beceriler GitHub projelerinizden tespit edildi ama CV'nizde yok. CV'nize eklemeyi
                          düşünebilirsiniz.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {githubOnlySkills.map((skill, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30"
                            >
                              <span className="font-medium">{skill.name}</span>
                              {skill.githubConfidence && (
                                <Badge variant="secondary" className="text-xs">
                                  %{skill.githubConfidence}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SkillComparisonPage;
