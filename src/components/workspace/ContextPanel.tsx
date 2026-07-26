"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TONES, PLATFORMS } from "@/lib/constants";
import { Sparkles, Loader2, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { hoverScale } from "@/styles/motion";

export function ContextPanel() {
  const { selectedTone, setSelectedTone, isLoading, context, setContext } = useChatStore();
  const [platform, setPlatform] = useState<string>(context.platform);
  const [recipient, setRecipient] = useState(context.recipient);
  const [length, setLength] = useState<"short" | "medium" | "long">(context.length);
  const [creativity, setCreativity] = useState([context.creativity]);
  const [emojis, setEmojis] = useState(context.emojis);

  const syncToStore = () => {
    setContext({ platform, recipient, length, creativity: creativity[0], emojis });
  };

  return (
    <aside className="w-[320px] border-l border-border/40 bg-surface/30 backdrop-blur-xl flex flex-col h-full overflow-y-auto">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Context Controls
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Configure how your messages are crafted</p>
        </div>

        {/* Tone Selector */}
        <Card className="bg-muted/20 border-border/40">
          <CardContent className="p-4 space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Tone</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {TONES.map((tone) => (
                <motion.button
                  key={tone.id}
                  {...hoverScale.subtle}
                  onClick={() => setSelectedTone(tone.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all duration-200",
                    selectedTone === tone.id
                      ? "border-primary/50 bg-primary/10 shadow-sm"
                      : "border-border/40 hover:border-border hover:bg-muted/30"
                  )}
                  style={selectedTone === tone.id ? { color: tone.color } : {}}
                >
                  <span className="text-sm">{tone.emoji}</span>
                  <span className="font-medium">{tone.label}</span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform */}
        <Card className="bg-muted/20 border-border/40">
          <CardContent className="p-4 space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Platform</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {PLATFORMS.map((p) => (
                <motion.button
                  key={p.name}
                  {...hoverScale.subtle}
                  onClick={() => { setPlatform(p.name.toLowerCase()); syncToStore(); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all duration-200",
                    platform === p.name.toLowerCase()
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/40 hover:border-border hover:bg-muted/30"
                  )}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-medium">{p.name}</span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recipient */}
        <Card className="bg-muted/20 border-border/40">
          <CardContent className="p-4 space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Recipient</Label>
            <input
              value={recipient}
              onChange={(e) => { setRecipient(e.target.value); syncToStore(); }}
              placeholder="Who are you writing to?"
              className="w-full bg-transparent border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
            />
          </CardContent>
        </Card>

        {/* Length */}
        <Card className="bg-muted/20 border-border/40">
          <CardContent className="p-4 space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Length</Label>
            <div className="flex gap-1.5">
              {(["short", "medium", "long"] as const).map((l) => (
                <motion.button
                  key={l}
                  {...hoverScale.subtle}
                  onClick={() => { setLength(l); syncToStore(); }}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200 capitalize",
                    length === l
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/40 hover:border-border hover:bg-muted/30"
                  )}
                >
                  {l}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Creativity */}
        <Card className="bg-muted/20 border-border/40">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Creativity</Label>
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {creativity[0]}%
              </span>
            </div>
            <Slider
              value={creativity}
              onValueChange={(val) => { setCreativity(val); syncToStore(); }}
              max={100}
              step={1}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Toggles */}
        <Card className="bg-muted/20 border-border/40">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-muted-foreground" />
                <Label className="text-xs font-medium">Emojis</Label>
              </div>
              <Switch checked={emojis} onCheckedChange={(checked) => { setEmojis(checked); syncToStore(); }} />
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <motion.div {...hoverScale.subtle}>
          <Button
            className="w-full shadow-glow gap-2"
            disabled={isLoading}
            size="lg"
            onClick={() => {
              const textarea = document.querySelector('textarea[placeholder="Write your message..."]') as HTMLTextAreaElement | null;
              if (textarea) {
                textarea.focus();
                syncToStore();
              }
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </aside>
  );
}
