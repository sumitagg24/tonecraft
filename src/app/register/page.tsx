"use client";
import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <SignUp
          routing="hash"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
        />
      </Suspense>
    </div>
  );
}
