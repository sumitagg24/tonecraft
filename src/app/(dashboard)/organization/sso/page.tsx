"use client";
import { useState, useEffect, useCallback } from "react";
import { KeyRound, Save, Lock, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface OrgSummary { id: string; name: string; }

interface SsoProviderConfig {
  provider: "google_workspace" | "azure_ad" | "okta";
  enabled: boolean;
  domains: string[];
}

interface SsoConfig {
  enforced: boolean;
  providers: SsoProviderConfig[];
  samlMetadataUrl: string | null;
}

const PROVIDER_LABELS: Record<string, string> = {
  google_workspace: "Google Workspace",
  azure_ad: "Azure AD / Entra ID",
  okta: "Okta",
};

const EMPTY_SSO: SsoConfig = {
  enforced: false,
  providers: [
    { provider: "google_workspace", enabled: false, domains: [] },
    { provider: "azure_ad", enabled: false, domains: [] },
    { provider: "okta", enabled: false, domains: [] },
  ],
  samlMetadataUrl: null,
};

export default function OrgSsoPage() {
  const [orgId, setOrgId] = useState("");
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [config, setConfig] = useState<SsoConfig>(EMPTY_SSO);
  const [domainsText, setDomainsText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const fetchConfig = useCallback(async () => {
    if (!orgId) return;
    try {
      const c = await api<SsoConfig>(`/api/organizations/${orgId}/sso`);
      setConfig(c);
      const text: Record<string, string> = {};
      for (const p of c.providers) text[p.provider] = p.domains.join(", ");
      setDomainsText(text);
    } catch {
      toast.error("Failed to load SSO config");
    }
  }, [orgId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const providers = config.providers.map((p) => ({
        ...p,
        domains: (domainsText[p.provider] ?? "")
          .split(",")
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean),
      }));
      await api(`/api/organizations/${orgId}/sso`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, providers }),
      });
      toast.success("SSO configuration saved");
      fetchConfig();
    } catch {
      toast.error("Failed to save SSO configuration");
    } finally {
      setSaving(false);
    }
  };

  const toggleProvider = (provider: string) =>
    setConfig((c) => ({
      ...c,
      providers: c.providers.map((p) => (p.provider === provider ? { ...p, enabled: !p.enabled } : p)),
    }));

  if (loading) {
    return <div className="p-6"><div className="h-8 w-56 bg-muted/30 rounded animate-pulse" /></div>;
  }

  if (orgs.length === 0) {
    return (
      <div className="p-6">
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">Create an organization first to configure SSO.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Single Sign-On
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Enforce identity-provider sign-in for the whole org</p>
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
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="w-4 h-4" /> Enforcement</CardTitle>
          <CardDescription>
            When enforced, members can only sign in through an enabled provider, and their email domain must be
            in that provider&apos;s allowlist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between rounded-lg border border-border/20 px-4 py-3 cursor-pointer">
            <div>
              <div className="text-sm font-medium">Enforce SSO</div>
              <div className="text-xs text-muted-foreground">Disable password sign-in for org members</div>
            </div>
            <input type="checkbox" checked={config.enforced} onChange={() => setConfig({ ...config, enforced: !config.enforced })} className="h-4 w-4 accent-primary" />
          </label>
          {config.enforced && <Badge className="mt-3" variant="outline">SSO enforced — password sign-in disabled for members</Badge>}
          {config.enforced &&
            config.providers.filter((p) => p.enabled).length > 0 &&
            config.providers.every((p) => !p.enabled || p.domains.length === 0) && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                SSO is enforced but no enabled provider has domains — member adds are unrestricted until domains
                are entered. Add at least one domain to restrict access.
              </p>
            )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {config.providers.map((p) => (
          <Card key={p.provider}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{PROVIDER_LABELS[p.provider]}</span>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  p.enabled ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border/40"
                )}>
                  {p.enabled ? "Enabled" : "Disabled"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between text-sm">
                Enable provider
                <input type="checkbox" checked={p.enabled} onChange={() => toggleProvider(p.provider)} className="h-4 w-4 accent-primary" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Allowed email domains (comma-separated)
                </span>
                <Input
                  placeholder="acme.com, acme.io"
                  value={domainsText[p.provider] ?? ""}
                  onChange={(e) => setDomainsText({ ...domainsText, [p.provider]: e.target.value })}
                  className="mt-1"
                />
              </label>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SAML metadata</CardTitle>
          <CardDescription>Optional metadata URL for Okta / Azure SAML federation</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="https://your-tenant.okta.com/app/…/sso/saml/metadata"
            value={config.samlMetadataUrl ?? ""}
            onChange={(e) => setConfig({ ...config, samlMetadataUrl: e.target.value || null })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
