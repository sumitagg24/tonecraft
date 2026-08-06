"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/suite/PageHeader";
import {
  Plug, Loader2, Check, Unplug, Cloud, Mail, CalendarDays,
  FileText, Bot, Code2, MessagesSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  service: string;
  status: string;
  error: string | null;
  connectedAt: string | null;
}

const SERVICE_META: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  google_drive: { label: "Google Drive", icon: <Cloud className="w-5 h-5" />, description: "Import and reference files in your prompts" },
  notion: { label: "Notion", icon: <FileText className="w-5 h-5" />, description: "Sync pages and databases" },
  github: { label: "GitHub", icon: <Code2 className="w-5 h-5" />, description: "Analyze repos and pull requests" },
  slack: { label: "Slack", icon: <MessagesSquare className="w-5 h-5" />, description: "Send summaries and drafts to channels" },
  discord: { label: "Discord", icon: <Bot className="w-5 h-5" />, description: "Post to servers and threads" },
  gmail: { label: "Gmail", icon: <Mail className="w-5 h-5" />, description: "Read and draft emails" },
  calendar: { label: "Calendar", icon: <CalendarDays className="w-5 h-5" />, description: "Read and create events" },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIntegrations(await api<Integration[]>("/api/integrations"));
    } catch {
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Handle the OAuth callback redirect: /integrations?connected=slack or ?error=…
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (!connected && !error) return;
    if (connected) {
      toast.success(`${SERVICE_META[connected]?.label ?? connected} connected`);
    } else if (error) {
      const messages: Record<string, string> = {
        denied: "Connection cancelled.",
        state_mismatch: "OAuth state mismatch — please try again.",
        unauthorized: "Please sign in and try again.",
        not_configured: "OAuth not configured — add client credentials to .env.",
        exchange_failed: "Could not complete the connection.",
      };
      toast.error(messages[error] ?? "Connection failed.");
    }
    window.history.replaceState({}, "", "/integrations");
    load();
  }, [load]);

  const connect = async (service: string) => {
    setBusy(service);
    try {
      const res = await api<{ oauth?: boolean; authUrl?: string } | Integration>(
        `/api/integrations/${service}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "connect" }),
        }
      );
      if ("authUrl" in res && res.authUrl) {
        // Real OAuth — follow the provider consent screen; the callback returns here.
        window.location.assign(res.authUrl);
        return;
      }
      await load();
      toast.success(`${SERVICE_META[service]?.label ?? service} connected`);
    } catch {
      toast.error("Connection failed");
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async (service: string) => {
    setBusy(service);
    try {
      await api(`/api/integrations/${service}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      await load();
      toast.success(`${SERVICE_META[service]?.label ?? service} disconnected`);
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Integrations"
          description="Connect the tools you already work in"
          icon={<Plug className="w-4 h-4" />}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => {
              const meta = SERVICE_META[integration.service] ?? {
                label: integration.service,
                icon: <Plug className="w-5 h-5" />,
                description: "",
              };
              const isConnected = integration.status === "connected";
              return (
                <Card key={integration.id} className="group">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-foreground">
                        {meta.icon}
                      </div>
                      <Badge className={cn(
                        "text-[10px]",
                        isConnected
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border/30"
                      )}>
                        {isConnected ? "Connected" : integration.status === "connecting" ? "Connecting…" : "Not connected"}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{meta.label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                    </div>
                    {isConnected && integration.connectedAt && (
                      <p className="text-[11px] text-muted-foreground/60">
                        Connected {new Date(integration.connectedAt).toLocaleDateString()}
                      </p>
                    )}
                    {integration.error && (
                      <p className="text-[11px] text-destructive">{integration.error}</p>
                    )}
                    <div className="pt-1">
                      {isConnected ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-1.5"
                          onClick={() => disconnect(integration.service)}
                          disabled={busy === integration.service}
                        >
                          {busy === integration.service ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unplug className="w-3.5 h-3.5" />}
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={() => connect(integration.service)}
                          disabled={busy === integration.service}
                        >
                          {busy === integration.service ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
