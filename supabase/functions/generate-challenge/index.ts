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
    const { skillName, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a coding challenge designer. Create a ${difficulty} coding challenge for ${skillName}.

Requirements:
- The challenge should be solvable in a browser-based JavaScript environment
- Provide clear problem statement
- Include starter code
- Include 3-5 test cases with expected outputs
- Provide hints for stuck developers

Return a JSON object with this exact structure:
{
  "title": "Challenge title",
  "description": "Detailed problem description with examples",
  "difficulty": "${difficulty}",
  "starterCode": "function solution(input) {\\n  // Your code here\\n  return null;\\n}",
  "testCases": [
    {
      "input": "test input as string",
      "expectedOutput": "expected output as string",
      "description": "What this test checks"
    }
  ],
  "hints": ["Hint 1", "Hint 2"],
  "solution": "The complete solution code"
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
          { role: "user", content: `Generate a ${difficulty} coding challenge for ${skillName}` }
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
      throw new Error("Failed to generate challenge");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let challenge;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        challenge = JSON.parse(jsonMatch[0]);
      } else {
        challenge = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse challenge:", parseError, content);
      throw new Error("Failed to parse challenge from AI response");
    }

    return new Response(JSON.stringify({ challenge }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-challenge error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
