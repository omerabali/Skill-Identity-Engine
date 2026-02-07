-- CV Analyses table
CREATE TABLE public.cv_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  cv_text TEXT,
  overall_score INTEGER DEFAULT 0,
  experience_score INTEGER DEFAULT 0,
  education_score INTEGER DEFAULT 0,
  skills_score INTEGER DEFAULT 0,
  format_score INTEGER DEFAULT 0,
  language_score INTEGER DEFAULT 0,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  extracted_skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cv_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies for cv_analyses
CREATE POLICY "Users can view their own CV analyses"
ON public.cv_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own CV analyses"
ON public.cv_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CV analyses"
ON public.cv_analyses FOR DELETE
USING (auth.uid() = user_id);

-- GitHub Analyses table
CREATE TABLE public.github_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  github_username TEXT NOT NULL,
  avatar_url TEXT,
  profile_url TEXT,
  bio TEXT,
  public_repos INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  overall_score INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  diversity_score INTEGER DEFAULT 0,
  contribution_score INTEGER DEFAULT 0,
  languages JSONB DEFAULT '{}'::jsonb,
  top_repos JSONB DEFAULT '[]'::jsonb,
  detected_skills JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.github_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies for github_analyses
CREATE POLICY "Users can view their own GitHub analyses"
ON public.github_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own GitHub analyses"
ON public.github_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own GitHub analyses"
ON public.github_analyses FOR DELETE
USING (auth.uid() = user_id);