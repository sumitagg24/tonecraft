import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/shared/Logo";
import { safeRedirectUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in — ToneCraft",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Logo size="lg" />
      {/* fallbackRedirectUrl: Clerk also honors the URL's own redirect_url search
          param; the prop makes it explicit so pricing CTAs can bounce users
          straight back to checkout after signing in. */}
      <SignIn fallbackRedirectUrl={safeRedirectUrl(redirect_url)} />
    </div>
  );
}
