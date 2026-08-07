"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Network, ArrowLeft, Layers } from "lucide-react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/suite/PageHeader";

interface GraphNode {
  id: string;
  content: string;
}

interface GraphEdge {
  fromId: string;
  toId: string;
  relation: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function KnowledgeGraphPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<GraphData>("/api/memory/graph?ownerType=user&ownerId=me"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-muted-foreground">
          <Link href="/memory">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Memory
          </Link>
        </Button>

        <PageHeader
          title="Knowledge Graph"
          description="Visual network connecting your long-term memories, projects, people, and documents."
          icon={<Network className="h-5 w-5 text-white" />}
        />

        <Card className="border-border/40 bg-card shadow-card rounded-xl">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Graph Explorer
                </CardTitle>
                <CardDescription className="text-xs">
                  Nodes represent remembered facts; edges represent inferred semantic relationships.
                </CardDescription>
              </div>
              {data && (
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-micro font-mono">
                    {data.nodes.length} Nodes
                  </Badge>
                  <Badge variant="outline" className="text-micro font-mono">
                    {data.edges.length} Edges
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {loading ? (
              <div className="h-96 rounded-lg bg-muted/20 animate-pulse flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Building Knowledge Graph…</span>
              </div>
            ) : !data || data.nodes.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 border border-dashed border-border/40 rounded-lg">
                <Network className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">No graph nodes connected yet.</p>
                <Button size="sm" variant="outline" asChild className="mt-2">
                  <Link href="/memory">Save memories to expand graph</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.nodes.map((node) => {
                  const nodeEdges = data.edges.filter((e) => e.fromId === node.id || e.toId === node.id);
                  return (
                    <div
                      key={node.id}
                      className="rounded-xl border border-border/40 bg-surface/60 p-4 space-y-3 shadow-sm hover:border-primary/40 transition-colors"
                    >
                      <p className="text-xs text-foreground font-medium line-clamp-3 leading-relaxed">
                        {node.content}
                      </p>
                      <div className="flex items-center justify-between border-t border-border/30 pt-2 text-micro text-muted-foreground">
                        <span>{nodeEdges.length} connections</span>
                        <span className="font-mono text-primary">id: {node.id.slice(-6)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
