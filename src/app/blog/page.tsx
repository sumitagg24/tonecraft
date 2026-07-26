"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const posts = [
  {
    title: "How to Write Better LinkedIn Messages That Get Responses",
    excerpt: "Learn the psychology behind LinkedIn communication and how ToneCraft can help you craft messages that stand out.",
    date: "2025-06-15",
    readTime: "5 min read",
  },
  {
    title: "The Future of AI Communication Tools",
    excerpt: "Why tone-aware AI is the next frontier in professional communication.",
    date: "2025-06-01",
    readTime: "4 min read",
  },
  {
    title: "5 Email Templates ToneCraft Users Love",
    excerpt: "Explore some of the most popular email transformations and what makes them work.",
    date: "2025-05-20",
    readTime: "6 min read",
  },
];

export default function BlogPage() {
  return (
    <div className="relative noise-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Blog
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Insights & guides
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Tips, stories, and best practices for better communication.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {posts.map((post, i) => (
            <Link
              key={i}
              href={`/blog/${i + 1}`}
              className="block glass-panel rounded-2xl p-8 hover:border-white/10 transition-all duration-300 hover:shadow-card group"
            >
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span>{post.date}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>{post.readTime}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {post.excerpt}
              </p>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
