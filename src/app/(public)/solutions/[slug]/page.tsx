import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SOLUTIONS } from "@/lib/marketing";
import { tools, type ToolDefinition } from "@/components/tools/ToolDefinitions";
import { publicPageMetadata, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = SOLUTIONS.find((s) => s.slug === slug);
  if (!solution) return { title: "Solution not found — ToneCraft" };
  return publicPageMetadata({
    title: `${solution.name} — ToneCraft`,
    description: solution.tagline,
    path: `/solutions/${solution.slug}`,
  });
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = SOLUTIONS.find((s) => s.slug === slug);
  if (!solution) notFound();

  const relatedTools = solution.tools
    .map((id) => tools.find((t) => t.id === id))
    .filter((t): t is ToolDefinition => Boolean(t))
    .slice(0, 6);
  const others = SOLUTIONS.filter((s) => s.slug !== solution.slug);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Solutions", item: `${SITE_URL}/solutions` },
      { "@type": "ListItem", position: 3, name: solution.name, item: `${SITE_URL}/solutions/${solution.slug}` },
    ],
  };

  return (
    <main id="main-content" className="relative noise-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <Button variant="ghost" size="sm" asChild className="mb-8">
          <Link href="/solutions">
            <ArrowLeft className="w-4 h-4 mr-2" />
            All solutions
          </Link>
        </Button>

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <solution.icon className="w-6 h-6 text-primary" />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Solution for {solution.name}
          </div>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-6">{solution.tagline}</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {solution.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
            <Button size="lg" className="rounded-2xl h-14 px-8 shadow-editorial" asChild>
              <Link href="/sign-up?redirect_url=%2Fchat">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-2xl h-14 px-8 shadow-none border-border/60" asChild>
              <Link href={`/tools?tool=${relatedTools[0]?.id ?? "professional-rewrite"}`}>Try the top tool</Link>
            </Button>
          </div>
        </div>

        {/* Value props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {solution.bullets.map((b, i) => (
            <div key={i} className="glass-panel rounded-2xl p-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>

        {/* Popular tools */}
        {relatedTools.length > 0 && (
          <div className="mb-14">
            <h2 className="font-display text-2xl md:text-3xl tracking-tight mb-6">Popular tools for {solution.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedTools.map((t) => (
                <Link
                  key={t.id}
                  href={`/tools?tool=${t.id}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background px-5 py-4 hover:border-border hover:shadow-card transition-all duration-200"
                >
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-all group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other solutions */}
        <div className="pt-10 border-t border-border/40">
          <h2 className="font-display text-2xl tracking-tight mb-6">Explore other solutions</h2>
          <div className="flex flex-wrap gap-2.5">
            {others.map((s) => (
              <Link
                key={s.slug}
                href={`/solutions/${s.slug}`}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40 transition-all duration-200"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </main>
  );
}
