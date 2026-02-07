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
    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "Görsel bulunamadı" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("API key not configured");
    }

    // Build content array with images
    const imageContent = images.map((img: string) => ({
      type: "image_url",
      image_url: { url: img }
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert OCR system. Extract ALL text from the provided CV/resume images.
            
Instructions:
- Extract every piece of text visible in the images
- Preserve the logical structure (sections, bullet points, etc.)
- Include all contact information, skills, experience, education
- If there are multiple pages, combine them in order
- Output plain text only, no markdown
- Be thorough - don't skip any text`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Bu CV/özgeçmiş görsellerindeki tüm metni çıkar:" },
              ...imageContent
            ]
          }
        ],
        max_tokens: 8000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      throw new Error("OCR işlemi başarısız");
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OCR error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "OCR hatası" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
