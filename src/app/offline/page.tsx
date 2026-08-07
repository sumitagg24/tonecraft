"use client";

import Link from "next/link";
import { WifiOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-border/40 bg-card/60 text-center shadow-card">
        <CardContent className="p-10 flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
            <WifiOff className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">You&apos;re offline</h1>
          <p className="text-sm text-muted-foreground">
            ToneCraft cached your workspace — draft and compose freely, and your changes will sync when you&apos;re
            back online.
          </p>
          <Button variant="outline" className="gap-2" onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
          <Link href="/chat" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Go to chat
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
