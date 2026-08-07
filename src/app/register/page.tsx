"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { safeRedirectUrl } from "@/lib/utils";

function SignUpForm() {
  const searchParams = useSearchParams();
  // Only internal, relative targets — blocks open-redirect attempts.
  const redirectUrl = safeRedirectUrl(searchParams.get("redirect_url"));
  return (
    <SignUp
      fallbackRedirectUrl={redirectUrl}
      routing="hash"
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-lg",
        },
      }}
    />
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-background to-muted p-4">
      <Logo size="lg" />
      <Suspense
        fallback={
          <div className="w-full max-w-md flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <SignUpForm />
      </Suspense>
    </div>
  );
}
