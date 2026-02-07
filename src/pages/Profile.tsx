import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Loader2, Save, Github, Linkedin, Mail, Lock, Key } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Profile {
  display_name: string | null;
  bio: string | null;
  job_title: string | null;
  company: string | null;
  years_experience: number | null;
  linkedin_url: string | null;
  github_username: string | null;
}

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({
    display_name: "",
    bio: "",
    job_title: "",
    company: "",
    years_experience: 0,
    linkedin_url: "",
    github_username: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Security state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updatingAuth, setUpdatingAuth] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      setNewEmail(user.email || "");
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (!error && data) {
      setProfile({
        display_name: data.display_name || "",
        bio: data.bio || "",
        job_title: data.job_title || "",
        company: data.company || "",
        years_experience: data.years_experience || 0,
        linkedin_url: data.linkedin_url || "",
        github_username: data.github_username || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("user_id", user?.id);

    if (error) {
      toast.error("Profil kaydedilemedi");
    } else {
      toast.success("Profil başarıyla kaydedildi");
    }
    setSaving(false);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) return;

    setUpdatingAuth(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      toast.error("Email güncellenemedi: " + error.message);
    } else {
      toast.success("Doğrulama bağlantısı yeni email adresinize gönderildi.");
    }
    setUpdatingAuth(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    if (newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }

    setUpdatingAuth(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error("Şifre güncellenemedi: " + error.message);
    } else {
      toast.success("Şifre başarıyla güncellendi");
      setNewPassword("");
    }
    setUpdatingAuth(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">Profil Ayarları</h1>
            <p className="text-muted-foreground">Kişisel bilgilerinizi ve hesap güvenliğinizi yönetin</p>
          </motion.div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="security">Hesap & Güvenlik</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-xl border border-border bg-card/50 space-y-6"
              >
                {/* Avatar section */}
                <div className="flex items-center gap-4 pb-6 border-b border-border">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{profile.display_name || "Kullanıcı"}</h2>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                {/* Basic info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Kullanıcı Adı</Label>
                    <Input
                      id="display_name"
                      value={profile.display_name || ""}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                      className="bg-muted/50"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job_title">Unvan</Label>
                    <Input
                      id="job_title"
                      value={profile.job_title || ""}
                      onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                      placeholder="örn. Kıdemli Frontend Geliştirici"
                      className="bg-muted/50"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Şirket</Label>
                    <Input
                      id="company"
                      value={profile.company || ""}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="years_experience">Deneyim Yılı</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      min={0}
                      value={profile.years_experience || 0}
                      onChange={(e) => setProfile({ ...profile, years_experience: parseInt(e.target.value) || 0 })}
                      className="bg-muted/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Hakkında</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ""}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Kendiniz ve kariyer hedefleriniz hakkında bilgi verin..."
                    rows={4}
                    className="bg-muted/50 resize-none"
                  />
                </div>

                {/* Social links */}
                <div className="pt-6 border-t border-border space-y-4">
                  <h3 className="font-semibold text-foreground">Sosyal Bağlantılar</h3>

                  <div className="space-y-2">
                    <Label htmlFor="github_username" className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      GitHub Kullanıcı Adı
                    </Label>
                    <Input
                      id="github_username"
                      value={profile.github_username || ""}
                      onChange={(e) => setProfile({ ...profile, github_username: e.target.value })}
                      placeholder="kullaniciadi"
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn URL
                    </Label>
                    <Input
                      id="linkedin_url"
                      value={profile.linkedin_url || ""}
                      onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="bg-muted/50"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Değişiklikleri Kaydet
                </Button>
              </motion.div>
            </TabsContent>

            <TabsContent value="security">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid gap-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Email Adresi</CardTitle>
                    <CardDescription>
                      Hesabınıza giriş yapmak için kullandığınız email adresini güncelleyin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex gap-4">
                        <Input
                          id="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="bg-muted/50"
                        />
                        <Button
                          onClick={handleUpdateEmail}
                          disabled={updatingAuth || newEmail === user?.email}
                        >
                          {updatingAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : "Güncelle"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Şifre Değiştir</CardTitle>
                    <CardDescription>
                      Hesap güvenliğiniz için güçlü bir şifre belirleyin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Yeni Şifre</Label>
                      <div className="flex gap-4">
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-muted/50"
                        />
                        <Button
                          onClick={handleUpdatePassword}
                          disabled={updatingAuth || !newPassword}
                        >
                          {updatingAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : "Güncelle"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
