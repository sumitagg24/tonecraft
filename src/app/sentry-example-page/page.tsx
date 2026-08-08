"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bug, Link2, ServerCrash } from "lucide-react";

/**
 * Sentry verification page — the standard artifact the @sentry/wizard would
 * create. Use it to confirm errors land in Sentry:
 *
 *  - "Throw error"           → client-side captureException
 *  - "Call undefined fn"     → unhandled client error (global handler)
 *  - "Trigger API route"     → server-side onRequestError (route handler)
 *  - "Trigger SSR error"     → server-side onRequestError (server component)
 *
 * Errors are attributed to the signed-in user (SentryUserProvider) and, on
 * errors, a session replay is recorded (replaysOnErrorSampleRate: 1.0).
 */
export default function SentryExamplePage() {
  const [clientClicks, setClientClicks] = useState(0);
  const [undefinedClicks, setUndefinedClicks] = useState(0);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5" />
            Sentry verification
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Trigger a test error</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Each button captures a different kind of error. Check the Sentry
            dashboard (Issues) a few seconds after triggering one.
          </p>
        </div>

        <Card className="border-border/40 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Client-side errors
            </CardTitle>
            <CardDescription>
              Captured by the browser SDK and attributed to the signed-in user.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="gradient"
              onClick={() => {
                setClientClicks((n) => n + 1);
                throw new Error("Sentry Test Error (client-side throw)");
              }}
            >
              Throw error ({clientClicks})
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setUndefinedClicks((n) => n + 1);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).myUndefinedFunction();
              }}
            >
              Call undefined function ({undefinedClicks})
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ServerCrash className="w-4 h-4" />
              Server-side errors
            </CardTitle>
            <CardDescription>
              Captured via the onRequestError hook (route handler + server component).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" asChild>
              <Link href="/api/sentry-example-server">
                <Link2 className="w-4 h-4" />
                Trigger API route error
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/sentry-example-page/server">
                <ServerCrash className="w-4 h-4" />
                Trigger SSR error
              </Link>
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Tip: run dev with <code className="font-mono">SENTRY_DEBUG=true</code> to see
          &quot;Captured error event&quot; in the server log / browser console.
        </p>
      </div>
    </main>
  );
}
