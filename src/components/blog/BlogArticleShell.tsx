"use client";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export interface BlogAuthor {
  name: string;
  role: string;
  initials: string;
  gradient: string;
}

export interface RelatedPost {
  title: string;
  href: string;
  category: string;
}

interface BlogArticleShellProps {
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: BlogAuthor;
  tags: string[];
  related: RelatedPost[];
  children: React.ReactNode;
}

export function BlogArticleShell({
  category, title, excerpt, date, readTime, author, tags, related, children,
}: BlogArticleShellProps) {
  return (
    <div className="relative noise-bg min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button variant="ghost" size="sm" asChild>
            <Link href="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </motion.div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-5">
            <Badge variant="secondary" className="text-xs">{category}</Badge>
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground/60">#{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5">{title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{excerpt}</p>

          {/* Byline */}
          <div className="mt-8 flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white ${author.gradient}`}
              aria-hidden="true"
            >
              {author.initials}
            </div>
            <div>
              <p className="text-sm font-semibold">{author.name}</p>
              <p className="text-xs text-muted-foreground">{author.role}</p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                {date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {readTime}
              </span>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-[1.85] prose-p:text-[15px] prose-headings:tracking-tight prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8"
        >
          {children}
        </motion.div>

        {/* Author card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-2xl border border-border/40 bg-card/50 p-6 flex items-start gap-4"
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white ${author.gradient}`}
            aria-hidden="true"
          >
            {author.initials}
          </div>
          <div>
            <p className="text-sm font-semibold">Written by {author.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{author.role}</p>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Get practical writing tips and product updates from the ToneCraft team, delivered to your inbox weekly.
            </p>
          </div>
        </motion.div>

        {/* Related posts */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Keep reading
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((post) => (
                <Link
                  key={post.href}
                  href={post.href}
                  className="group rounded-xl border border-border/40 bg-card/40 p-4 transition-all duration-200 hover:border-border/80 hover:bg-card hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 mb-2">
                    <Tag className="h-3 w-3" aria-hidden="true" />
                    {post.category}
                  </span>
                  <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center"
        >
          <h2 className="text-lg font-semibold">Write like this, every time</h2>
          <p className="text-sm text-muted-foreground mt-1.5 mb-5">
            Try ToneCraft free — paste a rough draft and get a polished, on-tone rewrite in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/sign-up?redirect_url=%2Fchat">Get Started Free</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tools">Explore the tools</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
