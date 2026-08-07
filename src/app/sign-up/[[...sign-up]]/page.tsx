import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/shared/Logo";
import { safeRedirectUrl } from "@/lib/utils";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Logo size="lg" />
      {/* fallbackRedirectUrl: the browser URL's own redirect_url param takes
          precedence (Clerk honors it automatically); this covers the case where
          pricing CTAs deep-link straight to checkout after sign-up. */}
      <SignUp fallbackRedirectUrl={safeRedirectUrl(redirect_url)} />
    </div>
  );
}
