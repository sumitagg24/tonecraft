"use client";
import { useState, useEffect, useCallback } from "react";
import { Palette, Save, Image as ImageIcon, Globe, Mail, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { brandingCssVars, normalizeHexColor, type OrgBranding } from "@/lib/branding";

interface OrgSummary { id: string; name: string; }

const EMPTY_BRANDING: OrgBranding = {
  logoUrl: null,
  primaryColor: null,
  accentColor: null,
  customDomain: null,
  supportEmail: null,
};

export default function OrgBrandingPage() {
  const [orgId, setOrgId] = useState("");
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [branding, setBranding] = useState<OrgBranding>(EMPTY_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const fetchOrgs = useCallback(async () => {
    try {
      const list = await api<OrgSummary[]>("/api/organizations");
      setOrgs(list);
      if (list.length > 0) setOrgId((prev) => (prev && list.some((o) => o.id === prev) ? prev : list[0].id));
    } catch {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const fetchBranding = useCallback(async () => {
    if (!orgId) return;
    try {
      const b = await api<OrgBranding>(`/api/organizations/${orgId}/branding`);
      setBranding(b ?? EMPTY_BRANDING);
    } catch {
      toast.error("Failed to load branding");
    }
  }, [orgId]);

  useEffect(() => { fetchBranding(); }, [fetchBranding]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api(`/api/organizations/${orgId}/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      toast.success("Branding saved");
      fetchBranding();
    } catch {
      toast.error("Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  const primary = normalizeHexColor(branding.primaryColor) ?? "#6366f1";
  const accent = normalizeHexColor(branding.accentColor) ?? "#8b5cf6";
  const previewVars = brandingCssVars(branding);

  if (loading) {
    return <div className="p-6"><div className="h-8 w-56 bg-muted/30 rounded animate-pulse" /></div>;
  }

  if (orgs.length === 0) {
    return (
      <div className="p-6">
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">Create an organization first to configure branding.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            White-Label Branding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Custom logo, colors, and domain for your organization</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm"
            aria-label="Select organization"
          >
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => setPreview((v) => !v)}>
            <Eye className="w-4 h-4 mr-1" /> Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Logo URL</span>
              <Input
                placeholder="https://cdn.example.com/logo.png"
                value={branding.logoUrl ?? ""}
                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value || null })}
                className="mt-1"
              />
            </label>
            {branding.logoUrl && (
              <div className="rounded-xl border border-border/20 p-4 flex items-center justify-center bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={branding.logoUrl} alt="Logo preview" className="max-h-16 object-contain" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="w-4 h-4" /> Colors</CardTitle>
            <CardDescription>Primary drives buttons/accents; accent is the secondary brand color</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Primary color</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="h-10 w-14 cursor-pointer rounded border border-border/40 bg-transparent"
                  aria-label="Primary color"
                />
                <Input
                  value={primary}
                  onChange={(e) => setBranding({ ...branding, primaryColor: normalizeHexColor(e.target.value) })}
                  className="max-w-[140px] font-mono"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Accent color</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                  className="h-10 w-14 cursor-pointer rounded border border-border/40 bg-transparent"
                  aria-label="Accent color"
                />
                <Input
                  value={accent}
                  onChange={(e) => setBranding({ ...branding, accentColor: normalizeHexColor(e.target.value) })}
                  className="max-w-[140px] font-mono"
                />
              </div>
            </label>
            <div className="flex gap-3 pt-1">
              <div className="h-10 w-10 rounded-lg" style={{ background: primary }} />
              <div className="h-10 w-10 rounded-lg" style={{ background: accent }} />
              <div className="flex-1 rounded-lg border border-border/20 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {Object.keys(previewVars).length > 0
                  ? Object.entries(previewVars).map(([k, v]) => `${k}: ${v}`).join("\n")
                  : "Default theme — no overrides"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-4 h-4" /> Domain</CardTitle>
            <CardDescription>Custom domain for your org (wired at the hosting layer)</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Custom domain</span>
              <Input
                placeholder="app.yourcompany.com"
                value={branding.customDomain ?? ""}
                onChange={(e) => setBranding({ ...branding, customDomain: e.target.value || null })}
                className="mt-1"
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="w-4 h-4" /> Support</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Support email</span>
              <Input
                type="email"
                placeholder="support@yourcompany.com"
                value={branding.supportEmail ?? ""}
                onChange={(e) => setBranding({ ...branding, supportEmail: e.target.value || null })}
                className="mt-1"
              />
            </label>
          </CardContent>
        </Card>
      </div>

      {preview && (
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Brand preview</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/30 p-6" style={Object.fromEntries(Object.entries(previewVars).map(([k, v]) => [k, `hsl(${v})`]))}>
              <div className="flex items-center gap-3 mb-4">
                {branding.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={branding.logoUrl} alt="logo" className="h-8 w-8 object-contain" />
                ) : (
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: primary, color: "#fff" }}>
                    {(orgs.find((o) => o.id === orgId)?.name ?? "A").slice(0, 1)}
                  </div>
                )}
                <span className="font-semibold">{orgs.find((o) => o.id === orgId)?.name ?? "Company"}</span>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: primary }}>
                  Primary button
                </button>
                <button className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: accent, color: "#fff" }}>
                  Accent button
                </button>
                <button className="rounded-lg px-4 py-2 text-sm font-medium border border-border/40">Outlined</button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
