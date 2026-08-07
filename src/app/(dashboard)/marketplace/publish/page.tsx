"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Rocket, ArrowLeft } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const textareaClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
import { toast } from "sonner";
import { PageHeader } from "@/components/suite/PageHeader";

const KINDS = [
  { value: "prompt", label: "Prompt", hint: "A reusable prompt template" },
  { value: "agent", label: "Agent", hint: "A specialized AI agent config" },
  { value: "workflow", label: "Workflow", hint: "A multi-step automation" },
  { value: "persona", label: "Persona", hint: "A voice/persona definition" },
  { value: "template", label: "Template", hint: "A project or document template" },
];

export default function PublishPage() {
  const router = useRouter();
  const [kind, setKind] = useState("prompt");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentText, setContentText] = useState("");
  const [tags, setTags] = useState("");
  const [priceCredits, setPriceCredits] = useState("0");
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async (status: "draft" | "published") => {
    if (title.trim().length < 3 || contentText.trim().length < 10) {
      toast.error("Title (3+ chars) and content (10+ chars) are required");
      return;
    }
    setPublishing(true);
    try {
      const listing = await apiPost<{ id: string }>("/api/marketplace/listings", {
        kind,
        title,
        description: description.trim() || undefined,
        content: { text: contentText },
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10),
        priceCredits: Math.max(0, Number(priceCredits) || 0),
        status,
      });
      toast.success(status === "published" ? "Published to the marketplace!" : "Saved as draft");
      router.push(`/marketplace/${listing.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="mx-auto max-w-[720px] space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <PageHeader
          title="Publish to Marketplace"
          description="Share a prompt, agent, workflow, persona, or template with the community."
          icon={<Store className="h-5 w-5 text-white" />}
        />

        <Card className="border-border/40 bg-card shadow-card rounded-xl">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-base font-semibold">What are you sharing?</CardTitle>
            <CardDescription className="text-xs">Pick the type that best describes your creation.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  onClick={() => setKind(k.value)}
                  className={k.value === kind
                    ? "rounded-lg border border-primary/50 bg-primary/10 p-3 text-left transition-all"
                    : "rounded-lg border border-border/40 p-3 text-left hover:border-border transition-all"}
                  title={k.hint}
                >
                  <Badge variant={k.value === kind ? "default" : "secondary"} className="text-micro">{k.label}</Badge>
                  <p className="mt-1.5 text-micro text-muted-foreground line-clamp-2">{k.hint}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card shadow-card rounded-xl">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Title</label>
              <Input placeholder="A clear, descriptive title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Description</label>
              <textarea className={textareaClass} placeholder="What does this do? Who is it for?" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Content</label>
              <textarea
                className={`${textareaClass} font-mono text-xs`}
                placeholder="The prompt text, agent system prompt, workflow steps, persona definition, or template body…"
                rows={8}
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Tags (comma separated)</label>
                <Input placeholder="marketing, social, email" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Price (credits)</label>
                <Input type="number" min={0} value={priceCredits} onChange={(e) => setPriceCredits(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" disabled={publishing} onClick={() => handlePublish("draft")}>
            Save draft
          </Button>
          <Button variant="gradient" disabled={publishing} onClick={() => handlePublish("published")} className="gap-2">
            <Rocket className="h-4 w-4" />
            {publishing ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
