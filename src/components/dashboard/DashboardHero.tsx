"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/use-chat";
import { ArrowRight, Plus } from "lucide-react";

export default function DashboardHero() {
  const router = useRouter();
  const { createChatOptimistic } = useChat();

  const handleNewChat = async () => {
    const tempId = await createChatOptimistic((real) => router.replace(`/chat/${real.id}`));
    router.push(`/chat/${tempId}`);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-card p-8 md:p-10 mb-8 shadow-premium">
      {/* Brand glow + dot grid */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 right-[-10%] h-64 w-[36rem] rounded-full blur-3xl bg-[radial-gradient(closest-side,hsl(var(--brand)/0.14),transparent)]" />
        <div className="absolute inset-0 dot-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_80%_at_20%_50%,black,transparent)]" />
      </div>
      <div className="relative z-10">
        <p className="eyebrow mb-4">ToneCraft Studio</p>
        <h1 className="font-display text-3xl md:text-5xl tracking-tight mb-3">
          Your command center for communication.
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-6 leading-relaxed">
          Write once, speak perfectly, everywhere — craft, transform, and share from a single focused workspace.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleNewChat}
            className="gap-2 bg-brand text-brand-foreground shadow-[0_8px_24px_-8px_hsl(var(--brand)/0.5)] hover:bg-brand/90"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-border/60"
            onClick={() => router.push("/tools")}
          >
            Explore Tools
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
