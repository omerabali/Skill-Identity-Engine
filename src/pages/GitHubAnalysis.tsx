import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Github, Search, Star, GitFork, Users, Code, Loader2, Trash2, ExternalLink, Download } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { importSkillsFromGitHub } from "@/lib/import-skills";

interface GitHubAnalysis {
  id: string;
  github_username: string;
  avatar_url: string;
  profile_url: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  overall_score: number;
  activity_score: number;
  diversity_score: number;
  contribution_score: number;
  languages: Record<string, number>;
  top_repos: { name: string; description: string; language: string; stars: number; forks: number; url: string }[];
  detected_skills: { name: string; category: string; confidence: number }[];
  strengths: string[];
  suggestions: string[];
  created_at: string;
}

const GitHubAnalysis = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<GitHubAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<GitHubAnalysis | null>(null);
  const [userSkillIds, setUserSkillIds] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
      fetchUserSkillIds();
    }
  }, [user]);

  const fetchUserSkillIds = async () => {
    const { data } = await supabase
      .from("user_skills")
      .select("skill_id")
      .eq("user_id", user?.id);
    if (data) {
      setUserSkillIds(data.map(s => s.skill_id));
    }
  };

  const fetchAnalyses = async () => {
    const { data, error } = await supabase
      .from("github_analyses")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAnalyses(data as unknown as GitHubAnalysis[]);
      if (data.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(data[0] as unknown as GitHubAnalysis);
      }
    }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!username.trim()) {
      toast.error("Kullanıcı adı girin");
      return;
    }

    setAnalyzing(true);
    toast.info("GitHub profili analiz ediliyor...");

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-github`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Analiz başarısız");
      }

      const { analysis } = await response.json();

      // Save to database
      const { data, error } = await supabase.from("github_analyses").insert({
        user_id: user?.id,
        github_username: analysis.github_username,
        avatar_url: analysis.avatar_url,
        profile_url: analysis.profile_url,
        bio: analysis.bio,
        public_repos: analysis.public_repos,
        followers: analysis.followers,
        following: analysis.following,
        overall_score: analysis.overall_score,
        activity_score: analysis.activity_score,
        diversity_score: analysis.diversity_score,
        contribution_score: analysis.contribution_score,
        languages: analysis.languages,
        top_repos: analysis.top_repos,
        detected_skills: analysis.detected_skills,
        strengths: analysis.strengths,
        suggestions: analysis.suggestions,
      }).select().single();

      if (error) throw error;

      toast.success("GitHub profili başarıyla analiz edildi!");
      setUsername("");
      fetchAnalyses();
      setSelectedAnalysis(data as unknown as GitHubAnalysis);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Analiz sırasında hata oluştu");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("github_analyses").delete().eq("id", id);
    if (!error) {
      toast.success("Analiz silindi");
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null);
      }
      fetchAnalyses();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-skill-high";
    if (score >= 50) return "text-skill-medium";
    return "text-skill-low";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-skill-high";
    if (score >= 50) return "bg-skill-medium";
    return "bg-skill-low";
  };

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
            <h1 className="text-3xl font-bold text-foreground mb-2">GitHub Analizi</h1>
            <p className="text-muted-foreground">GitHub profilinizi analiz edin, becerilerinizi keşfedin</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Search & History */}
            <div className="space-y-6">
              {/* Search */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Github className="w-5 h-5 text-primary" />
                  Profil Ara
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="GitHub kullanıcı adı"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    disabled={analyzing}
                  />
                  <Button onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </Card>

              {/* History */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Geçmiş Analizler</h3>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : analyses.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Henüz analiz yok</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {analyses.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => setSelectedAnalysis(a)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedAnalysis?.id === a.id ? "bg-primary/10 border border-primary/30" : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <img src={a.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                          <span className="text-sm truncate">@{a.github_username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-sm font-bold ${getScoreColor(a.overall_score)}`}>
                            {a.overall_score}
                          </span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}>
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Analysis Results */}
            <div className="lg:col-span-2">
              {selectedAnalysis ? (
                <Card className="p-6 space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-start gap-4">
                    <img src={selectedAnalysis.avatar_url} alt="" className="w-20 h-20 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">@{selectedAnalysis.github_username}</h3>
                        <a href={selectedAnalysis.profile_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </a>
                      </div>
                      {selectedAnalysis.bio && <p className="text-muted-foreground text-sm mb-2">{selectedAnalysis.bio}</p>}
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1"><Code className="w-4 h-4" /> {selectedAnalysis.public_repos} repo</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {selectedAnalysis.followers} takipçi</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-4xl font-bold ${getScoreColor(selectedAnalysis.overall_score)}`}>
                        {selectedAnalysis.overall_score}
                      </span>
                      <p className="text-sm text-muted-foreground">Genel Puan</p>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Aktivite", score: selectedAnalysis.activity_score },
                      { label: "Çeşitlilik", score: selectedAnalysis.diversity_score },
                      { label: "Katkı", score: selectedAnalysis.contribution_score },
                    ].map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className={`font-mono font-bold ${getScoreColor(item.score)}`}>{item.score}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${getProgressColor(item.score)}`} style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Languages */}
                  <div>
                    <h4 className="font-semibold mb-3">Programlama Dilleri</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedAnalysis.languages)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([lang, count]) => (
                          <span key={lang} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm border border-primary/20">
                            {lang} ({count})
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Top Repos */}
                  <div>
                    <h4 className="font-semibold mb-3">En İyi Repolar</h4>
                    <div className="space-y-2">
                      {selectedAnalysis.top_repos.map((repo, i) => (
                        <a
                          key={i}
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{repo.name}</p>
                            {repo.description && <p className="text-sm text-muted-foreground truncate">{repo.description}</p>}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {repo.language && <span>{repo.language}</span>}
                            <span className="flex items-center gap-1"><Star className="w-4 h-4" /> {repo.stars}</span>
                            <span className="flex items-center gap-1"><GitFork className="w-4 h-4" /> {repo.forks}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Detected Skills */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Tespit Edilen Beceriler</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!user || !selectedAnalysis) return;
                          setImporting(true);
                          try {
                            const result = await importSkillsFromGitHub(
                              user.id,
                              selectedAnalysis.detected_skills,
                              [...userSkillIds]
                            );
                            if (result.imported > 0) {
                              toast.success(`${result.imported} beceri içe aktarıldı`);
                              fetchUserSkillIds();
                            }
                            if (result.skipped > 0) {
                              toast.info(`${result.skipped} beceri zaten mevcut veya eşleşmedi`);
                            }
                            if (result.errors.length > 0) {
                              toast.error(`Hatalar: ${result.errors.slice(0, 2).join(', ')}`);
                            }
                          } catch (err) {
                            toast.error("Becerileri içe aktarırken hata oluştu");
                          }
                          setImporting(false);
                        }}
                        disabled={importing || selectedAnalysis.detected_skills.length === 0}
                      >
                        {importing ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Becerileri İçe Aktar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnalysis.detected_skills.map((skill, i) => (
                        <span
                          key={i}
                          className={`px-3 py-1 rounded-full text-sm border ${
                            skill.confidence >= 80
                              ? "bg-skill-high/10 text-skill-high border-skill-high/30"
                              : skill.confidence >= 50
                              ? "bg-skill-medium/10 text-skill-medium border-skill-medium/30"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Suggestions */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-skill-high">Güçlü Yönler</h4>
                      <ul className="space-y-1">
                        {selectedAnalysis.strengths.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-skill-high">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-primary">Öneriler</h4>
                      <ul className="space-y-1">
                        {selectedAnalysis.suggestions.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <Github className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">GitHub Profilini Analiz Et</h3>
                  <p className="text-muted-foreground">Kullanıcı adı girerek profilini inceleyin</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GitHubAnalysis;
