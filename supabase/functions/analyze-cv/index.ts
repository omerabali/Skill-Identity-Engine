import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText, fileName } = await req.json();

    if (!cvText) {
      return new Response(
        JSON.stringify({ error: "CV metni gerekli" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY yapılandırılmamış");
    }

    console.log(`Analyzing CV: ${fileName}, text length: ${cvText.length}`);

    const systemPrompt = `Sen dünya standartlarında bir CV analiz uzmanısın. CV'leri çok detaylı ve profesyonel bir şekilde analiz edip Türkçe kapsamlı geri bildirim veriyorsun.

## ANALİZ KRİTERLERİ

### 1. DENEYİM ANALİZİ (experience_score: 0-100)
Değerlendirme kriterleri:
- İş deneyiminin süresi ve sürekliliği
- Pozisyon ilerlemesi (junior → senior → lead)
- Şirket kalitesi ve çeşitliliği (startup, enterprise, multinational)
- Projelerin etki alanı ve ölçeği
- Sorumluluk seviyesi ve liderlik deneyimi
- Başarı metrikleri ve somut sonuçlar
- Sektör deneyimi çeşitliliği

### 2. EĞİTİM ANALİZİ (education_score: 0-100)
Değerlendirme kriterleri:
- Eğitim seviyesi (lisans, yüksek lisans, doktora)
- Üniversite ve bölüm kalitesi
- Akademik başarı (GPA, onur listesi)
- Sertifikalar ve profesyonel eğitimler
- Bootcamp ve online kurs tamamlamaları
- Sürekli öğrenme kanıtları
- Yayınlar ve araştırmalar

### 3. BECERİ ANALİZİ (skills_score: 0-100)
Değerlendirme kriterleri:
- Teknik becerilerin derinliği ve genişliği
- Güncel teknoloji stack'i
- Soft skills ve iletişim becerileri
- Dil becerileri
- Becerilerin piyasa talebiyle uyumu
- Beceri çeşitliliği ve T-shaped profil
- Özel/niş beceriler

### 4. FORMAT ANALİZİ (format_score: 0-100)
Değerlendirme kriterleri:
- Görsel düzen ve okunabilirlik
- Bölüm organizasyonu
- Tutarlı formatlama
- Uygun uzunluk (1-2 sayfa)
- ATS (Applicant Tracking System) uyumluluğu
- Profesyonel görünüm
- İletişim bilgilerinin tamlığı
- Tarih formatı tutarlılığı

### 5. DİL ANALİZİ (language_score: 0-100)
Değerlendirme kriterleri:
- Yazım ve dilbilgisi doğruluğu
- Profesyonel ton ve üslup
- Aktif dil kullanımı (başardım, geliştirdim)
- Kısa ve etkili cümleler
- Jargon ve teknik terimlerin uygun kullanımı
- Tutarlı kişi/zaman kullanımı
- Aksiyon odaklı ifadeler

## ÇIKTI FORMATI

Her kategori için detaylı analiz ve puan ver. Ayrıca:

### Güçlü Yönler (strengths)
En az 5 spesifik güçlü yön belirle. Her biri somut ve özgün olmalı.

### Zayıf Yönler (weaknesses)  
En az 5 spesifik zayıf yön belirle. İyileştirme potansiyeli olan alanlar.

### Öneriler (suggestions)
En az 8 somut, uygulanabilir öneri ver:
- Kısa vadeli (hemen yapılabilecek)
- Orta vadeli (1-3 ay)
- Uzun vadeli (kariyer hedefleri)

### Tespit Edilen Beceriler (extracted_skills)
Tüm becerileri tespit et ve kategorize et:
- Programlama dilleri
- Frameworkler/Kütüphaneler
- Veritabanları
- DevOps/Cloud
- Soft skills
- Diller
- Araçlar

Her beceri için seviye belirle:
- beginner: 0-1 yıl veya temel bilgi
- intermediate: 1-3 yıl veya proje deneyimi
- advanced: 3+ yıl veya derin uzmanlık

### ATS Analizi
CV'nin ATS sistemleriyle uyumluluğunu değerlendir:
- Anahtar kelime yoğunluğu
- Format uyumluluğu
- Standart bölüm başlıkları

### Kariyer Öngörüleri
Mevcut profile göre:
- Uygun pozisyon seviyeleri
- Potansiyel kariyer yolları
- Tahmini maaş aralığı (Türkiye piyasası)`;

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
          {
            role: "user",
            content: `Lütfen aşağıdaki CV'yi yukarıdaki tüm kriterlere göre detaylı analiz et ve JSON formatında yanıt ver:

CV İçeriği:
${cvText}

JSON formatı:
{
  "overall_score": <0-100, tüm kategorilerin ağırlıklı ortalaması>,
  "experience_score": <0-100>,
  "education_score": <0-100>,
  "skills_score": <0-100>,
  "format_score": <0-100>,
  "language_score": <0-100>,
  "experience_analysis": {
    "summary": "deneyim özeti",
    "total_years": <toplam yıl>,
    "career_progression": "kariyer ilerlemesi açıklaması",
    "notable_achievements": ["başarı 1", "başarı 2"],
    "industry_experience": ["sektör 1", "sektör 2"]
  },
  "education_analysis": {
    "summary": "eğitim özeti",
    "highest_degree": "en yüksek derece",
    "certifications": ["sertifika 1", "sertifika 2"],
    "continuous_learning": "sürekli öğrenme değerlendirmesi"
  },
  "ats_analysis": {
    "compatibility_score": <0-100>,
    "keyword_density": "yeterli/yetersiz",
    "format_issues": ["sorun 1", "sorun 2"],
    "recommendations": ["öneri 1", "öneri 2"]
  },
  "career_insights": {
    "suitable_positions": ["pozisyon 1", "pozisyon 2"],
    "career_paths": ["yol 1", "yol 2"],
    "salary_range_turkey": {
      "min": <asgari TL>,
      "max": <azami TL>,
      "currency": "TRY"
    },
    "market_demand": "yüksek/orta/düşük"
  },
  "strengths": ["güçlü yön 1", "güçlü yön 2", ...en az 5 madde],
  "weaknesses": ["zayıf yön 1", "zayıf yön 2", ...en az 5 madde],
  "suggestions": [
    {"priority": "high", "timeframe": "immediate", "action": "öneri 1"},
    {"priority": "medium", "timeframe": "short-term", "action": "öneri 2"},
    {"priority": "low", "timeframe": "long-term", "action": "öneri 3"},
    ...en az 8 öneri
  ],
  "extracted_skills": [
    {"name": "beceri adı", "category": "Programlama Dilleri|Framework|Veritabanı|DevOps|Cloud|Soft Skills|Diller|Araçlar", "level": "beginner|intermediate|advanced", "years_experience": <yıl veya null>}
  ]
}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_cv",
              description: "Kapsamlı CV analiz sonuçlarını döndür",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number", description: "Genel CV puanı (0-100)" },
                  experience_score: { type: "number", description: "Deneyim puanı (0-100)" },
                  education_score: { type: "number", description: "Eğitim puanı (0-100)" },
                  skills_score: { type: "number", description: "Beceri puanı (0-100)" },
                  format_score: { type: "number", description: "Format puanı (0-100)" },
                  language_score: { type: "number", description: "Dil puanı (0-100)" },
                  experience_analysis: {
                    type: "object",
                    properties: {
                      summary: { type: "string" },
                      total_years: { type: "number" },
                      career_progression: { type: "string" },
                      notable_achievements: { type: "array", items: { type: "string" } },
                      industry_experience: { type: "array", items: { type: "string" } }
                    }
                  },
                  education_analysis: {
                    type: "object",
                    properties: {
                      summary: { type: "string" },
                      highest_degree: { type: "string" },
                      certifications: { type: "array", items: { type: "string" } },
                      continuous_learning: { type: "string" }
                    }
                  },
                  ats_analysis: {
                    type: "object",
                    properties: {
                      compatibility_score: { type: "number" },
                      keyword_density: { type: "string" },
                      format_issues: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } }
                    }
                  },
                  career_insights: {
                    type: "object",
                    properties: {
                      suitable_positions: { type: "array", items: { type: "string" } },
                      career_paths: { type: "array", items: { type: "string" } },
                      salary_range_turkey: {
                        type: "object",
                        properties: {
                          min: { type: "number" },
                          max: { type: "number" },
                          currency: { type: "string" }
                        }
                      },
                      market_demand: { type: "string" }
                    }
                  },
                  strengths: { type: "array", items: { type: "string" }, description: "Güçlü yönler (en az 5)" },
                  weaknesses: { type: "array", items: { type: "string" }, description: "Zayıf yönler (en az 5)" },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        timeframe: { type: "string", enum: ["immediate", "short-term", "long-term"] },
                        action: { type: "string" }
                      }
                    },
                    description: "Öneriler (en az 8)"
                  },
                  extracted_skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        category: { type: "string" },
                        level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                        years_experience: { type: "number" }
                      },
                      required: ["name", "category", "level"]
                    },
                    description: "Tespit edilen beceriler"
                  }
                },
                required: ["overall_score", "experience_score", "education_score", "skills_score", "format_score", "language_score", "strengths", "weaknesses", "suggestions", "extracted_skills"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_cv" } }
      }),
    });

    if (!response.ok) {
      console.error(`AI API error: ${response.status}`);
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
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received successfully");

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "analyze_cv") {
      throw new Error("Geçersiz AI yanıtı");
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);
    console.log("CV analysis completed:", {
      overall_score: analysisResult.overall_score,
      skills_count: analysisResult.extracted_skills?.length || 0
    });

    // Transform suggestions to simple string array for backward compatibility
    const simpleSuggestions = analysisResult.suggestions?.map((s: any) => 
      typeof s === 'string' ? s : s.action
    ) || [];

    // Preserve detailed suggestions for new UI
    const detailedSuggestions = analysisResult.suggestions?.map((s: any) => 
      typeof s === 'string' ? { priority: 'medium', timeframe: 'short-term', action: s } : s
    ) || [];

    return new Response(
      JSON.stringify({
        analysis: {
          ...analysisResult,
          suggestions: simpleSuggestions,
          detailed_suggestions: detailedSuggestions,
        },
        fileName
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("CV analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "CV analiz edilemedi" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
