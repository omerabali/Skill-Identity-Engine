import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { linkedinUrl } = await req.json();

    if (!linkedinUrl) {
      throw new Error("LinkedIn URL gerekli");
    }

    // Extract username from LinkedIn URL
    const urlMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (!urlMatch) {
      throw new Error("Geçersiz LinkedIn URL formatı. Örnek: linkedin.com/in/kullanici-adi");
    }

    const username = urlMatch[1];

    // Note: LinkedIn's official API requires OAuth authentication
    // For now, we'll provide instructions and mock data
    // In production, you would integrate with LinkedIn's API or a service like Proxycurl
    
    const PROXYCURL_API_KEY = Deno.env.get('PROXYCURL_API_KEY');
    
    if (PROXYCURL_API_KEY) {
      // Real LinkedIn data via Proxycurl API
      try {
        const response = await fetch(`https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}`, {
          headers: {
            'Authorization': `Bearer ${PROXYCURL_API_KEY}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          const profile = {
            full_name: data.full_name || '',
            headline: data.headline || '',
            summary: data.summary || '',
            profile_pic_url: data.profile_pic_url || '',
            public_identifier: data.public_identifier || username,
            skills: (data.skills || []).map((s: string) => s),
            experiences: (data.experiences || []).map((exp: any) => ({
              title: exp.title || '',
              company: exp.company || '',
              duration: exp.starts?.year 
                ? `${exp.starts.year} - ${exp.ends?.year || 'Devam ediyor'}`
                : '',
              description: exp.description || '',
            })),
            education: (data.education || []).map((edu: any) => ({
              school: edu.school || '',
              degree: edu.degree_name || '',
              field: edu.field_of_study || '',
              dates: edu.starts?.year 
                ? `${edu.starts.year} - ${edu.ends?.year || ''}`
                : '',
            })),
            certifications: (data.certifications || []).map((cert: any) => ({
              name: cert.name || '',
              authority: cert.authority || '',
            })),
            languages: (data.languages || []).map((lang: string) => lang),
            location: data.city ? `${data.city}, ${data.country_full_name || ''}` : '',
          };

          return new Response(JSON.stringify({ 
            success: true, 
            profile,
            source: 'linkedin_api'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (apiError) {
        console.error('Proxycurl API error:', apiError);
        // Fall through to mock data
      }
    }

    // Mock data when no API key is available
    // This helps users test the feature
    const mockProfile = {
      full_name: "Demo User",
      headline: "Software Developer | Full Stack | React | Node.js",
      summary: "Experienced software developer with expertise in modern web technologies.",
      profile_pic_url: `https://ui-avatars.com/api/?name=${username}&background=0077B5&color=fff`,
      public_identifier: username,
      skills: [
        "JavaScript", "TypeScript", "React", "Node.js", "Python",
        "SQL", "Git", "Agile", "Project Management", "Leadership"
      ],
      experiences: [
        {
          title: "Senior Software Developer",
          company: "Tech Company",
          duration: "2021 - Devam ediyor",
          description: "Full stack development with React and Node.js",
        },
        {
          title: "Software Developer",
          company: "Startup Inc",
          duration: "2018 - 2021",
          description: "Building scalable web applications",
        }
      ],
      education: [
        {
          school: "Demo University",
          degree: "Bachelor's Degree",
          field: "Computer Science",
          dates: "2014 - 2018",
        }
      ],
      certifications: [
        { name: "AWS Solutions Architect", authority: "Amazon Web Services" },
        { name: "Google Cloud Professional", authority: "Google" }
      ],
      languages: ["Türkçe", "İngilizce"],
      location: "İstanbul, Türkiye",
    };

    return new Response(JSON.stringify({ 
      success: true, 
      profile: mockProfile,
      source: 'mock_data',
      message: 'Bu demo verisidir. Gerçek LinkedIn verisi için PROXYCURL_API_KEY secret ekleyin.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
