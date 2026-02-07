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
    const { username } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ error: "GitHub kullanıcı adı gerekli" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch GitHub user profile
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: { "User-Agent": "SkillOS-Analyzer" }
    });

    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: "Kullanıcı bulunamadı" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("GitHub API hatası");
    }

    const userData = await userResponse.json();

    // Fetch repositories
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
      headers: { "User-Agent": "SkillOS-Analyzer" }
    });

    if (!reposResponse.ok) {
      throw new Error("Repolar alınamadı");
    }

    const repos = await reposResponse.json();

    // Calculate language statistics
    const languageStats: Record<string, number> = {};
    let totalStars = 0;
    const topRepos: any[] = [];

    for (const repo of repos) {
      if (repo.language) {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
      }
      totalStars += repo.stargazers_count || 0;

      if (topRepos.length < 5 && !repo.fork) {
        topRepos.push({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          url: repo.html_url
        });
      }
    }

    // AI analysis for skills detection
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY yapılandırılmamış");
    }

    const repoSummary = repos.slice(0, 20).map((r: any) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      topics: r.topics,
      stars: r.stargazers_count
    }));

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Sen bir GitHub profil analiz uzmanısın. Kullanıcının repolarına bakarak teknik becerilerini, güçlü yönlerini ve gelişim alanlarını belirle. Türkçe yanıt ver.`
          },
          {
            role: "user",
            content: `GitHub Profil Analizi:
Kullanıcı: ${username}
Bio: ${userData.bio || "Yok"}
Public Repo Sayısı: ${userData.public_repos}
Takipçi: ${userData.followers}
Takip: ${userData.following}
Dil İstatistikleri: ${JSON.stringify(languageStats)}
Toplam Yıldız: ${totalStars}

Son Repolar:
${JSON.stringify(repoSummary, null, 2)}

Bu profile göre:
1. Tespit edilen beceriler (dil, framework, araç)
2. Aktivite puanı (0-100)
3. Çeşitlilik puanı (0-100)
4. Katkı puanı (0-100)
5. Genel puan (0-100)
6. Güçlü yönler
7. Gelişim önerileri`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_github",
              description: "GitHub profil analiz sonuçlarını döndür",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number" },
                  activity_score: { type: "number" },
                  diversity_score: { type: "number" },
                  contribution_score: { type: "number" },
                  detected_skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        category: { type: "string" },
                        confidence: { type: "number" }
                      },
                      required: ["name", "category", "confidence"]
                    }
                  },
                  strengths: { type: "array", items: { type: "string" } },
                  suggestions: { type: "array", items: { type: "string" } }
                },
                required: ["overall_score", "activity_score", "diversity_score", "contribution_score", "detected_skills", "strengths", "suggestions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_github" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Çok fazla istek, lütfen biraz bekleyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await aiResponse.text();
      console.error("AI error:", aiResponse.status, text);
      throw new Error("AI analizi başarısız");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("AI yanıtı beklenenden farklı");
    }

    const aiAnalysis = JSON.parse(toolCall.function.arguments);

    const analysis = {
      github_username: username,
      avatar_url: userData.avatar_url,
      profile_url: userData.html_url,
      bio: userData.bio,
      public_repos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      languages: languageStats,
      top_repos: topRepos,
      ...aiAnalysis
    };

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("GitHub analizi hatası:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Bilinmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
