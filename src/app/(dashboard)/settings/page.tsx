"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  User, Palette, Bell, Plus, Trash2, Loader2, CreditCard,
  ShieldAlert, Users, ChevronRight, Moon, Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { Persona } from "@/types";

type SettingsSection = "profile" | "appearance" | "notifications" | "personas";

const NAV: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "personas", label: "Personas", icon: Users },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const NAV_EXTERNAL: { label: string; href: string; icon: React.ElementType; hint: string }[] = [
  { label: "Billing", href: "/billing", icon: CreditCard, hint: "Plan, credits and invoices" },
];

export default function SettingsPage() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState<SettingsSection>("profile");

  const fullName = user?.fullName || user?.firstName || "";
  const [displayName, setDisplayName] = useState(fullName);
  const [prevFullName, setPrevFullName] = useState(fullName);
  if (fullName !== prevFullName) {
    setPrevFullName(fullName);
    setDisplayName(fullName);
  }
  const [profileSaving, setProfileSaving] = useState(false);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaLoading, setPersonaLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPersona, setNewPersona] = useState({ name: "", description: "", systemPrompt: "" });
  const [addSaving, setAddSaving] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api<Record<string, boolean>>("/api/notifications/preferences")
      .then(setNotifPrefs)
      .catch(() => undefined);
  }, []);

  const togglePref = useCallback(async (key: string, value: boolean) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: value }));
    try {
      await api("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      toast.success("Preference updated");
    } catch {
      setNotifPrefs((prev) => ({ ...prev, [key]: !value }));
      toast.error("Failed to update preference");
    }
  }, []);

  useEffect(() => {
    api<{ personas: Persona[] }>("/api/personas")
      .then((data) => {
        setPersonas(data.personas ?? []);
        setPersonaLoading(false);
      })
      .catch(() => setPersonaLoading(false));
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setProfileSaving(true);
    try {
      await api("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
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
      const created = await api<Persona>("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPersona),
      });
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
      await api(`/api/personas/${id}`, { method: "DELETE" });
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      toast.success("Persona deleted");
    } catch {
      toast.error("Failed to delete persona");
    }
  }, []);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Profile header */}
        <div className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card/60 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-semibold text-brand-foreground shadow-[0_8px_24px_-8px_hsl(var(--brand)/0.5)]">
            {(displayName || user?.primaryEmailAddress?.emailAddress || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">{displayName || "Your account"}</h1>
            <p className="text-sm text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress || "Sign in to see your email"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row">
          {/* Left navigation */}
          <nav className="lg:w-56 shrink-0" aria-label="Settings sections">
            <div className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {NAV.map((item) => {
                const Icon = item.icon;
                const activeItem = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    aria-current={activeItem ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                      activeItem
                        ? "bg-primary/10 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", activeItem && "text-primary")} aria-hidden="true" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
              <div className="hidden lg:block h-px bg-border/40 my-2" aria-hidden="true" />
              {NAV_EXTERNAL.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all duration-150 hover:bg-muted/40 hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="flex-1 whitespace-nowrap">
                      {item.label}
                      <span className="hidden lg:block text-[11px] text-muted-foreground/50">{item.hint}</span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 min-w-0 space-y-5">
            {active === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your display name is shown on shared messages and invites.</CardDescription>
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
            )}

            {active === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Choose how ToneCraft looks on your device.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {([
                    { value: "light", label: "Light", icon: Sun, hint: "Warm editorial whites" },
                    { value: "dark", label: "Dark", icon: Moon, hint: "Near-black studio — default" },
                  ] as const).map(({ value, label, icon: Icon, hint }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={cn(
                        "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all duration-150",
                        theme === value
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/40 hover:border-border/80 hover:bg-muted/30"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", theme === value ? "text-primary" : "text-muted-foreground/60")} aria-hidden="true" />
                      <span className="text-sm font-medium capitalize">{label}</span>
                      <span className="text-xs text-muted-foreground/70">{hint}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {active === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Control how and when ToneCraft reaches you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3 pb-3 border-b border-border/20">
                    <h4 className="text-xs font-semibold text-muted-foreground">Delivery Channels</h4>
                    {[
                      { key: "inAppEnabled", label: "In-app notifications", description: "Bell icon notifications in the app" },
                      { key: "emailEnabled", label: "Email notifications", description: "Send notifications to your email" },
                      { key: "pushEnabled", label: "Push notifications", description: "Browser push notifications" },
                      { key: "realtimeEnabled", label: "Realtime notifications", description: "Live updates via socket connection" },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-sm">{label}</p>
                          <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                        <Switch
                          checked={notifPrefs[key] ?? (key === "inAppEnabled" || key === "emailEnabled" || key === "realtimeEnabled")}
                          onCheckedChange={(checked) => togglePref(key, checked)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground">Categories</h4>
                    {[
                      { key: "generationComplete", label: "Generation finished", description: "When an AI response finishes streaming" },
                      { key: "knowledgeReady", label: "Knowledge indexed", description: "When an uploaded document finishes indexing" },
                      { key: "exportReady", label: "Export completed", description: "When a chat export is ready" },
                      { key: "creditsLow", label: "Credits low", description: "When you are close to your plan limit" },
                      { key: "invite", label: "Team invites", description: "When you are invited to a project or workspace" },
                      { key: "comment", label: "Comments", description: "When someone comments on your messages" },
                      { key: "mention", label: "Mentions", description: "When someone mentions you" },
                      { key: "subscription", label: "Subscription", description: "Billing and subscription updates" },
                      { key: "system", label: "System announcements", description: "Important platform-wide announcements" },
                      { key: "dailyDigest", label: "Daily digest", description: "A daily summary of activity" },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-sm">{label}</p>
                          <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                        <Switch
                          checked={notifPrefs[key] ?? true}
                          onCheckedChange={(checked) => togglePref(key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {active === "personas" && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Personas</CardTitle>
                  <CardDescription>Personas give the AI a consistent voice across chats and tools.</CardDescription>
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
                          className="flex items-center justify-between p-3 rounded-xl border border-border/40"
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
                            aria-label={`Delete persona ${persona.name}`}
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
                    <div className="space-y-3 border rounded-xl p-4 mt-3">
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
                          className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
            )}

            {/* Danger zone */}
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  Danger Zone
                </CardTitle>
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
                      await api("/api/user/delete", { method: "DELETE" });
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
      </div>
    </div>
  );
}
