import jsPDF from "jspdf";

interface CVAnalysisForPDF {
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
  ats_analysis?: {
    compatibility_score: number;
    keyword_density: string;
    format_issues: string[];
    recommendations: string[];
  };
  career_insights?: {
    suitable_positions: string[];
    career_paths: string[];
    salary_range_turkey: {
      min: number;
      max: number;
      currency: string;
    };
    market_demand: string;
  };
}

export const exportCVAnalysisToPDF = (analysis: CVAnalysisForPDF) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  const addPage = () => {
    doc.addPage();
    yPos = 20;
  };

  const checkPageBreak = (height: number) => {
    if (yPos + height > 280) {
      addPage();
    }
  };

  // Helper functions
  const addTitle = (text: string) => {
    checkPageBreak(15);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, yPos);
    yPos += 10;
  };

  const addSubtitle = (text: string) => {
    checkPageBreak(12);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, yPos);
    yPos += 8;
  };

  const addText = (text: string, indent = 0) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin + indent, yPos);
      yPos += 5;
    });
  };

  const addScore = (label: string, score: number, x: number, y: number) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(label, x, y);
    
    const color = score >= 80 ? [34, 197, 94] : score >= 50 ? [234, 179, 8] : [239, 68, 68];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x + 50, y - 5, 20, 7, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(score.toString(), x + 56, y);
    doc.setTextColor(0, 0, 0);
  };

  const addBulletPoint = (text: string, indent = 5) => {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("•", margin + indent, yPos);
    const lines = doc.splitTextToSize(text, contentWidth - indent - 10);
    lines.forEach((line: string, i: number) => {
      if (i > 0) checkPageBreak(5);
      doc.text(line, margin + indent + 5, yPos);
      yPos += 5;
    });
    yPos += 2;
  };

  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CV Analiz Raporu", margin, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(analysis.file_name, margin, 28);
  doc.setTextColor(0, 0, 0);
  yPos = 45;

  // Date and Overall Score
  const date = new Date(analysis.created_at).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(10);
  doc.text(`Analiz Tarihi: ${date}`, margin, yPos);
  
  // Overall score circle
  const scoreColor = analysis.overall_score >= 80 ? [34, 197, 94] : analysis.overall_score >= 50 ? [234, 179, 8] : [239, 68, 68];
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.circle(pageWidth - 35, yPos, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(analysis.overall_score.toString(), pageWidth - 40, yPos + 5);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text("Genel Puan", pageWidth - 45, yPos + 18);
  yPos += 25;

  // Score breakdown
  addSubtitle("Puan Detaylari");
  yPos += 5;
  const scores = [
    { label: "Deneyim", score: analysis.experience_score },
    { label: "Egitim", score: analysis.education_score },
    { label: "Beceri", score: analysis.skills_score },
    { label: "Format", score: analysis.format_score },
    { label: "Dil", score: analysis.language_score },
  ];
  
  scores.forEach((s, i) => {
    const x = margin + (i % 3) * 55;
    const y = yPos + Math.floor(i / 3) * 12;
    addScore(s.label, s.score, x, y);
  });
  yPos += 30;

  // ATS Analysis
  if (analysis.ats_analysis) {
    addSubtitle("ATS Uyumluluk Analizi");
    yPos += 3;
    addText(`Uyumluluk Puani: ${analysis.ats_analysis.compatibility_score}/100`);
    addText(`Anahtar Kelime Yogunlugu: ${analysis.ats_analysis.keyword_density}`);
    yPos += 3;
    
    if (analysis.ats_analysis.format_issues.length > 0) {
      addText("Format Sorunlari:");
      analysis.ats_analysis.format_issues.forEach((issue) => addBulletPoint(issue));
    }
    yPos += 5;
  }

  // Career Insights
  if (analysis.career_insights) {
    addSubtitle("Kariyer Ongoruleri");
    yPos += 3;
    
    const formatSalary = (amount: number) =>
      new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(amount);
    
    addText(`Tahmini Maas Araligi: ${formatSalary(analysis.career_insights.salary_range_turkey.min)} - ${formatSalary(analysis.career_insights.salary_range_turkey.max)}`);
    addText(`Piyasa Talebi: ${analysis.career_insights.market_demand}`);
    yPos += 3;
    
    if (analysis.career_insights.suitable_positions.length > 0) {
      addText("Uygun Pozisyonlar:");
      analysis.career_insights.suitable_positions.forEach((pos) => addBulletPoint(pos));
    }
    
    if (analysis.career_insights.career_paths.length > 0) {
      addText("Kariyer Yollari:");
      analysis.career_insights.career_paths.forEach((path) => addBulletPoint(path));
    }
    yPos += 5;
  }

  // Strengths
  addSubtitle("Guclu Yonler");
  yPos += 3;
  analysis.strengths.forEach((s) => addBulletPoint(s));
  yPos += 5;

  // Weaknesses
  addSubtitle("Gelistirilmesi Gereken Alanlar");
  yPos += 3;
  analysis.weaknesses.forEach((w) => addBulletPoint(w));
  yPos += 5;

  // Suggestions
  addSubtitle("Oneriler");
  yPos += 3;
  analysis.suggestions.forEach((s, i) => {
    checkPageBreak(10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}.`, margin + 5, yPos);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(s, contentWidth - 15);
    lines.forEach((line: string, j: number) => {
      if (j > 0) checkPageBreak(5);
      doc.text(line, margin + 15, yPos);
      yPos += 5;
    });
    yPos += 2;
  });
  yPos += 5;

  // Extracted Skills
  addSubtitle("Tespit Edilen Beceriler");
  yPos += 3;
  
  const skillsByCategory = analysis.extracted_skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof analysis.extracted_skills>);

  Object.entries(skillsByCategory).forEach(([category, skills]) => {
    checkPageBreak(15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(category + ":", margin + 5, yPos);
    yPos += 5;
    
    const skillText = skills.map((s) => `${s.name} (${s.level === 'advanced' ? 'Ileri' : s.level === 'intermediate' ? 'Orta' : 'Baslangic'})`).join(", ");
    const lines = doc.splitTextToSize(skillText, contentWidth - 10);
    doc.setFont("helvetica", "normal");
    lines.forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, margin + 10, yPos);
      yPos += 5;
    });
    yPos += 3;
  });

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth - 30, 290);
    doc.text("SkillBridge AI ile olusturuldu", margin, 290);
  }

  // Save
  const fileName = `CV_Analiz_${analysis.file_name.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
};
