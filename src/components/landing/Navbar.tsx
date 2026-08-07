"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import {
  Sun, Moon, Menu, X, ChevronDown, ChevronRight, ArrowRight, Wand2, Rocket,
} from "lucide-react";
import { useState, useEffect, useRef, useSyncExternalStore, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  FEATURES_GROUPS, SOLUTIONS, RESOURCES_ITEMS, TOOLS_MENU,
} from "@/lib/marketing";

const emptySubscribe = () => () => {};

interface NavLink {
  id: string;
  label: string;
  href: string;
  mega?: "features" | "solutions" | "tools" | "resources";
}

const PRIMARY_LINKS: NavLink[] = [
  { id: "features", label: "Features", href: "/features", mega: "features" },
  { id: "solutions", label: "Solutions", href: "/solutions", mega: "solutions" },
  { id: "tools", label: "Tools", href: "/tools", mega: "tools" },
  { id: "resources", label: "Resources", href: "/help", mega: "resources" },
  { id: "pricing", label: "Pricing", href: "/pricing" },
  { id: "about", label: "About", href: "/about" },
];

function ToolLinkRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group/tool flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/50"
    >
      <span className="text-xs font-medium text-muted-foreground group-hover/tool:text-foreground transition-colors">
        {children}
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/tool:text-foreground/70 transition-all group-hover/tool:translate-x-0.5" />
    </Link>
  );
}

export function Navbar() {
  const { isSignedIn } = useUser();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change.
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  // Close on outside click.
  const onMouseDown = useCallback((e: MouseEvent) => {
    if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
      setOpenMenu(null);
    }
  }, []);
  useEffect(() => {
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [onMouseDown]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleMenu = (id: string) => setOpenMenu((cur) => (cur === id ? null : id));

  const renderMega = (id: string) => {
    switch (id) {
      case "features":
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6">
            {FEATURES_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        prefetch
                        onClick={() => setOpenMenu(null)}
                        className="group/item flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/50"
                      >
                        <item.icon className="w-4 h-4 mt-0.5 text-muted-foreground/70 group-hover/item:text-foreground shrink-0 transition-colors" />
                        <span>
                          <span className="block text-xs font-medium text-foreground">{item.label}</span>
                          <span className="block text-[11px] text-muted-foreground/70 leading-snug mt-0.5">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      case "solutions":
        return (
          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
              {SOLUTIONS.map((s) => (
                <Link
                  key={s.slug}
                  href={`/solutions/${s.slug}`}
                  prefetch
                  onClick={() => setOpenMenu(null)}
                  className="group/sol flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
                >
                  <s.icon className="w-4 h-4 mt-0.5 text-muted-foreground/70 group-hover/sol:text-foreground shrink-0 transition-colors" />
                  <span>
                    <span className="block text-xs font-medium text-foreground">{s.name}</span>
                    <span className="block text-[11px] text-muted-foreground/70 leading-snug mt-0.5 line-clamp-2">
                      {s.tagline}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground/60">
                Each solution has its own landing page with tailored tools.
              </p>
              <Button variant="ghost" size="sm" className="text-xs gap-1 rounded-lg" asChild>
                <Link href="/solutions" onClick={() => setOpenMenu(null)}>
                  Browse all solutions
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        );
      case "tools":
        return (
          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
              {TOOLS_MENU.map((t) => (
                <ToolLinkRow key={t.id} href={`/tools?tool=${t.id}`}>
                  {t.title}
                  <span className="block text-[10px] text-muted-foreground/50 font-normal mt-0.5">{t.description}</span>
                </ToolLinkRow>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground/60">
                80+ purpose-built tools across every platform and tone.
              </p>
              <Button size="sm" className="text-xs gap-1 rounded-lg" asChild>
                <Link href="/tools" onClick={() => setOpenMenu(null)}>
                  <Wand2 className="w-3.5 h-3.5" />
                  Open all tools
                </Link>
              </Button>
            </div>
          </div>
        );
      case "resources":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-6 min-w-[420px]">
            {RESOURCES_ITEMS.map((r) => (
              <Link
                key={r.label}
                href={r.href}
                prefetch
                onClick={() => setOpenMenu(null)}
                className="group/res flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
              >
                <r.icon className="w-4 h-4 mt-0.5 text-muted-foreground/70 group-hover/res:text-foreground shrink-0 transition-colors" />
                <span>
                  <span className="block text-xs font-medium text-foreground">{r.label}</span>
                  <span className="block text-[11px] text-muted-foreground/70 leading-snug mt-0.5">
                    {r.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.header
      ref={headerRef}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-4 inset-x-4 md:inset-x-8 z-50 max-w-7xl mx-auto pointer-events-none"
    >
      <nav
        aria-label="Main"
        className={cn(
          "pointer-events-auto relative flex items-center justify-between h-[72px] px-4 md:px-6 rounded-2xl transition-all duration-300 border",
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-border/80 shadow-editorial-lg"
            : "bg-background/65 backdrop-blur-lg border-border/50 shadow-editorial"
        )}
      >
        {/* ── Left: Logo ─────────────────────────────────── */}
        <div className="flex items-center gap-2 lg:gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setMobileOpen(false)}>
            <Logo size="lg" />
          </Link>

          {/* ── Desktop nav items ────────────────────────── */}
          <div className="hidden xl:flex items-center gap-0.5 pl-1">
            {PRIMARY_LINKS.map((link) =>
              link.mega ? (
                <div key={link.id} className="relative" onMouseEnter={() => setOpenMenu(link.mega!)}>
                  <button
                    onClick={() => toggleMenu(link.mega!)}
                    aria-expanded={openMenu === link.mega}                      className={cn(
                      "flex items-center gap-1 px-2.5 py-2 text-sm font-medium rounded-xl transition-all duration-200",
                      openMenu === link.mega
                        ? "text-foreground bg-muted/60"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    {link.label}
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        openMenu === link.mega && "rotate-180"
                      )}
                    />
                  </button>
                </div>
              ) : (
                <Link
                  key={link.id}
                  href={link.href}
                  prefetch
                  className="px-2.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 rounded-xl hover:bg-muted/40"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>

        {/* ── Right actions ─────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all border border-border/40"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {mounted && isSignedIn ? (
            <div className="flex items-center gap-2 pl-0.5">
              <Button
                size="sm"
                asChild
                className="hidden sm:inline-flex rounded-xl h-10 px-5 text-xs font-semibold text-white bg-gradient-to-r from-brand to-amber-500 hover:from-brand/95 hover:to-amber-500/95 hover:text-white border-0 shadow-[0_8px_28px_-8px_hsl(var(--brand)/0.7)]"
              >
                <Link href="/chat" className="gap-1.5">
                  Launch Studio
                  <Rocket className="w-3.5 h-3.5" />
                </Link>
              </Button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 rounded-xl border border-border/60",
                    userButtonTrigger: "rounded-xl focus:outline-none",
                    userButtonPopoverCard:
                      "rounded-2xl border border-border/60 bg-popover backdrop-blur-2xl shadow-editorial-lg",
                  },
                }}
              />
            </div>
          ) : mounted ? (
            <div className="hidden sm:flex items-center gap-2 pl-0.5">
              <Button size="sm" variant="ghost" asChild className="rounded-xl h-10 text-xs font-medium">
                <Link href="/sign-in?redirect_url=%2Fchat">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="rounded-xl h-10 px-5 text-xs font-medium shadow-none">
                <Link href="/sign-up?redirect_url=%2Fchat">Get Started Free</Link>
              </Button>
            </div>
          ) : null}

          {/* Mobile menu button */}
          <button
            className="xl:hidden h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* ── Mega menu panels (desktop) ───────────────────── */}
      <AnimatePresence>
        {openMenu && (
          <motion.div
            key={openMenu}
            initial={{ opacity: 0, y: 8, scale: 0.99, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 8, scale: 0.99, x: "-50%" }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-auto hidden xl:block absolute left-1/2 top-full mt-3 w-[min(96vw,74rem)]"
            role="region"
            aria-label={`${PRIMARY_LINKS.find((l) => l.mega === openMenu)?.label ?? ""} menu`}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <div className="rounded-2xl bg-background/95 backdrop-blur-2xl border border-border/80 shadow-editorial-lg overflow-hidden">
              {renderMega(openMenu)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile navigation drawer ─────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto xl:hidden mt-3 rounded-2xl bg-background/95 backdrop-blur-2xl border border-border/80 shadow-editorial-lg p-5 max-h-[calc(100vh-120px)] overflow-y-auto"
          >
            <div className="space-y-4">
              {FEATURES_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                    {group.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-3 mt-3 border-t border-border/40">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">Pages</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRIMARY_LINKS.map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/faq"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50"
                  >
                    FAQ
                  </Link>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-border/40 space-y-2">
                {mounted && isSignedIn ? (
                  <Button
                    asChild
                    className="w-full rounded-xl h-11 text-white bg-gradient-to-r from-brand to-amber-500 hover:from-brand/95 hover:to-amber-500/95 border-0 shadow-[0_8px_28px_-8px_hsl(var(--brand)/0.7)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/chat" className="gap-1.5">
                      Launch Studio
                      <Rocket className="w-4 h-4" />
                    </Link>
                  </Button>
                ) : mounted ? (
                  <>
                    <Button variant="outline" asChild className="w-full rounded-xl h-11" onClick={() => setMobileOpen(false)}>
                      <Link href="/sign-in?redirect_url=%2Fchat">Sign In</Link>
                    </Button>
                    <Button asChild className="w-full rounded-xl h-11" onClick={() => setMobileOpen(false)}>
                      <Link href="/sign-up?redirect_url=%2Fchat">Get Started Free</Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
