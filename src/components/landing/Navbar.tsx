"use client";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Bot, Menu, X, MessageSquare } from "lucide-react";
import { useState, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { NAV_LINKS } from "@/lib/constants";

const emptySubscribe = () => () => {};

export function Navbar() {
  const { isSignedIn } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 origin-left"
        style={{ scaleX }}
      />
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-border/50 shadow-sm backdrop-blur-xl bg-background/70"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2.5 font-semibold"
          >
            <Link href="/" className="flex items-center gap-2.5">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow"
              >
                <Bot className="w-4 h-4 text-white" />
              </motion.div>
              <span className="text-lg font-bold tracking-tight">ToneCraft</span>
            </Link>
          </motion.div>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="relative text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 py-1.5 group font-medium"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {mounted && isSignedIn ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3"
              >
                <Button size="sm" className="shadow-sm gap-2" asChild>
                  <Link href="/chat">
                    <MessageSquare className="w-4 h-4" />
                    Open App
                  </Link>
                </Button>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </motion.div>
            ) : mounted ? (
              <>
                <Button size="sm" variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/login">Sign In</Link>
                </Button>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button size="sm" asChild className="shadow-sm">
                    <Link href="/register">Get Started</Link>
                  </Button>
                </motion.div>
              </>
            ) : null}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border/50 backdrop-blur-xl bg-background/80"
            >
              <nav className="flex flex-col p-4 space-y-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="pt-4 border-t border-border/50 space-y-2">
                  {mounted && isSignedIn ? (
                    <Button asChild className="w-full" onClick={() => setMobileOpen(false)}>
                      <Link href="/chat">Open App</Link>
                    </Button>
                  ) : mounted ? (
                    <>
                      <Button variant="outline" asChild className="w-full" onClick={() => setMobileOpen(false)}>
                        <Link href="/login">Sign In</Link>
                      </Button>
                      <Button asChild className="w-full" onClick={() => setMobileOpen(false)}>
                        <Link href="/register">Get Started</Link>
                      </Button>
                    </>
                  ) : null}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
