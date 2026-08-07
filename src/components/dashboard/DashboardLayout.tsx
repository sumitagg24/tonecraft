"use client";
import Link from "next/link";
import DashboardHero from "./DashboardHero";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  MessageSquare, Wand2, Library, FileText, StickyNote, ListChecks,
  CalendarDays, Search, ArrowRight,
} from "lucide-react";

const QUICK_LINKS = [
  { href: "/chat", label: "Compose", desc: "Write a message in any tone", icon: MessageSquare, color: "text-brand", bg: "bg-brand/10" },
  { href: "/tools", label: "Tools", desc: "40+ purpose-built writing tools", icon: Wand2, color: "text-brand", bg: "bg-brand/10" },
  { href: "/library", label: "Library", desc: "Prompts, tones & saved assets", icon: Library, color: "text-sky-500", bg: "bg-sky-500/10" },
  { href: "/docs", label: "Documents", desc: "Markdown docs with AI editing", icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { href: "/notes", label: "Notes", desc: "Quick notes and ideas", icon: StickyNote, color: "text-amber-500", bg: "bg-amber-500/10" },
  { href: "/tasks", label: "Tasks", desc: "Kanban board and task lists", icon: ListChecks, color: "text-rose-500", bg: "bg-rose-500/10" },
  { href: "/calendar", label: "Calendar", desc: "Schedule & AI meeting notes", icon: CalendarDays, color: "text-teal-500", bg: "bg-teal-500/10" },
  { href: "/search", label: "Search", desc: "Search across everything", icon: Search, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
];

export default function DashboardLayout() {
  return (
    <div className="flex flex-col min-h-full p-4 sm:p-6 max-w-6xl mx-auto w-full">
      <DashboardHero />

      <div className="mb-4 px-1">
        <h2 className="text-sm font-semibold text-foreground">Jump back in</h2>
        <p className="text-xs text-muted-foreground/70">Quick access to your workspace</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {QUICK_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="group block">
            <Card className="h-full transition-all duration-200 hover:border-border/70 hover:shadow-card hover:-translate-y-0.5">
              <CardHeader className="p-4 pb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.bg} mb-2 transition-transform duration-200 group-hover:scale-110`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <CardTitle className="text-sm font-semibold flex items-center gap-1">
                  {item.label}
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-1 transition-all duration-200 group-hover:opacity-100 group-hover:ml-0 text-muted-foreground" />
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">{item.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
