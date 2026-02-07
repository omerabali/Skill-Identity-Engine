import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UserContext {
  skills: { name: string; category: string; confidence: number }[];
  targetRoles: string[];
  githubUsername?: string;
  cvAnalysis?: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext, mode } = await req.json() as {
      messages: Message[];
      userContext: UserContext;
      mode: "chat" | "market-analysis" | "learning-path" | "cv-optimization";
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt based on mode
    let systemPrompt = "";

    const skillsSummary = userContext.skills.length > 0
      ? `Kullanıcının becerileri: ${userContext.skills.map(s => `${s.name} (%${s.confidence})`).join(", ")}`
      : "Kullanıcının henüz beceri profili yok.";

    const targetRolesSummary = userContext.targetRoles.length > 0
      ? `Hedef roller: ${userContext.targetRoles.join(", ")}`
      : "Hedef rol belirlenmemiş.";

    switch (mode) {
      case "market-analysis":
        systemPrompt = `Sen bir kariyer piyasa analisti olarak görev yapıyorsun. Kullanıcının becerilerini analiz edip piyasa trendleri, maaş aralıkları ve talep durumu hakkında bilgi ver.

${skillsSummary}
${targetRolesSummary}

Görevlerin:
1. Becerilerin piyasadaki talebini değerlendir (yüksek/orta/düşük)
2. Türkiye ve global piyasa için tahmini maaş aralıkları ver
3. Trend olan ve öğrenilmesi gereken teknolojileri öner
4. Rekabet avantajı sağlayacak beceri kombinasyonlarını belirt

Yanıtlarını Türkçe ver ve somut, güncel veriler kullan.`;
        break;

      case "learning-path":
        systemPrompt = `Sen bir öğrenme yolu planlayıcısı olarak görev yapıyorsun. Kullanıcının mevcut becerilerini ve hedef rolünü analiz edip kişiselleştirilmiş bir öğrenme planı oluştur.

${skillsSummary}
${targetRolesSummary}

Görevlerin:
1. Hedef role ulaşmak için eksik becerileri belirle
2. Öğrenme önceliklerini sırala (kritik, önemli, faydalı)
3. Her beceri için tahmini öğrenme süresi ver
4. Ücretsiz ve ücretli kaynak önerileri sun (Udemy, YouTube, docs, vb.)
5. Haftalık/aylık öğrenme planı öner

Yanıtlarını Türkçe ver ve pratik, uygulanabilir tavsiyeler sun.`;
        break;

      case "cv-optimization":
        systemPrompt = `Sen bir CV optimizasyon uzmanı olarak görev yapıyorsun. Kullanıcının CV analizini ve becerilerini değerlendirip iyileştirme önerileri sun.

${skillsSummary}
${targetRolesSummary}
${userContext.cvAnalysis ? `CV Skoru: ${userContext.cvAnalysis.overallScore}/100
Güçlü yönler: ${userContext.cvAnalysis.strengths.join(", ")}
Zayıf yönler: ${userContext.cvAnalysis.weaknesses.join(", ")}` : "CV analizi henüz yapılmamış."}

Görevlerin:
1. CV'deki eksik anahtar kelimeleri ve becerileri belirle
2. ATS (Applicant Tracking System) uyumluluğunu değerlendir
3. Hedef role göre vurgulanması gereken deneyimleri öner
4. Profesyonel özet ve başlık önerileri sun
5. Somut iyileştirme adımları ver

Yanıtlarını Türkçe ver ve işe alım süreçlerine odaklan.`;
        break;

      default: // chat mode
        systemPrompt = `Sen "Kariyer Koçu" adında yardımcı bir AI asistanısın. Kullanıcının kariyer gelişimi konusunda kişiselleştirilmiş tavsiyeler veriyorsun.

${skillsSummary}
${targetRolesSummary}

Görevlerin:
1. Kariyer hedeflerine ulaşmak için stratejik tavsiyeler ver
2. Mülakat hazırlığı konusunda yardımcı ol
3. Beceri geliştirme önerileri sun
4. Motivasyon ve profesyonel gelişim desteği sağla
5. Sektör trendleri hakkında bilgi ver

Yanıtlarını Türkçe ver, samimi ama profesyonel bir üslup kullan. Emoji kullanabilirsin.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit aşıldı, lütfen biraz bekleyip tekrar deneyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kredi limiti aşıldı." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Career Coach error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
