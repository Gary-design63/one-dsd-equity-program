/**
 * Institutional Memory — PRD Module 10
 * Consultant-only (70% layer).
 * Audit log, version history, precedent tracking, decision archive.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UniversalActionBar } from "@/components/UniversalActionBar";
import { KnowledgeRouting } from "@/components/KnowledgeRouting";

interface MemoryEntry {
  id: string;
  entityType: "consultation" | "document" | "kpi" | "calendar" | "feedback" | "policy";
  entityTitle: string;
  decisionSummary: string;
  precedentNotes: string;
  approvedBy: string;
  approvedAt: string;
  tags: string[];
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  entityType: string;
  details: string;
}

const MOCK_MEMORY: MemoryEntry[] = [
  {
    id: "MEM-001",
    entityType: "consultation",
    entityTitle: "Waiver assessment equity review (CON-005)",
    decisionSummary: "Approved with modifications: Added CLAS Standard 4 requirement for translated assessment materials in top 5 LEP languages.",
    precedentNotes: "Sets precedent for all future waiver assessment changes — must include language access review as standard step.",
    approvedBy: "Equity and Inclusion Operations Consultant",
    approvedAt: "2026-04-02",
    tags: ["waiver", "language-access", "clas", "assessment"],
  },
  {
    id: "MEM-002",
    entityType: "policy",
    entityTitle: "DSD Equity Framework v2.0 adoption",
    decisionSummary: "Framework v2.0 adopted division-wide. Adds disability justice principles and intersectionality lens. Supersedes v1.0 (2024).",
    precedentNotes: "All future policy reviews must use v2.0 framework. v1.0 reviews remain valid but should be flagged for update at next cycle.",
    approvedBy: "Equity and Inclusion Operations Consultant",
    approvedAt: "2026-03-15",
    tags: ["framework", "disability-justice", "policy"],
  },
  {
    id: "MEM-003",
    entityType: "feedback",
    entityTitle: "Somali community interpreter access feedback (Q4 2025)",
    decisionSummary: "Committed to 48-hour interpreter availability standard for Somali language at all metro county offices by July 2026.",
    precedentNotes: "This commitment sets a service level standard. Future community feedback on interpreter access should reference this decision.",
    approvedBy: "Equity and Inclusion Operations Consultant",
    approvedAt: "2026-01-20",
    tags: ["somali", "interpreter", "language-access", "service-standard"],
  },
  {
    id: "MEM-004",
    entityType: "kpi",
    entityTitle: "Rural access disparity threshold decision",
    decisionSummary: "Any regional access gap exceeding 10 points triggers an automatic escalation review. Applied to all KPI monitoring.",
    precedentNotes: "Threshold applies across all service access metrics. Review quarterly.",
    approvedBy: "Equity and Inclusion Operations Consultant",
    approvedAt: "2026-02-10",
    tags: ["kpi", "disparity", "threshold", "rural"],
  },
];

const MOCK_AUDIT: AuditEntry[] = [
  { id: "AUD-001", timestamp: "2026-04-07 14:32:00", action: "approve", actor: "Consultant", entityType: "consultation", details: "Approved consultation response CON-003" },
  { id: "AUD-002", timestamp: "2026-04-07 13:15:00", action: "edit", actor: "Consultant", entityType: "document", details: "Updated cultural responsiveness training module 3" },
  { id: "AUD-003", timestamp: "2026-04-07 11:00:00", action: "upload", actor: "Consultant", entityType: "document", details: "Uploaded CLAS compliance checklist v2" },
  { id: "AUD-004", timestamp: "2026-04-06 16:45:00", action: "reject", actor: "Consultant", entityType: "report", details: "Rejected quarterly report draft — needs disparity data update" },
  { id: "AUD-005", timestamp: "2026-04-06 14:20:00", action: "approve", actor: "Consultant", entityType: "training", details: "Approved equity lens training module for cohort 4" },
  { id: "AUD-006", timestamp: "2026-04-06 10:00:00", action: "save", actor: "Consultant", entityType: "kpi", details: "Updated rural access KPI threshold from 8 to 10 points" },
  { id: "AUD-007", timestamp: "2026-04-05 15:30:00", action: "share", actor: "Consultant", entityType: "document", details: "Shared DSD Equity Framework v2.0 with Leadership" },
  { id: "AUD-008", timestamp: "2026-04-05 09:00:00", action: "upload", actor: "Staff", entityType: "consultation", details: "New consultation submitted: Language access gap analysis" },
];

export default function InstitutionalMemoryPage() {
  const [tab, setTab] = useState<"decisions" | "audit">("decisions");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMemory = MOCK_MEMORY.filter(m =>
    m.entityTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.decisionSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tags.some(t => t.includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 md:px-6 md:py-6">
      {/* Header */}
      <div>
        <Badge className="mb-2 inline-flex rounded-full border-0 bg-amber-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          Institutional Memory · Consultant Only
        </Badge>
        <h1 className="text-xl font-semibold md:text-2xl">Institutional Memory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every decision, every precedent, every audit action — searchable and permanent.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="panel-card">
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Decisions logged</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{MOCK_MEMORY.length}</div>
          </CardContent>
        </Card>
        <Card className="panel-card">
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Audit entries</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{MOCK_AUDIT.length}</div>
          </CardContent>
        </Card>
        <Card className="panel-card">
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Precedent tags</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {new Set(MOCK_MEMORY.flatMap(m => m.tags)).size}
            </div>
          </CardContent>
        </Card>
        <Card className="panel-card">
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Coverage</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-600">100%</div>
            <div className="text-xs text-muted-foreground">All decisions logged</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("decisions")} className={tab === "decisions" ? "chip-button chip-button-active" : "chip-button"}>
          Decision precedents
        </button>
        <button onClick={() => setTab("audit")} className={tab === "audit" ? "chip-button chip-button-active" : "chip-button"}>
          Full audit log
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search decisions, precedents, tags..."
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      {/* Content */}
      {tab === "decisions" ? (
        <div className="space-y-4">
          {filteredMemory.map(entry => (
            <Card key={entry.id} className="panel-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{entry.id}</span>
                  <Badge variant="outline" className="text-[11px] capitalize">{entry.entityType}</Badge>
                </div>
                <h3 className="text-sm font-semibold">{entry.entityTitle}</h3>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Decision</div>
                  <p className="text-sm">{entry.decisionSummary}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                  <div className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1">Precedent note</div>
                  <p className="text-sm text-amber-900 dark:text-amber-100">{entry.precedentNotes}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map(tag => (
                    <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{tag}</span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Approved by {entry.approvedBy} on {entry.approvedAt}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="panel-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {MOCK_AUDIT.map(entry => (
                    <tr key={entry.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{entry.timestamp}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] capitalize">{entry.action}</Badge></td>
                      <td className="px-4 py-3 text-xs">{entry.actor}</td>
                      <td className="px-4 py-3 text-xs capitalize">{entry.entityType}</td>
                      <td className="px-4 py-3 text-xs">{entry.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <KnowledgeRouting currentModule="Institutional Memory" />
      <UniversalActionBar pageName="Institutional Memory" />
    </div>
  );
}
