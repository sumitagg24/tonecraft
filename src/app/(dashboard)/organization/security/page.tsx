"use client";
import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Save, KeyRound, Timer, Laptop, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface OrgSummary { id: string; name: string; }

interface Policy {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
  enforce2fa: boolean;
  sessionTimeoutMinutes: number;
  maxDevices: number;
  passwordExpiryDays: number | null;
  ipAllowlist: string[];
}

const EMPTY_POLICY: Policy = {
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSymbol: false,
  enforce2fa: false,
  sessionTimeoutMinutes: 60,
  maxDevices: 5,
  passwordExpiryDays: null,
  ipAllowlist: [],
};

export default function OrgSecurityPage() {
  const [orgId, setOrgId] = useState("");
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [policy, setPolicy] = useState<Policy>(EMPTY_POLICY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ipText, setIpText] = useState("");

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

  const fetchPolicy = useCallback(async () => {
    if (!orgId) return;
    try {
      const p = await api<Policy>(`/api/organizations/${orgId}/security`);
      setPolicy(p);
      setIpText(p.ipAllowlist.join(", "));
    } catch {
      toast.error("Failed to load security policy");
    }
  }, [orgId]);

  useEffect(() => { fetchPolicy(); }, [fetchPolicy]);

  const toggle = (key: keyof Policy) => setPolicy((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const ipAllowlist = ipText.split(",").map((s) => s.trim()).filter(Boolean);
      await api(`/api/organizations/${orgId}/security`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...policy, ipAllowlist }),
      });
      toast.success("Security policy saved");
    } catch {
      toast.error("Failed to save security policy");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6"><div className="h-8 w-56 bg-muted/30 rounded animate-pulse" /></div>;
  }

  if (orgs.length === 0) {
    return (
      <div className="p-6">
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">Create an organization first to manage security.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Security Policy
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Password, 2FA, session, and device rules for the org</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Password policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Minimum length</span>
              <Input
                type="number"
                min={6}
                max={64}
                value={policy.minPasswordLength}
                onChange={(e) => setPolicy({ ...policy, minPasswordLength: Number(e.target.value) })}
                className="mt-1 max-w-[160px]"
              />
            </label>
            {([
              ["requireUppercase", "Require uppercase letter"],
              ["requireNumber", "Require number"],
              ["requireSymbol", "Require symbol"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-lg border border-border/20 px-4 py-3 cursor-pointer">
                <span className="text-sm">{label}</span>
                <input type="checkbox" checked={policy[key]} onChange={() => toggle(key)} className="h-4 w-4 accent-primary" />
              </label>
            ))}
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Password expiry (days, empty = never)</span>
              <Input
                type="number"
                min={30}
                max={730}
                placeholder="Never"
                value={policy.passwordExpiryDays ?? ""}
                onChange={(e) => setPolicy({ ...policy, passwordExpiryDays: e.target.value ? Number(e.target.value) : null })}
                className="mt-1 max-w-[160px]"
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Access controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between rounded-lg border border-border/20 px-4 py-3 cursor-pointer">
              <div>
                <div className="text-sm">Require 2FA</div>
                <div className="text-xs text-muted-foreground">All members must enroll a second factor</div>
              </div>
              <input type="checkbox" checked={policy.enforce2fa} onChange={() => toggle("enforce2fa")} className="h-4 w-4 accent-primary" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Session timeout (minutes)</span>
              <Input
                type="number"
                min={5}
                max={1440}
                value={policy.sessionTimeoutMinutes}
                onChange={(e) => setPolicy({ ...policy, sessionTimeoutMinutes: Number(e.target.value) })}
                className="mt-1 max-w-[160px]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Max concurrent devices</span>
              <Input
                type="number"
                min={1}
                max={50}
                value={policy.maxDevices}
                onChange={(e) => setPolicy({ ...policy, maxDevices: Number(e.target.value) })}
                className="mt-1 max-w-[160px]"
              />
            </label>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Timer className="w-4 h-4" /> IP allowlist</CardTitle>
            <CardDescription>Comma-separated IPs / CIDRs allowed to access org resources. Empty = allow all.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="203.0.113.10, 198.51.100.0/24"
              value={ipText}
              onChange={(e) => setIpText(e.target.value)}
            />
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Laptop className="w-4 h-4" />
              Enforcement hooks are wired via SecurityPolicyService (evaluatePassword, isSessionExpired, isIpAllowed).
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
