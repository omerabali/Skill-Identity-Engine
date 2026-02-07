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
    const { targetRole, skillGaps, userSkills } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a career development expert specializing in tech skills. Create a personalized learning roadmap.

Context:
- Target Role: ${targetRole}
- Skills to improve: ${JSON.stringify(skillGaps)}
- Current skills: ${JSON.stringify(userSkills)}

Generate a detailed learning roadmap with:
1. Priority order of skills to learn/improve
2. For each skill gap:
   - Recommended free resources (courses, tutorials, documentation)
   - Suggested projects to build
   - Estimated time to reach proficiency
   - Key milestones to track progress

Return a JSON object with this structure:
{
  "overview": "Brief overview of the learning path",
  "estimatedTotalWeeks": number,
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "durationWeeks": number,
      "skills": [
        {
          "skillName": "Skill name",
          "currentLevel": number,
          "targetLevel": number,
          "priority": "high" | "medium" | "low",
          "resources": [
            {
              "title": "Resource title",
              "type": "course" | "tutorial" | "documentation" | "video",
              "url": "https://...",
              "provider": "Provider name",
              "estimatedHours": number,
              "isFree": true
            }
          ],
          "projects": [
            {
              "title": "Project title",
              "description": "What to build",
              "difficulty": "beginner" | "intermediate" | "advanced",
              "estimatedHours": number
            }
          ],
          "milestones": ["Milestone 1", "Milestone 2"]
        }
      ]
    }
  ],
  "tips": ["Tip 1", "Tip 2"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a learning roadmap for becoming a ${targetRole}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate roadmap");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let roadmap;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        roadmap = JSON.parse(jsonMatch[0]);
      } else {
        roadmap = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse roadmap:", parseError, content);
      throw new Error("Failed to parse roadmap from AI response");
    }

    return new Response(JSON.stringify({ roadmap }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-roadmap error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
