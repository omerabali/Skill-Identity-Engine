import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Clock, CheckCircle2, XCircle, Loader2, Play, RotateCcw } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserSkill {
  id: string;
  skill_id: string;
  confidence_score: number;
  assessment_score: number | null;
  skill: {
    id: string;
    name: string;
    category: string;
  };
}

interface QuizQuestion {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
}

const Assessments = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);
  const [quizState, setQuizState] = useState<"idle" | "loading" | "active" | "completed">("idle");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [showExplanation, setShowExplanation] = useState(false);

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

  useEffect(() => {
    if (quizState === "active" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && quizState === "active") {
      finishQuiz();
    }
  }, [quizState, timeLeft]);

  const fetchSkills = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_skills")
      .select(`
        id,
        skill_id,
        confidence_score,
        assessment_score,
        skill:skills(id, name, category)
      `)
      .eq("user_id", user?.id)
      .order("confidence_score", { ascending: false });

    if (!error && data) {
      setSkills(data as unknown as UserSkill[]);
    }
    setLoading(false);
  };

  const startQuiz = async (skill: UserSkill) => {
    setSelectedSkill(skill);
    setQuizState("loading");
    setCurrentQuestion(0);
    setAnswers([]);
    setTimeLeft(300);
    setShowExplanation(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { skillName: skill.skill.name, difficulty: "medium", questionCount: 5 },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setQuestions(data.questions);
      setQuizState("active");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Sınav oluşturulamadı";
      toast.error(errorMessage);
      setQuizState("idle");
      setSelectedSkill(null);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(optionIndex);
  };

  const confirmAnswer = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = questions[currentQuestion].options[selectedAnswer].isCorrect;
    setAnswers([...answers, isCorrect]);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const correctCount = answers.filter(Boolean).length;
    const score = Math.round((correctCount / questions.length) * 100);
    setQuizState("completed");

    if (!selectedSkill || !user) return;

    try {
      // Record the attempt
      await supabase.from("user_assessment_attempts").insert({
        user_id: user.id,
        skill_id: selectedSkill.skill_id,
        score,
        questions_answered: questions.length,
        correct_answers: correctCount,
        time_taken_seconds: 300 - timeLeft,
      });

      // Update the user's skill assessment score and recalculate confidence
      const newAssessmentScore = score;
      const currentSkill = skills.find((s) => s.id === selectedSkill.id);
      
      // Simple confidence recalculation (weighted average)
      const newConfidence = Math.round(
        (currentSkill?.confidence_score || 0) * 0.6 + newAssessmentScore * 0.4
      );

      await supabase
        .from("user_skills")
        .update({
          assessment_score: newAssessmentScore,
          confidence_score: Math.min(100, Math.max(0, newConfidence)),
        })
        .eq("id", selectedSkill.id);

      toast.success(`Sınav tamamlandı! Puan: ${score}%`);
      fetchSkills();
    } catch (err) {
      console.error("Sonuçlar kaydedilemedi:", err);
      toast.error("Sonuçlar kaydedilemedi");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Beceri Sınavları</h1>
            </div>
            <p className="text-muted-foreground">
              Beceri güven puanlarınızı doğrulamak ve artırmak için zamanlı sınavlar çözün
            </p>
          </motion.div>

          {quizState === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {skills.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Değerlendirilecek Beceri Yok</h3>
                    <p className="text-muted-foreground mb-4">
                      Sınav çözmek için önce beceri ekleyin
                    </p>
                    <Button onClick={() => navigate("/dashboard/skills")}>Beceri Ekle</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {skills.map((skill) => (
                    <Card key={skill.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{skill.skill.name}</h3>
                              <Badge variant="outline">{skill.skill.category}</Badge>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <span>Güven: {skill.confidence_score}%</span>
                              <span>
                                Son Sınav:{" "}
                                {skill.assessment_score !== null
                                  ? `${skill.assessment_score}%`
                                  : "Henüz çözülmedi"}
                              </span>
                            </div>
                          </div>
                          <Button onClick={() => startQuiz(skill)}>
                            <Play className="w-4 h-4 mr-2" />
                            Sınava Başla
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {quizState === "loading" && (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Sınav Oluşturuluyor...</h3>
                <p className="text-muted-foreground">
                  AI, {selectedSkill?.skill.name} için kişiselleştirilmiş sorular hazırlıyor
                </p>
              </CardContent>
            </Card>
          )}

          {quizState === "active" && questions.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedSkill?.skill.name} Değerlendirmesi</CardTitle>
                      <CardDescription>
                        Soru {currentQuestion + 1} / {questions.length}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-lg font-mono">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className={timeLeft < 60 ? "text-destructive" : ""}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                  <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mt-4" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg font-medium">{questions[currentQuestion].question}</p>

                  <div className="grid gap-3">
                    {questions[currentQuestion].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        disabled={showExplanation}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          showExplanation
                            ? option.isCorrect
                              ? "border-green-500 bg-green-500/10"
                              : selectedAnswer === index
                              ? "border-destructive bg-destructive/10"
                              : "border-border"
                            : selectedAnswer === index
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {showExplanation && option.isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          )}
                          {showExplanation && !option.isCorrect && selectedAnswer === index && (
                            <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                          )}
                          <span>{option.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg bg-muted/50 border border-border"
                    >
                      <p className="text-sm font-medium mb-1">Açıklama:</p>
                      <p className="text-sm text-muted-foreground">
                        {questions[currentQuestion].explanation}
                      </p>
                    </motion.div>
                  )}

                  <div className="flex justify-end gap-3">
                    {!showExplanation ? (
                      <Button onClick={confirmAnswer} disabled={selectedAnswer === null}>
                        Cevabı Gönder
                      </Button>
                    ) : (
                      <Button onClick={nextQuestion}>
                        {currentQuestion < questions.length - 1 ? "Sonraki Soru" : "Sınavı Bitir"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {quizState === "completed" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Değerlendirme Tamamlandı!</h3>
                  <p className="text-muted-foreground mb-6">
                    {selectedSkill?.skill.name} değerlendirmesini tamamladınız
                  </p>

                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold text-primary">
                        {Math.round((answers.filter(Boolean).length / questions.length) * 100)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Puan</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold text-green-500">
                        {answers.filter(Boolean).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Doğru</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold text-muted-foreground">
                        {formatTime(300 - timeLeft)}
                      </p>
                      <p className="text-sm text-muted-foreground">Süre</p>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={() => setQuizState("idle")}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Becerilere Dön
                    </Button>
                    <Button onClick={() => selectedSkill && startQuiz(selectedSkill)}>
                      Tekrar Dene
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Assessments;
