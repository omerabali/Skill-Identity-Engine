import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import MySkills from "./pages/MySkills";
import TargetRoles from "./pages/TargetRoles";
import Profile from "./pages/Profile";
import Assessments from "./pages/Assessments";
import Challenges from "./pages/Challenges";
import Roadmap from "./pages/Roadmap";
import CVAnalysis from "./pages/CVAnalysis";
import GitHubAnalysis from "./pages/GitHubAnalysis";
import SkillComparison from "./pages/SkillComparison";
import AICoach from "./pages/AICoach";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/skills" element={<MySkills />} />
              <Route path="/dashboard/roles" element={<TargetRoles />} />
              <Route path="/dashboard/profile" element={<Profile />} />
              <Route path="/dashboard/assessments" element={<Assessments />} />
              <Route path="/dashboard/challenges" element={<Challenges />} />
              <Route path="/dashboard/roadmap" element={<Roadmap />} />
              <Route path="/dashboard/cv" element={<CVAnalysis />} />
              <Route path="/dashboard/github" element={<GitHubAnalysis />} />
              <Route path="/dashboard/compare" element={<SkillComparison />} />
              <Route path="/dashboard/ai-coach" element={<AICoach />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;