import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

/**
 * Shared chrome for every public page — the floating glass navbar (logo,
 * mega menus, theme toggle, auth CTAs) stays visible top-left across all
 * marketing pages: Features, Solutions, Tools, Pricing, Docs, Blog, FAQ…
 *
 * The Footer component renders on every public marketing page for consistent
 * navigation, legal links, and brand presence.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
