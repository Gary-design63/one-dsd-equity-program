/**
 * Consultations — PRD Module 2 (30% Staff / 70% Consultant)
 * Staff: submit requests, view own consultations
 * Consultant: triage, respond, close, full access
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UniversalActionBar } from "@/components/UniversalActionBar";
import { KnowledgeRouting } from "@/components/KnowledgeRouting";
import { useAuth } from "@/context/AuthContext";

type ConsultationStatus = "submitted" | "triaged" | "in_review" | "draft_ready" | "approved" | "closed";
type Priority = "urgent" | "high" | "medium" | "low";

interface Consultation {
  id: string;
  title: string;
  description: string;
  department: string;
  submittedBy: string;
  priority: Priority;
  status: ConsultationStatus;
  triageTier: number;
  createdAt: string;
  dueDate: string;
}

const STATUS_CONFIG: Record<ConsultationStatus, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-blue-500/12 text-blue-700 dark:text-blue-300" },
  triaged: { label: "Triaged", className: "bg-purple-500/12 text-purple-700 dark:text-purple-300" },
  in_review: { label: "In Review", className: "bg-amber-500/12 text-amber-700 dark:text-amber-300" },
  draft_ready: { label: "Draft Ready", className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
  approved: { label: "Approved", className: "bg-green-600/12 text-green-700 dark:text-green-300" },
  closed: { label: "Closed", className: "bg-slate-500/12 text-slate-700 dark:text-slate-300" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string; sla: string }> = {
  urgent: { label: "Urgent", className: "bg-rose-500/12 text-rose-700", sla: "< 24 hours" },
  high: { label: "High", className: "bg-amber-500/12 text-amber-700", sla: "< 48 hours" },
  medium: { label: "Medium", className: "bg-blue-500/12 text-blue-700", sla: "< 5 days" },
  low: { label: "Low", className: "bg-slate-500/12 text-slate-700", sla: "< 10 days" },
};

const MOCK_CONSULTATIONS: Consultation[] = [
  {
    id: "CON-001",
    title: "Equity review for new waiver assessment process",
    description: "Request for equity analysis of the proposed changes to the DD waiver assessment process.",
    department: "Waiver Services",
    submittedBy: "Program Manager",
    priority: "high",
    status: "in_review",
    triageTier: 2,
    createdAt: "2026-04-05",
    dueDate: "2026-04-07",
  },
  {
    id: "CON-002",
    title: "Cultural responsiveness training request for new hires",
    description: "Six new staff members need onboarding cultural responsiveness training for Somali and Hmong communities.",
    department: "Community Services",
    submittedBy: "Team Lead",
    priority: "medium",
    status: "triaged",
    triageTier: 1,
    createdAt: "2026-04-04",
    dueDate: "2026-04-09",
  },
  {
    id: "CON-003",
    title: "Language access compliance gap analysis",
    description: "CLAS standards require review of current language access policies across all service programs.",
    department: "Quality Assurance",
    submittedBy: "Quality Specialist",
    priority: "urgent",
    status: "draft_ready",
    triageTier: 3,
    createdAt: "2026-04-03",
    dueDate: "2026-04-04",
  },
  {
    id: "CON-004",
    title: "Community engagement strategy for rural counties",
    description: "Need assistance developing outreach strategy for underserved rural disability communities.",
    department: "Outreach",
    submittedBy: "Outreach Coordinator",
    priority: "medium",
    status: "submitted",
    triageTier: 1,
    createdAt: "2026-04-06",
    dueDate: "2026-04-11",
  },
  {
    id: "CON-005",
    title: "ADA compliance review for division website update",
    description: "Upcoming website redesign requires ADA and Section 508 compliance review before launch.",
    department: "Communications",
    submittedBy: "Web Specialist",
    priority: "high",
    status: "approved",
    triageTier: 2,
    createdAt: "2026-03-28",
    dueDate: "2026-04-02",
  },
];

export default function ConsultationsPage() {
  const { user } = useAuth();
  const isConsultant = user?.role === "equity-consultant";
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | "all">("all");
  const [showNewForm, setShowNewForm] = useState(false);

  const filtered = statusFilter === "all"
    ? MOCK_CONSULTATIONS
    : MOCK_CONSULTATIONS.filter(c => c.status === statusFilter);

  const statusCounts = {
    submitted: MOCK_CONSULTATIONS.filter(c => c.status === "submitted").length,
    in_review: MOCK_CONSULTATIONS.filter(c => c.status === "in_review" || c.status === "triaged").length,
    draft_ready: MOCK_CONSULTATIONS.filter(c => c.status === "draft_ready").length,
    closed: MOCK_CONSULTATIONS.filter(c => c.status === "approved" || c.status === "closed").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 md:px-6 md:py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-2 inline-flex rounded-full border-0 bg-[hsl(var(--mn-blue-soft))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--mn-blue))] dark:bg-white/10 dark:text-white">
            Consultations
          </Badge>
          <h1 className="text-xl font-semibold md:text-2xl">Consultation requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isConsultant
              ? "Triage, respond, and manage all consultation requests (70% layer)"
              : "Submit and track your equity consultation requests (30% layer)"}
          </p>
        </div>
        <Button
          onClick={() => setShowNewForm(!showNewForm)}
          className="rounded-xl bg-[hsl(var(--mn-blue))] text-white hover:bg-[hsl(var(--mn-blue-deep))]"
        >
          New consultation
        </Button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "New requests", count: statusCounts.submitted, color: "hsl(var(--mn-blue))" },
          { label: "In review", count: statusCounts.in_review, color: "hsl(var(--mn-gold))" },
          { label: "Drafts ready", count: statusCounts.draft_ready, color: "hsl(var(--mn-green))" },
          { label: "Completed", count: statusCounts.closed, color: "hsl(var(--chart-slate))" },
        ].map(stat => (
          <Card key={stat.label} className="panel-card">
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: stat.color }}>{stat.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["all", "submitted", "triaged", "in_review", "draft_ready", "approved", "closed"] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={statusFilter === status ? "chip-button chip-button-active" : "chip-button"}
          >
            {status === "all" ? "All" : STATUS_CONFIG[status]?.label || status}
          </button>
        ))}
      </div>

      {/* New consultation form */}
      {showNewForm && (
        <Card className="panel-card border-2 border-[hsl(var(--mn-blue))]">
          <CardHeader>
            <CardTitle className="text-base">Submit new consultation</CardTitle>
            <CardDescription>Your request will be triaged and assigned based on priority and complexity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</label>
              <input className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Brief description of your request" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" rows={4} placeholder="Provide details about what you need..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Department</label>
                <input className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Your department" />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</label>
                <select className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="medium">Medium (5 business days)</option>
                  <option value="high">High (48 hours)</option>
                  <option value="urgent">Urgent (24 hours)</option>
                  <option value="low">Low (10 business days)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="rounded-xl bg-[hsl(var(--mn-blue))] text-white hover:bg-[hsl(var(--mn-blue-deep))]" onClick={() => { setShowNewForm(false); }}>
                Submit request
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consultation list */}
      <div className="space-y-3">
        {filtered.map(consultation => {
          const statusCfg = STATUS_CONFIG[consultation.status];
          const priorityCfg = PRIORITY_CONFIG[consultation.priority];
          return (
            <Card key={consultation.id} className="panel-card">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{consultation.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityCfg.className}`}>
                        {priorityCfg.label} — SLA: {priorityCfg.sla}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold">{consultation.title}</h3>
                    <p className="text-sm text-muted-foreground">{consultation.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Department: {consultation.department}</span>
                      <span>Submitted: {consultation.createdAt}</span>
                      <span>Due: {consultation.dueDate}</span>
                      {isConsultant && <span>Tier {consultation.triageTier}</span>}
                    </div>
                  </div>
                  {isConsultant && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs">Review</Button>
                      <Button size="sm" className="h-8 rounded-xl bg-[hsl(var(--mn-green))] text-xs text-white hover:bg-[hsl(var(--mn-green-strong))]">Approve</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* PRD required components */}
      <KnowledgeRouting currentModule="Consultations" />
      <UniversalActionBar pageName="Consultations" />
    </div>
  );
}
