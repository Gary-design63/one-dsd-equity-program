/**
 * Approval Queue — PRD Section 11.3
 * Consultant-only (70% layer). Core of the capacity multiplication model.
 * All under-hood generated outputs require consultant review before distribution.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UniversalActionBar } from "@/components/UniversalActionBar";
import { KnowledgeRouting } from "@/components/KnowledgeRouting";

interface QueueItem {
  id: string;
  title: string;
  type: "consultation_response" | "equity_analysis" | "training_content" | "report_draft" | "community_response";
  generatedAt: string;
  priority: "urgent" | "high" | "normal";
  status: "pending" | "approved" | "rejected" | "revision_requested";
  preview: string;
  sourceModule: string;
}

const TYPE_LABELS: Record<string, string> = {
  consultation_response: "Consultation Response",
  equity_analysis: "Equity Analysis",
  training_content: "Training Content",
  report_draft: "Report Draft",
  community_response: "Community Response",
};

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", className: "bg-rose-500/12 text-rose-700 dark:text-rose-300" },
  high: { label: "High", className: "bg-amber-500/12 text-amber-700 dark:text-amber-300" },
  normal: { label: "Normal", className: "bg-blue-500/12 text-blue-700 dark:text-blue-300" },
};

const MOCK_QUEUE: QueueItem[] = [
  {
    id: "AQ-001",
    title: "Response: Equity review for waiver assessment process",
    type: "consultation_response",
    generatedAt: "2 minutes ago",
    priority: "high",
    status: "pending",
    preview: "Based on the DSD Equity Framework and CLAS Standards, the proposed waiver assessment changes should incorporate additional cultural and linguistic accommodations for...",
    sourceModule: "Consultations",
  },
  {
    id: "AQ-002",
    title: "Disparity analysis: Rural vs. urban service access Q1 2026",
    type: "equity_analysis",
    generatedAt: "18 minutes ago",
    priority: "normal",
    status: "pending",
    preview: "Analysis of Q1 2026 data reveals a persistent 12-point gap in service access rates between urban (38 per 1,000) and rural (26 per 1,000) communities...",
    sourceModule: "KPIs",
  },
  {
    id: "AQ-003",
    title: "Training module: Cultural responsiveness for Somali communities",
    type: "training_content",
    generatedAt: "1 hour ago",
    priority: "normal",
    status: "pending",
    preview: "Module 3 of the cultural responsiveness series covers communication preferences, family engagement patterns, and trust-building approaches specific to...",
    sourceModule: "Learning",
  },
  {
    id: "AQ-004",
    title: "Quarterly equity report — Q1 2026 draft",
    type: "report_draft",
    generatedAt: "3 hours ago",
    priority: "high",
    status: "pending",
    preview: "Executive Summary: The Disability Services Division made measurable progress toward 4 of 6 equity goals this quarter. Community engagement increased by...",
    sourceModule: "KPIs",
  },
  {
    id: "AQ-005",
    title: "Response: Community feedback on interpreter availability",
    type: "community_response",
    generatedAt: "5 hours ago",
    priority: "urgent",
    status: "pending",
    preview: "Thank you for sharing this feedback about interpreter availability at county offices. We have reviewed CLAS Standard 7 requirements and are implementing...",
    sourceModule: "Community Voice",
  },
];

export default function ApprovalQueuePage() {
  const [items, setItems] = useState(MOCK_QUEUE);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  const pendingCount = items.filter(i => i.status === "pending").length;

  const handleAction = (id: string, action: "approved" | "rejected" | "revision_requested") => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: action } : item
    ));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 md:px-6 md:py-6">
      {/* Header */}
      <div>
        <Badge className="mb-2 inline-flex rounded-full border-0 bg-amber-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          Approval Queue · Consultant Only
        </Badge>
        <h1 className="text-xl font-semibold md:text-2xl">Approval Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingCount} items awaiting your review. All outputs require your final approval before distribution.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="panel-card border-2 border-amber-400">
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Pending review</div>
            <div className="mt-2 text-3xl font-semibold text-amber-600 tabular-nums">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="panel-card">
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Approved today</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-600 tabular-nums">
              {items.filter(i => i.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card className="panel-card">
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Rejected</div>
            <div className="mt-2 text-2xl font-semibold text-rose-600 tabular-nums">
              {items.filter(i => i.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
        <Card className="panel-card">
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Acceptance rate</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">85%</div>
            <div className="text-xs text-muted-foreground">Target: 85%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? "chip-button chip-button-active" : "chip-button"}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Queue items */}
      <div className="space-y-4">
        {filtered.map(item => {
          const prioCfg = PRIORITY_CONFIG[item.priority];
          return (
            <Card key={item.id} className="panel-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                    <Badge variant="outline" className="text-[11px]">{TYPE_LABELS[item.type]}</Badge>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${prioCfg.className}`}>{prioCfg.label}</span>
                    <span className="text-xs text-muted-foreground">from {item.sourceModule}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.generatedAt}</span>
                </div>

                <h3 className="text-sm font-semibold">{item.title}</h3>

                {/* Draft preview (inline review per PRD 11.3) */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Draft preview</div>
                  <p className="text-sm text-foreground leading-relaxed">{item.preview}</p>
                </div>

                {/* Action buttons */}
                {item.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-8 rounded-xl bg-[hsl(var(--mn-green))] text-xs text-white hover:bg-[hsl(var(--mn-green-strong))]"
                      onClick={() => handleAction(item.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl text-xs"
                      onClick={() => handleAction(item.id, "revision_requested")}
                    >
                      Request revision
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl border-destructive/40 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => handleAction(item.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs capitalize">{item.status.replace("_", " ")}</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <KnowledgeRouting currentModule="Approval Queue" />
      <UniversalActionBar pageName="Approval Queue" />
    </div>
  );
}
