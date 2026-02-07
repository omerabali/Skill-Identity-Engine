import { supabase } from "@/integrations/supabase/client";

interface ExtractedSkill {
  name: string;
  category: string;
  level?: string;
  confidence?: number;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// Map common skill names to normalized versions
const normalizeSkillName = (name: string): string => {
  const normalizations: Record<string, string> = {
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'py': 'Python',
    'python': 'Python',
    'react.js': 'React',
    'reactjs': 'React',
    'node.js': 'Node.js',
    'nodejs': 'Node.js',
    'vue.js': 'Vue.js',
    'vuejs': 'Vue.js',
    'angular.js': 'Angular',
    'angularjs': 'Angular',
    'postgres': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'mongo': 'MongoDB',
    'mongodb': 'MongoDB',
    'aws': 'AWS',
    'gcp': 'Google Cloud',
    'azure': 'Azure',
    'k8s': 'Kubernetes',
    'kubernetes': 'Kubernetes',
    'docker': 'Docker',
    'git': 'Git',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'css3': 'CSS',
    'css': 'CSS',
    'html5': 'HTML',
    'html': 'HTML',
    'sass': 'Sass',
    'scss': 'Sass',
    'tailwindcss': 'Tailwind CSS',
    'tailwind': 'Tailwind CSS',
    'nextjs': 'Next.js',
    'next.js': 'Next.js',
    'expressjs': 'Express.js',
    'express.js': 'Express.js',
    'express': 'Express.js',
  };

  const lower = name.toLowerCase().trim();
  return normalizations[lower] || name;
};

// Convert level to confidence score
const levelToConfidence = (level: string): number => {
  const levelMap: Record<string, number> = {
    'expert': 90,
    'advanced': 80,
    'senior': 80,
    'proficient': 70,
    'intermediate': 60,
    'mid': 60,
    'junior': 40,
    'beginner': 30,
    'learning': 20,
  };

  const lower = level.toLowerCase();
  return levelMap[lower] || 50;
};

export async function importSkillsFromCV(
  userId: string,
  extractedSkills: ExtractedSkill[],
  existingSkillIds: string[]
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  // Fetch all available skills from database
  const { data: allSkills, error: fetchError } = await supabase
    .from('skills')
    .select('id, name, category');

  if (fetchError || !allSkills) {
    result.errors.push('Beceri listesi alınamadı');
    return result;
  }

  // Create a map for quick lookup (lowercase name -> skill)
  const skillMap = new Map<string, { id: string; name: string; category: string }>();
  allSkills.forEach(skill => {
    skillMap.set(skill.name.toLowerCase(), skill);
  });

  // Process each extracted skill
  for (const extracted of extractedSkills) {
    try {
      const normalizedName = normalizeSkillName(extracted.name);
      const matchedSkill = skillMap.get(normalizedName.toLowerCase());

      if (!matchedSkill) {
        result.skipped++;
        continue;
      }

      // Check if already exists
      if (existingSkillIds.includes(matchedSkill.id)) {
        result.skipped++;
        continue;
      }

      // Calculate confidence score
      let confidenceScore = 50;
      if (extracted.level) {
        confidenceScore = levelToConfidence(extracted.level);
      } else if (extracted.confidence) {
        confidenceScore = extracted.confidence;
      }

      // Insert the skill
      const { error: insertError } = await supabase
        .from('user_skills')
        .insert({
          user_id: userId,
          skill_id: matchedSkill.id,
          confidence_score: confidenceScore,
          contribution_score: Math.round(confidenceScore * 0.5),
        });

      if (insertError) {
        result.errors.push(`${normalizedName}: ${insertError.message}`);
      } else {
        result.imported++;
        existingSkillIds.push(matchedSkill.id); // Prevent duplicates in same batch
      }
    } catch (err) {
      result.errors.push(`${extracted.name}: İşlem hatası`);
    }
  }

  return result;
}

export async function importSkillsFromGitHub(
  userId: string,
  detectedSkills: { name: string; category: string; confidence: number }[],
  existingSkillIds: string[]
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  // Fetch all available skills from database
  const { data: allSkills, error: fetchError } = await supabase
    .from('skills')
    .select('id, name, category');

  if (fetchError || !allSkills) {
    result.errors.push('Beceri listesi alınamadı');
    return result;
  }

  // Create a map for quick lookup
  const skillMap = new Map<string, { id: string; name: string; category: string }>();
  allSkills.forEach(skill => {
    skillMap.set(skill.name.toLowerCase(), skill);
  });

  for (const detected of detectedSkills) {
    try {
      const normalizedName = normalizeSkillName(detected.name);
      const matchedSkill = skillMap.get(normalizedName.toLowerCase());

      if (!matchedSkill) {
        result.skipped++;
        continue;
      }

      if (existingSkillIds.includes(matchedSkill.id)) {
        result.skipped++;
        continue;
      }

      const { error: insertError } = await supabase
        .from('user_skills')
        .insert({
          user_id: userId,
          skill_id: matchedSkill.id,
          confidence_score: detected.confidence,
          contribution_score: Math.round(detected.confidence * 0.6),
        });

      if (insertError) {
        result.errors.push(`${normalizedName}: ${insertError.message}`);
      } else {
        result.imported++;
        existingSkillIds.push(matchedSkill.id);
      }
    } catch (err) {
      result.errors.push(`${detected.name}: İşlem hatası`);
    }
  }

  return result;
}
