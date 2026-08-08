"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Home, RefreshCw, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ease } from "@/styles/motion";

interface ErrorFallbackProps {
  error?: Error | null;
  errorId?: string;
  title?: string;
  message?: string;
  showHome?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function ErrorFallback({
  error,
  errorId,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  showHome = true,
  showRetry = true,
  onRetry,
  className,
}: ErrorFallbackProps) {
  // Generate the fallback ID after mount only — a random value in the useState
  // initializer would differ between the server and client renders (hydration
  // mismatch) whenever this boundary renders during SSR.
  const [fallbackId, setFallbackId] = useState("");
  useEffect(() => {
    if (!fallbackId) {
      setFallbackId(
        `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      );
    }
  }, [fallbackId]);
  const id = errorId ?? fallbackId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: ease.out }}
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] p-8 text-center",
        className,
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10"
      >
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </motion.div>

      <h2 className="mb-2 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">{message}</p>

      <div className="flex items-center gap-3">
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        {showRetry && !onRetry && (
          <Button onClick={() => window.location.reload()} variant="default">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
        )}
        {showHome && (
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        )}
      </div>

      {process.env.NODE_ENV === "development" && error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: 0.3 }}
          className="mt-8 w-full max-w-2xl overflow-auto rounded-lg bg-muted/50 p-4 text-left"
        >
          <p className="mb-2 text-xs font-mono text-muted-foreground">
            Error ID: {id}
          </p>
          <pre className="text-xs font-mono text-destructive whitespace-pre-wrap break-all">
            {error.name}: {error.message}
            {"\n"}
            {error.stack}
          </pre>
        </motion.div>
      )}

      {process.env.NODE_ENV === "production" && id && (
        <p className="mt-6 text-xs text-muted-foreground">Error ID: {id}</p>
      )}
    </motion.div>
  );
}
