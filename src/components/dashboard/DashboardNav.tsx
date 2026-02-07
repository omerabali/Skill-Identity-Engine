import { Terminal, LogOut, LayoutDashboard, Target, GitBranch, User, FileText, Github, GraduationCap, Code, Map, GitCompare, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const DashboardNav = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
    { path: "/dashboard/ai-coach", label: "AI Koç", icon: Bot },
    { path: "/dashboard/cv", label: "CV Analizi", icon: FileText },
    { path: "/dashboard/github", label: "GitHub", icon: Github },
    { path: "/dashboard/compare", label: "Karşılaştır", icon: GitCompare },
    { path: "/dashboard/skills", label: "Becerilerim", icon: GitBranch },
    { path: "/dashboard/roles", label: "Hedef Roller", icon: Target },
    { path: "/dashboard/roadmap", label: "Yol Haritası", icon: Map },
    { path: "/dashboard/assessments", label: "Sınavlar", icon: GraduationCap },
    { path: "/dashboard/challenges", label: "Kod Görevi", icon: Code },
    { path: "/dashboard/profile", label: "Profil", icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="w-full px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img src="/Copy%20of%20CV%20Analysis%20Visualization.png" alt="Nexus AI Logo" className="w-9 h-9 rounded-lg object-contain bg-primary/10" />
            <span className="font-bold text-lg hidden sm:block">Nexus AI</span>
          </div>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className="gap-2 shrink-0"
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden xl:inline">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Mobile nav */}
          <div className="lg:hidden flex items-center gap-1 overflow-x-auto max-w-[50vw]">
            {navItems.slice(0, 4).map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "secondary" : "ghost"}
                size="icon"
                onClick={() => navigate(item.path)}
                className="shrink-0"
              >
                <item.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          {/* User section */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Çıkış</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
