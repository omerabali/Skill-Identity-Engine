import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  existingSkillIds: string[];
}

const CATEGORIES = [
  "Programming Languages",
  "Frontend",
  "Backend",
  "Database",
  "DevOps",
  "Cloud",
  "Mobile",
  "Data Science",
  "AI/ML",
  "Security",
  "Testing",
  "Design",
  "Soft Skills",
  "Other",
];

const AddSkillModal = ({ isOpen, onClose, onAdded, existingSkillIds }: AddSkillModalProps) => {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customSkillName, setCustomSkillName] = useState("");
  const [customSkillCategory, setCustomSkillCategory] = useState("");
  const [creatingSkill, setCreatingSkill] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSkills();
      setShowCustomForm(false);
      setCustomSkillName("");
      setCustomSkillCategory("");
    }
  }, [isOpen]);

  const fetchSkills = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .order("category", { ascending: true });
    
    if (!error && data) {
      setSkills(data.filter(s => !existingSkillIds.includes(s.id)));
    }
    setLoading(false);
  };

  const handleCreateCustomSkill = async () => {
    if (!customSkillName.trim() || !customSkillCategory || !user) {
      toast.error("Beceri adı ve kategorisi gerekli");
      return;
    }

    setCreatingSkill(true);
    
    // First check if skill already exists
    const { data: existingSkill } = await supabase
      .from("skills")
      .select("*")
      .ilike("name", customSkillName.trim())
      .single();

    let skillToAdd: Skill;

    if (existingSkill) {
      // Use existing skill
      skillToAdd = existingSkill;
      if (existingSkillIds.includes(existingSkill.id)) {
        toast.error("Bu beceri zaten ekli");
        setCreatingSkill(false);
        return;
      }
    } else {
      // Create new skill
      const { data: newSkill, error: createError } = await supabase
        .from("skills")
        .insert({
          name: customSkillName.trim(),
          category: customSkillCategory,
          description: `Kullanıcı tarafından eklendi`,
        })
        .select()
        .single();

      if (createError || !newSkill) {
        toast.error("Beceri oluşturulamadı");
        setCreatingSkill(false);
        return;
      }
      skillToAdd = newSkill;
    }

    // Now add to user skills
    const { error: addError } = await supabase.from("user_skills").insert({
      user_id: user.id,
      skill_id: skillToAdd.id,
      confidence_score: confidence,
      projects_score: Math.round(confidence * 0.3),
      time_score: Math.round(confidence * 0.25),
      assessment_score: Math.round(confidence * 0.25),
      contribution_score: Math.round(confidence * 0.2),
    });

    if (addError) {
      toast.error("Beceri eklenemedi");
    } else {
      toast.success(`${skillToAdd.name} eklendi`);
      onAdded();
      onClose();
    }
    setCreatingSkill(false);
  };

  const handleAdd = async () => {
    if (!selectedSkill || !user) return;
    
    setSaving(true);
    const { error } = await supabase.from("user_skills").insert({
      user_id: user.id,
      skill_id: selectedSkill.id,
      confidence_score: confidence,
      projects_score: Math.round(confidence * 0.3),
      time_score: Math.round(confidence * 0.25),
      assessment_score: Math.round(confidence * 0.25),
      contribution_score: Math.round(confidence * 0.2),
    });

    if (error) {
      toast.error("Beceri eklenemedi");
    } else {
      toast.success(`${selectedSkill.name} eklendi`);
      onAdded();
      onClose();
      setSelectedSkill(null);
      setConfidence(50);
    }
    setSaving(false);
  };

  const filteredSkills = skills.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedSkills = filteredSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden"
        >
          <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold text-foreground">Beceri Ekle</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {showCustomForm ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setShowCustomForm(false)}>
                      ← Geri
                    </Button>
                    <h3 className="font-medium">Özel Beceri Ekle</h3>
                  </div>

                  <div className="space-y-2">
                    <Label>Beceri Adı</Label>
                    <Input
                      placeholder="örn: Kubernetes, React Native..."
                      value={customSkillName}
                      onChange={(e) => setCustomSkillName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select value={customSkillCategory} onValueChange={setCustomSkillCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seç" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Güven Seviyesi</Label>
                      <span className="font-mono text-primary font-bold">{confidence}%</span>
                    </div>
                    <Slider
                      value={[confidence]}
                      onValueChange={([v]) => setConfidence(v)}
                      min={0}
                      max={100}
                      step={5}
                      className="py-4"
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleCreateCustomSkill} 
                    disabled={creatingSkill || !customSkillName.trim() || !customSkillCategory}
                  >
                    {creatingSkill && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Beceri Ekle
                  </Button>
                </div>
              ) : !selectedSkill ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Beceri ara..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 bg-muted/50"
                    />
                  </div>

                  {/* Custom skill button */}
                  <button
                    onClick={() => setShowCustomForm(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Listede yok mu? Özel beceri ekle</span>
                  </button>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                        <div key={category}>
                          <h4 className="text-xs font-mono text-muted-foreground mb-2">{category}</h4>
                          <div className="flex flex-wrap gap-2">
                            {categorySkills.map((skill) => (
                              <button
                                key={skill.id}
                                onClick={() => setSelectedSkill(skill)}
                                className="px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                              >
                                {skill.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg border border-primary bg-primary/10">
                    <h3 className="font-semibold text-foreground">{selectedSkill.name}</h3>
                    <span className="text-xs text-muted-foreground font-mono">{selectedSkill.category}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Güven Seviyesi</Label>
                      <span className="font-mono text-primary font-bold">{confidence}%</span>
                    </div>
                    <Slider
                      value={[confidence]}
                      onValueChange={([v]) => setConfidence(v)}
                      min={0}
                      max={100}
                      step={5}
                      className="py-4"
                    />
                    <p className="text-xs text-muted-foreground">
                      Yetkinliğinizi dürüstçe değerlendirin. Proje ve kanıt ekledikçe bu değer güncellenecektir.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedSkill(null)}>
                      Geri
                    </Button>
                    <Button className="flex-1" onClick={handleAdd} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Beceri Ekle
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddSkillModal;
