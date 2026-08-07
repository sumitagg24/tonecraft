"use client";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

const COLUMNS: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    items: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Tools", href: "/tools" },
      { label: "Solutions", href: "/solutions" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Documentation", href: "/help" },
      { label: "Blog", href: "/blog" },
      { label: "Help Center", href: "/help#faq" },
      { label: "FAQ", href: "/faq" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "mailto:support@tonecraft.ai" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative pt-20 pb-12 overflow-hidden border-t border-border/40 bg-muted/20">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Logo size="lg" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              The AI Communication Platform crafted for precision, nuance, and editorial excellence. Write once, speak perfectly, everywhere.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="font-semibold mb-4 text-xs tracking-wider uppercase text-foreground/80">{column.title}</h4>
              <ul className="space-y-3">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border/40 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ToneCraft Inc. All rights reserved.</p>
          <p>Handcrafted for precision communication.</p>
        </div>
      </div>
    </footer>
  );
}
