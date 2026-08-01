"use client";
import { useRouter } from "next/navigation";
import { Library as LibraryIcon, Sparkles } from "lucide-react";

export default function LibraryPage() {
  const router = useRouter();
  return (
    <div className="flex-1 h-full flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="relative inline-flex mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-600/10 border border-border/30 flex items-center justify-center">
            <LibraryIcon className="w-7 h-7 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold mb-2">Library</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Your reusable assets — prompts, tones, and knowledge — will live here
          in the next step of the redesign.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push("/chat")}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-glow transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Start writing
          </button>
        </div>
      </div>
    </div>
  );
}
