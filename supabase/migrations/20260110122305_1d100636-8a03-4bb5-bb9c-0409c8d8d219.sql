-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  job_title TEXT,
  company TEXT,
  years_experience INTEGER DEFAULT 0,
  linkedin_url TEXT,
  github_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create target roles table (predefined roles users can aim for)
CREATE TABLE public.target_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skills table (master list of skills)
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_skill_requirements (which skills each role requires)
CREATE TABLE public.role_skill_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.target_roles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  required_level INTEGER NOT NULL CHECK (required_level >= 0 AND required_level <= 100),
  importance TEXT NOT NULL CHECK (importance IN ('critical', 'important', 'nice-to-have')),
  UNIQUE (role_id, skill_id)
);

-- Create user_skills (user's actual skills with confidence)
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  confidence_score INTEGER NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  projects_score INTEGER DEFAULT 0,
  time_score INTEGER DEFAULT 0,
  assessment_score INTEGER DEFAULT 0,
  contribution_score INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);

-- Create user_projects (projects as evidence)
CREATE TABLE public.user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  github_url TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_skills (skills used in each project)
CREATE TABLE public.project_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.user_projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  depth_level TEXT NOT NULL CHECK (depth_level IN ('basic', 'intermediate', 'advanced', 'expert')),
  UNIQUE (project_id, skill_id)
);

-- Create user_target_roles (roles users are aiming for)
CREATE TABLE public.user_target_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.target_roles(id) ON DELETE CASCADE,
  fit_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_skill_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_target_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for target_roles (public read)
CREATE POLICY "Anyone can view target roles" ON public.target_roles FOR SELECT USING (true);

-- RLS Policies for skills (public read)
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);

-- RLS Policies for role_skill_requirements (public read)
CREATE POLICY "Anyone can view role skill requirements" ON public.role_skill_requirements FOR SELECT USING (true);

-- RLS Policies for user_skills
CREATE POLICY "Users can view their own skills" ON public.user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own skills" ON public.user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own skills" ON public.user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own skills" ON public.user_skills FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_projects
CREATE POLICY "Users can view their own projects" ON public.user_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON public.user_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.user_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.user_projects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_skills (via project ownership)
CREATE POLICY "Users can view skills of their projects" ON public.project_skills FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.user_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert skills to their projects" ON public.project_skills FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete skills from their projects" ON public.project_skills FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.user_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for user_target_roles
CREATE POLICY "Users can view their target roles" ON public.user_target_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their target roles" ON public.user_target_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their target roles" ON public.user_target_roles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their target roles" ON public.user_target_roles FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_skills_updated_at BEFORE UPDATE ON public.user_skills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON public.user_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();