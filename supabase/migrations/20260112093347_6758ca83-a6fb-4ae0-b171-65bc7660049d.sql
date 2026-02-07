-- Learning resources table for roadmap recommendations
CREATE TABLE public.learning_resources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('course', 'tutorial', 'project', 'article', 'video', 'book')),
    url TEXT,
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_hours INTEGER DEFAULT 1,
    provider TEXT,
    is_free BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Skill assessment questions table
CREATE TABLE public.skill_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of {text: string, isCorrect: boolean}
    explanation TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coding challenges table
CREATE TABLE public.coding_challenges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    starter_code TEXT,
    test_cases JSONB NOT NULL, -- Array of {input: string, expected_output: string, description: string}
    solution TEXT,
    hints JSONB, -- Array of strings
    time_limit_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User assessment attempts table
CREATE TABLE public.user_assessment_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    questions_answered INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    time_taken_seconds INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User coding challenge attempts table
CREATE TABLE public.user_challenge_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    challenge_id UUID REFERENCES public.coding_challenges(id) ON DELETE CASCADE NOT NULL,
    submitted_code TEXT NOT NULL,
    passed_tests INTEGER NOT NULL,
    total_tests INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    time_taken_seconds INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI-generated learning roadmaps cache
CREATE TABLE public.user_roadmaps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role_id UUID REFERENCES public.target_roles(id) ON DELETE CASCADE NOT NULL,
    roadmap_data JSONB NOT NULL, -- Generated roadmap content
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Enable RLS on all tables
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roadmaps ENABLE ROW LEVEL SECURITY;

-- Public read access for resources, questions, challenges
CREATE POLICY "Anyone can view learning resources" ON public.learning_resources FOR SELECT USING (true);
CREATE POLICY "Anyone can view skill questions" ON public.skill_questions FOR SELECT USING (true);
CREATE POLICY "Anyone can view coding challenges" ON public.coding_challenges FOR SELECT USING (true);

-- User-specific policies for attempts and roadmaps
CREATE POLICY "Users can view their own assessment attempts" ON public.user_assessment_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assessment attempts" ON public.user_assessment_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own challenge attempts" ON public.user_challenge_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own challenge attempts" ON public.user_challenge_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own roadmaps" ON public.user_roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own roadmaps" ON public.user_roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own roadmaps" ON public.user_roadmaps FOR DELETE USING (auth.uid() = user_id);