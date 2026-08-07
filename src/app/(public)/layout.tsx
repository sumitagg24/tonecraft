import { Navbar } from "@/components/landing/Navbar";

/**
 * Shared chrome for every public page — the floating glass navbar (logo,
 * mega menus, theme toggle, auth CTAs) stays visible top-left across all
 * marketing pages: Features, Solutions, Tools, Pricing, Docs, Blog, FAQ…
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
