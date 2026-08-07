"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wand2, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { ToolDefinition } from "./ToolDefinitions";
import { api } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { fadeInUp, expandCollapse, cardTransition } from "@/styles/motion";
import { useRecentTools } from "@/hooks/use-recent-tools";

interface ToolPanelProps {
  tool: ToolDefinition;
  onClose: () => void;
}

export function ToolPanel({ tool, onClose }: ToolPanelProps) {
  const { record } = useRecentTools();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [creativity, setCreativity] = useState([70]);

  const handleExecute = async () => {
    if (!input.trim()) return;
    record(tool.id);
    setLoading(true);
    setResult(null);
    setMetadata(null);
    try {
      const data = await api<{ content: string; metadata: Record<string, unknown> | null }>("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, input, tone, length, creativity: creativity[0] }),
      });
      setResult(data.content);
      setMetadata(data.metadata || null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={cardTransition}
      className="border border-border/40 rounded-2xl bg-card overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}>
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{tool.title}</h3>
            <p className="text-xs text-muted-foreground">{tool.description}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-lg">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs font-medium text-muted-foreground">Your Text</Label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste or type your text here..."
            className="w-full min-h-[120px] mt-2 bg-muted/20 border border-border/40 rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["professional", "friendly", "casual", "formal", "funny", "luxury", "corporate", "genz", "creative", "minimal", "slang"].map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Length</Label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["short", "medium", "long"].map((l) => (
                  <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium text-muted-foreground">Creativity</Label>
            <span className="text-xs text-muted-foreground">{creativity[0]}%</span>
          </div>
          <Slider value={creativity} onValueChange={setCreativity} max={100} step={1} />
        </div>

        <Button
          onClick={handleExecute}
          disabled={loading || !input.trim()}
          className="w-full gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            variants={expandCollapse}
            initial="initial"
            animate="animate"
            exit="exit"
            className="border-t border-border/40"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Result</span>
                <div className="flex items-center gap-2">
                  {metadata && (
                    <span className="text-micro text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                      {metadata.model} · {metadata.tokens} tokens · {(metadata.latency / 1000).toFixed(1)}s
                    </span>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed bg-muted/20 rounded-xl p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
