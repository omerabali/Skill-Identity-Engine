import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Code2, Play, CheckCircle2, XCircle, Loader2, Lightbulb, RotateCcw } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserSkill {
  id: string;
  skill_id: string;
  confidence_score: number;
  skill: {
    id: string;
    name: string;
    category: string;
  };
}

interface Challenge {
  title: string;
  description: string;
  difficulty: string;
  starterCode: string;
  testCases: { input: string; expectedOutput: string; description: string }[];
  hints: string[];
  solution: string;
}

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  description: string;
}

const Challenges = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [challengeState, setChallengeState] = useState<"idle" | "loading" | "active" | "completed">("idle");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

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
        skill_id,
        confidence_score,
        skill:skills(id, name, category)
      `)
      .eq("user_id", user?.id)
      .order("confidence_score", { ascending: false });

    if (!error && data) {
      setSkills(data as unknown as UserSkill[]);
    }
    setLoading(false);
  };

  const generateChallenge = async () => {
    if (!selectedSkill) {
      toast.error("Lütfen önce bir beceri seçin");
      return;
    }

    const skill = skills.find((s) => s.skill_id === selectedSkill);
    if (!skill) return;

    setChallengeState("loading");
    setTestResults([]);
    setShowHints(false);
    setHintsRevealed(0);

    try {
      const { data, error } = await supabase.functions.invoke("generate-challenge", {
        body: { skillName: skill.skill.name, difficulty },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setChallenge(data.challenge);
      setCode(data.challenge.starterCode);
      setChallengeState("active");
      setStartTime(Date.now());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Görev oluşturulamadı";
      toast.error(errorMessage);
      setChallengeState("idle");
    }
  };

  const runTests = async () => {
    if (!challenge) return;
    setIsRunning(true);
    setTestResults([]);

    const results: TestResult[] = [];

    for (const testCase of challenge.testCases) {
      try {
        // Create a safe execution environment
        const wrappedCode = `
          ${code}
          return solution(${testCase.input});
        `;
        
        // eslint-disable-next-line no-new-func
        const fn = new Function(wrappedCode);
        const actual = JSON.stringify(fn());
        const expected = testCase.expectedOutput;
        
        results.push({
          passed: actual === expected,
          input: testCase.input,
          expected,
          actual,
          description: testCase.description,
        });
      } catch (err: unknown) {
        results.push({
          passed: false,
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: err instanceof Error ? `Hata: ${err.message}` : "Çalışma Hatası",
          description: testCase.description,
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);

    const passedCount = results.filter((r) => r.passed).length;
    if (passedCount === results.length) {
      toast.success("Tüm testler geçti! 🎉");
      await saveAttempt(passedCount, results.length, true);
      setChallengeState("completed");
    } else {
      toast.info(`${passedCount}/${results.length} test geçti`);
    }
  };

  const saveAttempt = async (passed: number, total: number, completed: boolean) => {
    if (!user || !challenge) return;

    const skill = skills.find((s) => s.skill_id === selectedSkill);
    if (!skill) return;

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      if (completed) {
        const bonus = difficulty === "hard" ? 15 : difficulty === "medium" ? 10 : 5;
        const newContribution = Math.min(100, (skill.confidence_score || 0) + bonus);
        
        await supabase
          .from("user_skills")
          .update({
            contribution_score: newContribution,
            confidence_score: Math.min(100, skill.confidence_score + Math.round(bonus / 2)),
          })
          .eq("id", skill.id);

        fetchSkills();
      }
    } catch (err) {
      console.error("Sonuç kaydedilemedi:", err);
    }
  };

  const revealHint = () => {
    if (challenge && hintsRevealed < challenge.hints.length) {
      setHintsRevealed(hintsRevealed + 1);
    }
  };

  const resetChallenge = () => {
    setChallengeState("idle");
    setChallenge(null);
    setCode("");
    setTestResults([]);
    setShowHints(false);
    setHintsRevealed(0);
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
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Code2 className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Kodlama Görevleri</h1>
            </div>
            <p className="text-muted-foreground">
              Becerilerinizi kanıtlamak için AI tarafından oluşturulan kodlama problemlerini çözün
            </p>
          </motion.div>

          {challengeState === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Görev Oluştur</CardTitle>
                  <CardDescription>
                    Kişiselleştirilmiş kodlama görevi almak için bir beceri ve zorluk seviyesi seçin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {skills.length === 0 ? (
                    <div className="text-center py-8">
                      <Code2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Beceri Eklenmedi</h3>
                      <p className="text-muted-foreground mb-4">
                        Kodlama görevleri almak için programlama becerileri ekleyin
                      </p>
                      <Button onClick={() => navigate("/dashboard/skills")}>Beceri Ekle</Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Beceri Seçin</label>
                          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                            <SelectTrigger>
                              <SelectValue placeholder="Bir beceri seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {skills.map((skill) => (
                                <SelectItem key={skill.skill_id} value={skill.skill_id}>
                                  {skill.skill.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Zorluk</label>
                          <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Kolay</SelectItem>
                              <SelectItem value="medium">Orta</SelectItem>
                              <SelectItem value="hard">Zor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={generateChallenge} className="w-full" size="lg">
                        <Play className="w-4 h-4 mr-2" />
                        Görev Oluştur
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {challengeState === "loading" && (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Görev Oluşturuluyor...</h3>
                <p className="text-muted-foreground">
                  AI sizin için {difficulty === "easy" ? "kolay" : difficulty === "medium" ? "orta" : "zor"} seviyede bir görev hazırlıyor
                </p>
              </CardContent>
            </Card>
          )}

          {(challengeState === "active" || challengeState === "completed") && challenge && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Problem Description */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{challenge.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              challenge.difficulty === "hard"
                                ? "destructive"
                                : challenge.difficulty === "medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {challenge.difficulty === "easy" ? "kolay" : challenge.difficulty === "medium" ? "orta" : "zor"}
                          </Badge>
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={resetChallenge}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Yeni Görev
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{challenge.description}</p>
                    </div>

                    {/* Hints Section */}
                    <div className="space-y-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHints(!showHints)}
                        className="text-muted-foreground"
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        {showHints ? "İpuçlarını Gizle" : "İpuçlarını Göster"}
                      </Button>

                      {showHints && (
                        <div className="space-y-2">
                          {challenge.hints.slice(0, hintsRevealed).map((hint, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm"
                            >
                              <span className="font-medium">İpucu {i + 1}:</span> {hint}
                            </div>
                          ))}
                          {hintsRevealed < challenge.hints.length && (
                            <Button variant="outline" size="sm" onClick={revealHint}>
                              Sonraki İpucu ({hintsRevealed}/{challenge.hints.length})
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Test Results */}
                    {testResults.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Test Sonuçları</h4>
                        {testResults.map((result, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border ${
                              result.passed
                                ? "bg-green-500/10 border-green-500/20"
                                : "bg-destructive/10 border-destructive/20"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {result.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-destructive" />
                              )}
                              <span className="font-medium text-sm">{result.description}</span>
                            </div>
                            <div className="text-xs font-mono space-y-1 text-muted-foreground">
                              <p>Girdi: {result.input}</p>
                              <p>Beklenen: {result.expected}</p>
                              {!result.passed && <p>Gerçek: {result.actual}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Code Editor */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Kod Editörü</CardTitle>
                    <CardDescription>Çözümünüzü JavaScript ile yazın</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="font-mono text-sm h-80 resize-none bg-muted/50"
                      placeholder="Kodunuzu buraya yazın..."
                      disabled={challengeState === "completed"}
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={runTests}
                        disabled={isRunning || challengeState === "completed"}
                        className="flex-1"
                      >
                        {isRunning ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        Testleri Çalıştır
                      </Button>
                    </div>

                    {challengeState === "completed" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center"
                      >
                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <h4 className="font-semibold text-green-500">Tebrikler!</h4>
                        <p className="text-sm text-muted-foreground">
                          Görevi başarıyla tamamladınız!
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Challenges;
