"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const posts = [
  {
    slug: "1",
    category: "LinkedIn Tips",
    categoryColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    title: "How to Write Better LinkedIn Messages That Get Responses",
    excerpt:
      "Most LinkedIn messages are ignored within three seconds. Here is the exact structure we use to write outreach that gets replied to — with real before-and-after examples.",
    date: "June 15, 2026",
    readTime: "6 min read",
    author: "Priya Sharma",
    role: "Head of Content, ToneCraft",
    initials: "PS",
    gradient: "from-emerald-500 to-teal-600",
    featured: true,
  },
  {
    slug: "2",
    category: "AI & Writing",
    categoryColor: "bg-primary/10 text-primary",
    title: "The Future of AI Communication Tools",
    excerpt:
      "Tone-aware AI is quietly becoming the difference between generic and genuinely human writing. Here is what the next generation of writing tools gets right — and what it gets wrong.",
    date: "June 1, 2026",
    readTime: "5 min read",
    author: "Daniel Osei",
    role: "Product Lead, ToneCraft",
    initials: "DO",
    gradient: "from-[#f97316] to-[#f59e0b]",
    featured: false,
  },
  {
    slug: "3",
    category: "Email",
    categoryColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    title: "5 Email Templates ToneCraft Users Love (And Why They Work)",
    excerpt:
      "We analyzed the most-saved email rewrites from our users. These five templates — from cold follow-ups to meeting summaries — account for a third of all saves.",
    date: "May 20, 2026",
    readTime: "7 min read",
    author: "Maya Chen",
    role: "Growth Lead, ToneCraft",
    initials: "MC",
    gradient: "from-fuchsia-500 to-purple-600",
    featured: false,
  },
];

const categories = ["All", "LinkedIn Tips", "Email", "AI & Writing", "Product"];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [featured, ...allRest] = posts;
  const rest = activeCategory === "All"
    ? allRest
    : allRest.filter((p) => p.category === activeCategory);

  return (
    <div className="relative noise-bg min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            The ToneCraft Blog
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">
            Write better, <span className="bg-gradient-to-r from-[#f97316] to-[#f59e0b] bg-clip-text text-transparent">communicate better</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Practical writing guides, communication science, and product stories from the team behind ToneCraft.
          </p>
        </motion.div>

        {/* Featured post */}
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <Link
            href={`/blog/${featured.slug}`}
            className="group block overflow-hidden rounded-3xl border border-border/40 bg-card/60 transition-all duration-300 hover:border-border/80 hover:shadow-card hover:-translate-y-1"
          >
            <div className="relative p-8 sm:p-10">
              <div
                className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-brand/15 to-amber-500/15 blur-3xl"
                aria-hidden="true"
              />
              <Badge className={`mb-4 text-xs ${featured.categoryColor}`}>
                ★ Featured · {featured.category}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug mb-3 group-hover:text-primary transition-colors">
                {featured.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{featured.excerpt}</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-white ${featured.gradient}`} aria-hidden="true">
                    {featured.initials}
                  </span>
                  {featured.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  {featured.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {featured.readTime}
                </span>
                <span className="ml-auto flex items-center gap-1 text-primary font-medium">
                  Read article
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </div>
            </div>
          </Link>
        </motion.article>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-1 mb-10 scrollbar-none"
        >
          {categories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={active}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </motion.div>

        {/* Post list */}
        <div className="space-y-6">
          {rest.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">
              No posts in this category yet — check back soon.
            </p>
          )}
          {rest.map((post, i) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl border border-border/40 bg-card/50 p-7 transition-all duration-300 hover:border-border/80 hover:bg-card hover:-translate-y-0.5"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                  <Badge className={`text-[11px] ${post.categoryColor}`}>{post.category}</Badge>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {post.readTime}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.excerpt}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-white ${post.gradient}`} aria-hidden="true">
                    {post.initials}
                  </span>
                  <span className="font-medium text-foreground/80">{post.author}</span>
                  <span className="text-muted-foreground/60">· {post.role}</span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-14 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-8 sm:p-10 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold mb-2">One writing tip, every week</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Join 12,000+ writers who get our best communication playbooks. No spam, unsubscribe anytime.
          </p>
          <form
            className="mx-auto flex max-w-md flex-col sm:flex-row gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="you@company.com"
              aria-label="Email address"
              className="h-11 flex-1 rounded-xl border border-border/40 bg-background px-4 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
            <Button type="submit" className="h-11 shrink-0">
              Subscribe
            </Button>
          </form>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60">
            <User className="h-3 w-3" aria-hidden="true" />
            Written by humans, occasionally assisted by AI.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
