import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Upload, FileText, CheckCircle, AlertTriangle, TrendingUp, Loader2, Trash2, Download,
  Target, Briefcase, GraduationCap, DollarSign, Search, Zap, Clock, Calendar, FileDown,
  Linkedin, Users, GitCompare, RefreshCw
} from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import { importSkillsFromCV } from "@/lib/import-skills";
import { exportCVAnalysisToPDF } from "@/lib/pdf-export";

interface ATSAnalysis {
  compatibility_score: number;
  keyword_density: string;
  format_issues: string[];
  recommendations: string[];
}

interface CareerInsights {
  suitable_positions: string[];
  career_paths: string[];
  salary_range_turkey: {
    min: number;
    max: number;
    currency: string;
  };
  market_demand: string;
}

interface ExperienceAnalysis {
  summary: string;
  total_years: number;
  career_progression: string;
  notable_achievements: string[];
  industry_experience: string[];
}

interface EducationAnalysis {
  summary: string;
  highest_degree: string;
  certifications: string[];
  continuous_learning: string;
}

interface DetailedSuggestion {
  priority: "high" | "medium" | "low";
  timeframe: "immediate" | "short-term" | "long-term";
  action: string;
}

interface CVAnalysis {
  id: string;
  file_name: string;
  overall_score: number;
  experience_score: number;
  education_score: number;
  skills_score: number;
  format_score: number;
  language_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  extracted_skills: { name: string; category: string; level: string }[];
  created_at: string;
  // New detailed fields
  ats_analysis?: ATSAnalysis;
  career_insights?: CareerInsights;
  experience_analysis?: ExperienceAnalysis;
  education_analysis?: EducationAnalysis;
  detailed_suggestions?: DetailedSuggestion[];
}

interface LinkedInProfile {
  full_name: string;
  headline: string;
  summary: string;
  profile_pic_url: string;
  public_identifier: string;
  skills: string[];
  experiences: { title: string; company: string; duration: string; description: string }[];
  education: { school: string; degree: string; field: string; dates: string }[];
  certifications: { name: string; authority: string }[];
  languages: string[];
  location: string;
}

interface LinkedInComparison {
  cv_only_skills: string[];
  linkedin_only_skills: string[];
  common_skills: string[];
  title_mismatch: boolean;
  experience_gaps: string[];
  recommendations: string[];
  linkedinProfile?: LinkedInProfile;
  isDemo?: boolean;
}

const CVAnalysisPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<CVAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importingLinkedin, setImportingLinkedin] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CVAnalysis | null>(null);
  const [userSkillIds, setUserSkillIds] = useState<string[]>([]);
  
  // LinkedIn comparison state
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinAnalyzing, setLinkedinAnalyzing] = useState(false);
  const [linkedinComparison, setLinkedinComparison] = useState<LinkedInComparison | null>(null);

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
      .from("cv_analyses")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAnalyses(data as unknown as CVAnalysis[]);
      if (data.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(data[0] as unknown as CVAnalysis);
      }
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const isPDF = file.name.toLowerCase().endsWith('.pdf');
    const isText = file.name.endsWith('.txt') || file.name.endsWith('.md');

    if (!isPDF && !isText) {
      toast.error("Lütfen .pdf, .txt veya .md dosyası yükleyin");
      return;
    }

    setAnalyzing(true);
    toast.info("CV analiz ediliyor...");

    try {
      let text: string;

      if (isPDF) {
        try {
          toast.info("PDF işleniyor... (Görsel PDF'lerde OCR uygulanıyor)");
          text = await extractTextFromPDF(file);
          if (!text || text.trim().length < 50) {
            throw new Error("PDF'den yeterli metin çıkarılamadı. Lütfen daha net bir CV yükleyin.");
          }
        } catch (pdfError: any) {
          console.error("PDF parsing error:", pdfError);
          const errorMsg = pdfError?.message || "PDF okunamadı";
          toast.error(errorMsg);
          setAnalyzing(false);
          return;
        }
      } else {
        text = await file.text();
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-cv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ cvText: text, fileName: file.name }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Analiz başarısız");
      }

      const { analysis, fileName } = await response.json();

      // Save to database with new fields
      const { data, error } = await supabase.from("cv_analyses").insert({
        user_id: user?.id,
        file_name: fileName,
        overall_score: analysis.overall_score,
        experience_score: analysis.experience_score,
        education_score: analysis.education_score,
        skills_score: analysis.skills_score,
        format_score: analysis.format_score,
        language_score: analysis.language_score,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestions: analysis.suggestions,
        extracted_skills: analysis.extracted_skills,
      }).select().single();

      if (error) throw error;

      // Merge with detailed analysis data (kept in memory, not stored)
      const fullAnalysis: CVAnalysis = {
        ...(data as unknown as CVAnalysis),
        ats_analysis: analysis.ats_analysis,
        career_insights: analysis.career_insights,
        experience_analysis: analysis.experience_analysis,
        education_analysis: analysis.education_analysis,
        detailed_suggestions: analysis.detailed_suggestions,
      };

      toast.success("CV başarıyla analiz edildi!");
      fetchAnalyses();
      setSelectedAnalysis(fullAnalysis);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Analiz sırasında hata oluştu");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cv_analyses").delete().eq("id", id);
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

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-skill-high";
    if (score >= 50) return "bg-skill-medium";
    return "bg-skill-low";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "medium": return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "low": return "bg-green-500/10 text-green-600 border-green-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe) {
      case "immediate": return <Zap className="w-3 h-3" />;
      case "short-term": return <Clock className="w-3 h-3" />;
      case "long-term": return <Calendar className="w-3 h-3" />;
      default: return null;
    }
  };

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
  };

  // LinkedIn comparison function - uses real API when available
  const compareWithLinkedIn = async () => {
    if (!selectedAnalysis || !linkedinUrl.trim()) {
      toast.error("CV analizi seçin ve LinkedIn URL'si girin");
      return;
    }

    setLinkedinAnalyzing(true);
    
    try {
      // Call the edge function to fetch LinkedIn data
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-linkedin-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ linkedinUrl: linkedinUrl.trim() }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "LinkedIn profili alınamadı");
      }

      const linkedinProfile: LinkedInProfile = data.profile;
      const isDemo = data.source === 'mock_data';

      if (isDemo) {
        toast.info("Demo verisi kullanılıyor. Gerçek LinkedIn verisi için PROXYCURL_API_KEY ekleyin.");
      }

      // Compare skills
      const cvSkills = selectedAnalysis.extracted_skills.map(s => s.name.toLowerCase());
      const linkedinSkills = linkedinProfile.skills.map(s => s.toLowerCase());

      const cvSkillsSet = new Set(cvSkills);
      const linkedinSkillsSet = new Set(linkedinSkills);

      const common_skills = cvSkills.filter(s => linkedinSkillsSet.has(s));
      const cv_only_skills = cvSkills.filter(s => !linkedinSkillsSet.has(s));
      const linkedin_only_skills = linkedinSkills.filter(s => !cvSkillsSet.has(s));

      const comparison: LinkedInComparison = {
        common_skills,
        cv_only_skills,
        linkedin_only_skills,
        title_mismatch: false, // Could compare with CV job title
        experience_gaps: cv_only_skills.length > 3 
          ? ["CV'de LinkedIn'de bulunmayan beceriler var - bunları LinkedIn'e ekleyin"]
          : [],
        recommendations: [
          linkedin_only_skills.length > 0 
            ? `LinkedIn'deki şu becerileri CV'nize ekleyin: ${linkedin_only_skills.slice(0, 3).join(", ")}`
            : "Tüm becerileriniz tutarlı",
          cv_only_skills.length > 0
            ? `CV'nizdeki şu becerileri LinkedIn'e ekleyin: ${cv_only_skills.slice(0, 3).join(", ")}`
            : "LinkedIn profiliniz güncel",
          "Profesyonel başlığınızın her iki platformda da tutarlı olduğundan emin olun",
        ],
        linkedinProfile,
        isDemo,
      };

      setLinkedinComparison(comparison);
      toast.success("LinkedIn karşılaştırması tamamlandı");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "LinkedIn karşılaştırması başarısız");
    } finally {
      setLinkedinAnalyzing(false);
    }
  };

  // Import LinkedIn skills to user profile
  const importLinkedInSkills = async () => {
    if (!user || !linkedinComparison?.linkedin_only_skills.length) return;
    
    setImportingLinkedin(true);
    try {
      const skillsToImport = linkedinComparison.linkedin_only_skills.map(s => ({
        name: s,
        category: 'LinkedIn',
        confidence: 60,
      }));

      const result = await importSkillsFromCV(
        user.id,
        skillsToImport,
        [...userSkillIds]
      );

      if (result.imported > 0) {
        toast.success(`${result.imported} LinkedIn becerisi içe aktarıldı`);
        fetchUserSkillIds();
      }
      if (result.skipped > 0) {
        toast.info(`${result.skipped} beceri zaten mevcut veya eşleşmedi`);
      }
    } catch (err) {
      toast.error("Becerileri içe aktarırken hata oluştu");
    }
    setImportingLinkedin(false);
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
            <h1 className="text-3xl font-bold text-foreground mb-2">CV Analizi</h1>
            <p className="text-muted-foreground">CV'nizi yükleyin, AI ile detaylı analiz alın</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Upload & History */}
            <div className="space-y-6">
              {/* Upload */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  CV Yükle
                </h3>
                <label className="block">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                    {analyzing ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-muted-foreground">Analiz ediliyor...</span>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-2">CV dosyanızı sürükleyin veya tıklayın</p>
                        <p className="text-xs text-muted-foreground">.pdf, .txt, .md destekleniyor</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.md" disabled={analyzing} />
                </label>
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
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {analyses.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => setSelectedAnalysis(a)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedAnalysis?.id === a.id ? "bg-primary/10 border border-primary/30" : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm truncate">{a.file_name}</span>
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
                <Card className="overflow-hidden">
                  {/* Header with Overall Score */}
                  <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{selectedAnalysis.file_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedAnalysis.created_at).toLocaleDateString("tr-TR", { 
                            year: 'numeric', month: 'long', day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            exportCVAnalysisToPDF(selectedAnalysis);
                            toast.success("PDF raporu indiriliyor...");
                          }}
                          className="gap-2"
                        >
                          <FileDown className="w-4 h-4" />
                          PDF İndir
                        </Button>
                        <div className="text-right">
                          <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 transform -rotate-90">
                              <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted/30" />
                              <circle 
                                cx="40" cy="40" r="35" 
                                stroke="currentColor" 
                                strokeWidth="6" 
                                fill="none" 
                                strokeDasharray={`${selectedAnalysis.overall_score * 2.2} 220`}
                                className={getScoreColor(selectedAnalysis.overall_score)}
                              />
                            </svg>
                            <span className={`absolute inset-0 flex items-center justify-center font-mono text-2xl font-bold ${getScoreColor(selectedAnalysis.overall_score)}`}>
                              {selectedAnalysis.overall_score}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Genel Puan</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-5 mb-6">
                        <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                        <TabsTrigger value="ats">ATS Analizi</TabsTrigger>
                        <TabsTrigger value="career">Kariyer</TabsTrigger>
                        <TabsTrigger value="skills">Beceriler</TabsTrigger>
                        <TabsTrigger value="linkedin" className="gap-1">
                          <Linkedin className="w-3 h-3" />
                          LinkedIn
                        </TabsTrigger>
                      </TabsList>

                      {/* Overview Tab */}
                      <TabsContent value="overview" className="space-y-6">
                        {/* Score Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {[
                            { label: "Deneyim", score: selectedAnalysis.experience_score, icon: Briefcase },
                            { label: "Eğitim", score: selectedAnalysis.education_score, icon: GraduationCap },
                            { label: "Beceri", score: selectedAnalysis.skills_score, icon: Target },
                            { label: "Format", score: selectedAnalysis.format_score, icon: FileText },
                            { label: "Dil", score: selectedAnalysis.language_score, icon: Search },
                          ].map((item) => (
                            <div key={item.label} className="text-center p-4 rounded-lg bg-muted/50 space-y-2">
                              <item.icon className="w-5 h-5 mx-auto text-muted-foreground" />
                              <p className={`font-mono text-xl font-bold ${getScoreColor(item.score)}`}>{item.score}</p>
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                              <Progress value={item.score} className="h-1" />
                            </div>
                          ))}
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-skill-high" />
                              Güçlü Yönler
                            </h4>
                            <div className="space-y-2">
                              {selectedAnalysis.strengths.slice(0, 5).map((s, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 rounded bg-skill-high/5 border border-skill-high/20">
                                  <CheckCircle className="w-4 h-4 text-skill-high mt-0.5 shrink-0" />
                                  <span className="text-sm">{s}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-skill-low" />
                              Geliştirilmesi Gereken Alanlar
                            </h4>
                            <div className="space-y-2">
                              {selectedAnalysis.weaknesses.slice(0, 5).map((w, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 rounded bg-skill-low/5 border border-skill-low/20">
                                  <AlertTriangle className="w-4 h-4 text-skill-low mt-0.5 shrink-0" />
                                  <span className="text-sm">{w}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Suggestions */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Öneriler
                          </h4>
                          {selectedAnalysis.detailed_suggestions ? (
                            <div className="grid gap-2">
                              {selectedAnalysis.detailed_suggestions.map((s, i) => (
                                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${getPriorityColor(s.priority)}`}>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {getTimeframeIcon(s.timeframe)}
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {s.priority === 'high' ? 'Yüksek' : s.priority === 'medium' ? 'Orta' : 'Düşük'}
                                    </Badge>
                                  </div>
                                  <span className="text-sm">{s.action}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {selectedAnalysis.suggestions.map((s, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 rounded bg-primary/5 border border-primary/20">
                                  <span className="text-primary font-bold text-sm">{i + 1}.</span>
                                  <span className="text-sm">{s}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* ATS Analysis Tab */}
                      <TabsContent value="ats" className="space-y-6">
                        {selectedAnalysis.ats_analysis ? (
                          <>
                            {/* ATS Score */}
                            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-transparent">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-lg mb-1">ATS Uyumluluk Puanı</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Başvuru Takip Sistemi uyumluluğu
                                  </p>
                                </div>
                                <div className="text-center">
                                  <span className={`font-mono text-4xl font-bold ${getScoreColor(selectedAnalysis.ats_analysis.compatibility_score)}`}>
                                    {selectedAnalysis.ats_analysis.compatibility_score}
                                  </span>
                                  <p className="text-xs text-muted-foreground">/100</p>
                                </div>
                              </div>
                              <Progress value={selectedAnalysis.ats_analysis.compatibility_score} className="mt-4 h-2" />
                            </Card>

                            {/* Keyword Density */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <Card className="p-4">
                                <h5 className="font-medium mb-2">Anahtar Kelime Yoğunluğu</h5>
                                <Badge className={selectedAnalysis.ats_analysis.keyword_density === 'yeterli' ? 'bg-skill-high' : 'bg-skill-low'}>
                                  {selectedAnalysis.ats_analysis.keyword_density}
                                </Badge>
                              </Card>

                              <Card className="p-4">
                                <h5 className="font-medium mb-2">Format Sorunları</h5>
                                {selectedAnalysis.ats_analysis.format_issues.length > 0 ? (
                                  <ul className="text-sm space-y-1">
                                    {selectedAnalysis.ats_analysis.format_issues.map((issue, i) => (
                                      <li key={i} className="flex items-center gap-2 text-skill-low">
                                        <AlertTriangle className="w-3 h-3" />
                                        {issue}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-skill-high flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Format sorunsuz
                                  </p>
                                )}
                              </Card>
                            </div>

                            {/* ATS Recommendations */}
                            <div>
                              <h5 className="font-semibold mb-3">ATS Önerileri</h5>
                              <div className="space-y-2">
                                {selectedAnalysis.ats_analysis.recommendations.map((rec, i) => (
                                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                    <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                    <span className="text-sm">{rec}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>ATS analizi için yeni bir CV yükleyin</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* Career Tab */}
                      <TabsContent value="career" className="space-y-6">
                        {selectedAnalysis.career_insights ? (
                          <>
                            {/* Salary Range */}
                            <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-transparent">
                              <div className="flex items-center gap-3 mb-4">
                                <DollarSign className="w-6 h-6 text-emerald-500" />
                                <h4 className="font-semibold text-lg">Tahmini Maaş Aralığı</h4>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">Asgari</p>
                                  <p className="text-xl font-bold text-emerald-600">
                                    {formatSalary(selectedAnalysis.career_insights.salary_range_turkey.min)}
                                  </p>
                                </div>
                                <div className="flex-1 mx-4">
                                  <div className="h-2 bg-gradient-to-r from-emerald-300 to-emerald-600 rounded-full" />
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">Azami</p>
                                  <p className="text-xl font-bold text-emerald-600">
                                    {formatSalary(selectedAnalysis.career_insights.salary_range_turkey.max)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 flex items-center justify-center gap-2">
                                <Badge variant="outline">Piyasa Talebi:</Badge>
                                <Badge className={
                                  selectedAnalysis.career_insights.market_demand === 'yüksek' ? 'bg-skill-high' :
                                  selectedAnalysis.career_insights.market_demand === 'orta' ? 'bg-skill-medium' : 'bg-skill-low'
                                }>
                                  {selectedAnalysis.career_insights.market_demand}
                                </Badge>
                              </div>
                            </Card>

                            {/* Suitable Positions & Career Paths */}
                            <div className="grid md:grid-cols-2 gap-6">
                              <Card className="p-4">
                                <h5 className="font-semibold mb-3 flex items-center gap-2">
                                  <Briefcase className="w-4 h-4 text-primary" />
                                  Uygun Pozisyonlar
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {selectedAnalysis.career_insights.suitable_positions.map((pos, i) => (
                                    <Badge key={i} variant="secondary">{pos}</Badge>
                                  ))}
                                </div>
                              </Card>

                              <Card className="p-4">
                                <h5 className="font-semibold mb-3 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-primary" />
                                  Kariyer Yolları
                                </h5>
                                <div className="space-y-2">
                                  {selectedAnalysis.career_insights.career_paths.map((path, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                        {i + 1}
                                      </span>
                                      {path}
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            </div>

                            {/* Experience Analysis */}
                            {selectedAnalysis.experience_analysis && (
                              <Card className="p-4">
                                <h5 className="font-semibold mb-3">Deneyim Analizi</h5>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="text-lg px-4 py-2">
                                      {selectedAnalysis.experience_analysis.total_years} Yıl
                                    </Badge>
                                    <p className="text-sm text-muted-foreground">Toplam deneyim</p>
                                  </div>
                                  <p className="text-sm">{selectedAnalysis.experience_analysis.summary}</p>
                                  <Separator />
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-2">Kariyer İlerlemesi</p>
                                    <p className="text-sm">{selectedAnalysis.experience_analysis.career_progression}</p>
                                  </div>
                                  {selectedAnalysis.experience_analysis.notable_achievements.length > 0 && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-2">Öne Çıkan Başarılar</p>
                                      <ul className="text-sm space-y-1">
                                        {selectedAnalysis.experience_analysis.notable_achievements.map((a, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-skill-high mt-0.5 shrink-0" />
                                            {a}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Kariyer öngörüleri için yeni bir CV yükleyin</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* Skills Tab */}
                      <TabsContent value="skills" className="space-y-6">
                        {/* Import Button */}
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Tespit Edilen Beceriler</h4>
                          <Button
                            size="sm"
                            onClick={async () => {
                              if (!user || !selectedAnalysis) return;
                              setImporting(true);
                              try {
                                const result = await importSkillsFromCV(
                                  user.id,
                                  selectedAnalysis.extracted_skills,
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
                            disabled={importing || selectedAnalysis.extracted_skills.length === 0}
                          >
                            {importing ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            Becerileri İçe Aktar
                          </Button>
                        </div>

                        {/* Skills by Category */}
                        {(() => {
                          const skillsByCategory = selectedAnalysis.extracted_skills.reduce((acc, skill) => {
                            if (!acc[skill.category]) acc[skill.category] = [];
                            acc[skill.category].push(skill);
                            return acc;
                          }, {} as Record<string, typeof selectedAnalysis.extracted_skills>);

                          return Object.entries(skillsByCategory).map(([category, skills]) => (
                            <Card key={category} className="p-4">
                              <h5 className="font-medium mb-3 text-sm text-muted-foreground">{category}</h5>
                              <div className="flex flex-wrap gap-2">
                                {skills.map((skill, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className={
                                      skill.level === "advanced"
                                        ? "bg-skill-high/10 text-skill-high border-skill-high/30"
                                        : skill.level === "intermediate"
                                        ? "bg-skill-medium/10 text-skill-medium border-skill-medium/30"
                                        : "bg-muted text-muted-foreground border-border"
                                    }
                                  >
                                    {skill.name}
                                    <span className="ml-1 text-xs opacity-60">
                                      ({skill.level === 'advanced' ? 'İleri' : skill.level === 'intermediate' ? 'Orta' : 'Başlangıç'})
                                    </span>
                                  </Badge>
                                ))}
                              </div>
                            </Card>
                          ));
                        })()}

                        {selectedAnalysis.extracted_skills.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground">
                            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Beceri tespit edilemedi</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* LinkedIn Comparison Tab */}
                      <TabsContent value="linkedin" className="space-y-6">
                        <Card className="p-6 bg-gradient-to-br from-blue-600/10 to-transparent">
                          <div className="flex items-center gap-3 mb-4">
                            <Linkedin className="w-6 h-6 text-blue-600" />
                            <h4 className="font-semibold text-lg">LinkedIn Profil Karşılaştırması</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            CV'nizle LinkedIn profiliniz arasındaki tutarsızlıkları tespit edin ve her iki platformda tutarlı bir profesyonel imaj oluşturun.
                          </p>
                          
                          <div className="flex gap-2">
                            <Input 
                              placeholder="LinkedIn profil URL'nizi girin..."
                              value={linkedinUrl}
                              onChange={(e) => setLinkedinUrl(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              onClick={compareWithLinkedIn}
                              disabled={linkedinAnalyzing || !linkedinUrl.trim()}
                              className="gap-2"
                            >
                              {linkedinAnalyzing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <GitCompare className="w-4 h-4" />
                              )}
                              Karşılaştır
                            </Button>
                          </div>
                        </Card>

                        {linkedinComparison && (
                          <>
                            {/* Demo Warning */}
                            {linkedinComparison.isDemo && (
                              <Card className="p-4 bg-amber-500/10 border-amber-500/30">
                                <p className="text-sm text-amber-600 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Demo verisi kullanılıyor. Gerçek LinkedIn verisi için yöneticinizden PROXYCURL_API_KEY eklemesini isteyin.
                                </p>
                              </Card>
                            )}

                            {/* LinkedIn Profile Card */}
                            {linkedinComparison.linkedinProfile && (
                              <Card className="p-4">
                                <div className="flex items-center gap-4">
                                  <img 
                                    src={linkedinComparison.linkedinProfile.profile_pic_url} 
                                    alt="" 
                                    className="w-16 h-16 rounded-full"
                                  />
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{linkedinComparison.linkedinProfile.full_name}</h4>
                                    <p className="text-sm text-muted-foreground">{linkedinComparison.linkedinProfile.headline}</p>
                                    {linkedinComparison.linkedinProfile.location && (
                                      <p className="text-xs text-muted-foreground mt-1">{linkedinComparison.linkedinProfile.location}</p>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            )}

                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4">
                              <Card className="p-4 text-center bg-skill-high/5 border-skill-high/20">
                                <Users className="w-6 h-6 mx-auto mb-2 text-skill-high" />
                                <p className="text-2xl font-bold text-skill-high">{linkedinComparison.common_skills.length}</p>
                                <p className="text-xs text-muted-foreground">Ortak Beceri</p>
                              </Card>
                              <Card className="p-4 text-center bg-amber-500/5 border-amber-500/20">
                                <FileText className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                                <p className="text-2xl font-bold text-amber-600">{linkedinComparison.cv_only_skills.length}</p>
                                <p className="text-xs text-muted-foreground">Sadece CV'de</p>
                              </Card>
                              <Card className="p-4 text-center bg-blue-500/5 border-blue-500/20">
                                <Linkedin className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                                <p className="text-2xl font-bold text-blue-600">{linkedinComparison.linkedin_only_skills.length}</p>
                                <p className="text-xs text-muted-foreground">Sadece LinkedIn'de</p>
                              </Card>
                            </div>

                            {/* Skills Comparison */}
                            <div className="grid md:grid-cols-2 gap-6">
                              {linkedinComparison.cv_only_skills.length > 0 && (
                                <Card className="p-4">
                                  <h5 className="font-medium mb-3 flex items-center gap-2 text-amber-600">
                                    <FileText className="w-4 h-4" />
                                    Sadece CV'de Bulunanlar
                                  </h5>
                                  <p className="text-xs text-muted-foreground mb-3">
                                    Bu becerileri LinkedIn profilinize ekleyin
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {linkedinComparison.cv_only_skills.map((skill, i) => (
                                      <Badge key={i} variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 capitalize">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </Card>
                              )}

                              {linkedinComparison.linkedin_only_skills.length > 0 && (
                                <Card className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium flex items-center gap-2 text-blue-600">
                                      <Linkedin className="w-4 h-4" />
                                      Sadece LinkedIn'de Bulunanlar
                                    </h5>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={importLinkedInSkills}
                                      disabled={importingLinkedin}
                                      className="gap-1 text-xs"
                                    >
                                      {importingLinkedin ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Download className="w-3 h-3" />
                                      )}
                                      İçe Aktar
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-3">
                                    Bu becerileri "Becerilerim" bölümüne ekleyin
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {linkedinComparison.linkedin_only_skills.map((skill, i) => (
                                      <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 capitalize">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </Card>
                              )}
                            </div>

                            {/* Recommendations */}
                            <Card className="p-4">
                              <h5 className="font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Öneriler
                              </h5>
                              <div className="space-y-2">
                                {linkedinComparison.recommendations.map((rec, i) => (
                                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                    <span className="text-sm">{rec}</span>
                                  </div>
                                ))}
                              </div>
                            </Card>

                            {/* Reset Button */}
                            <div className="flex justify-center">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setLinkedinComparison(null);
                                  setLinkedinUrl("");
                                }}
                                className="gap-2"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Yeni Karşılaştırma
                              </Button>
                            </div>
                          </>
                        )}

                        {!linkedinComparison && (
                          <div className="text-center py-12 text-muted-foreground">
                            <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>LinkedIn URL'nizi girin ve karşılaştır butonuna tıklayın</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">CV Yükleyin</h3>
                  <p className="text-muted-foreground">CV'nizi yükleyerek AI destekli detaylı analiz alın</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CVAnalysisPage;
