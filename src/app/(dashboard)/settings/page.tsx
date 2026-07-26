"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { User, Palette, Bell, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Persona } from "@/types";

export default function SettingsPage() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  const fullName = user?.fullName || user?.firstName || "";
  const [displayName, setDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (fullName) setDisplayName(fullName);
  }, [fullName]);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaLoading, setPersonaLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPersona, setNewPersona] = useState({ name: "", description: "", systemPrompt: "" });
  const [addSaving, setAddSaving] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  });

  // Fetch personas
  useEffect(() => {
    fetch("/api/personas")
      .then((res) => res.json())
      .then((data: Persona[]) => {
        setPersonas(data);
        setPersonaLoading(false);
      })
      .catch(() => setPersonaLoading(false));
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setProfileSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  }, [displayName]);

  const handleAddPersona = useCallback(async () => {
    if (!newPersona.name.trim() || !newPersona.systemPrompt.trim()) {
      toast.error("Name and system prompt are required");
      return;
    }
    setAddSaving(true);
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPersona),
      });
      if (!res.ok) throw new Error("Failed to create persona");
      const created: Persona = await res.json();
      setPersonas((prev) => [created, ...prev]);
      setNewPersona({ name: "", description: "", systemPrompt: "" });
      setShowAddForm(false);
      toast.success("Persona created");
    } catch {
      toast.error("Failed to create persona");
    } finally {
      setAddSaving(false);
    }
  }, [newPersona]);

  const handleDeletePersona = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/personas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete persona");
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      toast.success("Persona deleted");
    } catch {
      toast.error("Failed to delete persona");
    }
  }, []);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <Input value={user?.primaryEmailAddress?.emailAddress || ""} disabled />
                </div>
                <Button onClick={handleSaveProfile} disabled={profileSaving}>
                  {profileSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Personas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {personaLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : personas.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No custom personas yet. Add one below.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {personas.map((persona) => (
                      <div
                        key={persona.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: persona.color }}
                          />
                          <div>
                            <p className="font-medium text-sm">{persona.name}</p>
                            {persona.description && (
                              <p className="text-xs text-muted-foreground">{persona.description}</p>
                            )}
                          </div>
                          {persona.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePersona(persona.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {!showAddForm ? (
                  <Button variant="outline" className="mt-3 gap-2" onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4" />
                    Add Persona
                  </Button>
                ) : (
                  <div className="space-y-3 border rounded-lg p-4 mt-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Name</label>
                      <Input
                        value={newPersona.name}
                        onChange={(e) => setNewPersona((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Code Reviewer"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                      <Input
                        value={newPersona.description}
                        onChange={(e) => setNewPersona((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Brief description of this persona"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">System Prompt</label>
                      <textarea
                        value={newPersona.systemPrompt}
                        onChange={(e) => setNewPersona((p) => ({ ...p, systemPrompt: e.target.value }))}
                        placeholder="You are a..."
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddPersona} disabled={addSaving}>
                        {addSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Create Persona
                      </Button>
                      <Button variant="outline" onClick={() => { setShowAddForm(false); setNewPersona({ name: "", description: "", systemPrompt: "" }); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                      theme === t && "border-primary bg-primary/5"
                    )}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2"
                      style={{ borderColor: theme === t ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                    />
                    <span className="capitalize">{t}</span>
                    {t === "system" && (
                      <Badge className="ml-auto" variant="secondary">Default</Badge>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "email" as const, label: "Email notifications", description: "Receive email updates about your account" },
                  { key: "push" as const, label: "Push notifications", description: "Browser push notifications" },
                  { key: "marketing" as const, label: "Marketing emails", description: "Product updates and news" },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      checked={notifications[key]}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
                try {
                  const res = await fetch("/api/user/delete", { method: "DELETE" });
                  if (!res.ok) throw new Error("Failed to delete account");
                  window.location.href = "/";
                } catch {
                  toast.error("Failed to delete account");
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
