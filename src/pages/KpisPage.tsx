/**
 * KPIs — PRD Module 9
 * Metrics, disparity monitoring, alerts.
 * Consultant: create, edit, update. Staff: view. Leadership: view, export.
 */

import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UniversalActionBar } from "@/components/UniversalActionBar";
import { KnowledgeRouting } from "@/components/KnowledgeRouting";

interface KPI {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  status: "on_track" | "at_risk" | "off_track";
  trend: number[];
  alertThreshold: number;
  category: string;
}

const STATUS_CONFIG = {
  on_track: { label: "On track", className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
  at_risk: { label: "At risk", className: "bg-amber-500/12 text-amber-700 dark:text-amber-300" },
  off_track: { label: "Off track", className: "bg-rose-500/12 text-rose-700 dark:text-rose-300" },
};

const KPIS: KPI[] = [
  {
    id: "KPI-001", name: "Consultant hours saved per week", description: "Hours saved through platform automation vs. manual processes",
    target: 20, current: 16, unit: "hours", status: "at_risk",
    trend: [8, 10, 12, 13, 14, 15, 16], alertThreshold: 15, category: "Capacity",
  },
  {
    id: "KPI-002", name: "Staff platform adoption", description: "Percentage of DSD staff actively using the platform monthly",
    target: 70, current: 62, unit: "%", status: "at_risk",
    trend: [30, 38, 42, 48, 53, 58, 62], alertThreshold: 50, category: "Engagement",
  },
  {
    id: "KPI-003", name: "Consultation response time (urgent)", description: "Average response time for urgent consultations",
    target: 24, current: 18, unit: "hours", status: "on_track",
    trend: [48, 42, 36, 30, 24, 20, 18], alertThreshold: 24, category: "Response",
  },
  {
    id: "KPI-004", name: "Learning completion rate", description: "Staff who completed at least one course",
    target: 50, current: 43, unit: "%", status: "at_risk",
    trend: [15, 22, 28, 33, 37, 40, 43], alertThreshold: 35, category: "Learning",
  },
  {
    id: "KPI-005", name: "Approval queue throughput", description: "Items reviewed within 5 business days",
    target: 100, current: 94, unit: "%", status: "on_track",
    trend: [78, 82, 85, 88, 90, 92, 94], alertThreshold: 85, category: "Capacity",
  },
  {
    id: "KPI-006", name: "Community feedback volume", description: "Community feedback entries per quarter",
    target: 50, current: 38, unit: "entries", status: "at_risk",
    trend: [18, 22, 25, 28, 31, 35, 38], alertThreshold: 30, category: "Engagement",
  },
  {
    id: "KPI-007", name: "Action item completion rate", description: "Action items completed by due date",
    target: 80, current: 76, unit: "%", status: "on_track",
    trend: [55, 60, 64, 68, 72, 74, 76], alertThreshold: 70, category: "Response",
  },
  {
    id: "KPI-008", name: "CLAS compliance score", description: "Year-over-year CLAS compliance improvement",
    target: 90, current: 82, unit: "%", status: "at_risk",
    trend: [68, 72, 74, 76, 78, 80, 82], alertThreshold: 75, category: "Compliance",
  },
];

const DISPARITY_DATA = [
  { region: "Urban", access: 38, gap: 0 },
  { region: "Suburban", access: 44, gap: 6 },
  { region: "Rural", access: 26, gap: -12 },
  { region: "Tribal", access: 22, gap: -16 },
];

export default function KpisPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = ["all", ...new Set(KPIS.map(k => k.category))];
  const filtered = categoryFilter === "all" ? KPIS : KPIS.filter(k => k.category === categoryFilter);

  const onTrack = KPIS.filter(k => k.status === "on_track").length;
  const atRisk = KPIS.filter(k => k.status === "at_risk").length;
  const offTrack = KPIS.filter(k => k.status === "off_track").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 md:px-6 md:py-6">
      {/* Header */}
      <div>
        <Badge className="mb-2 inline-flex rounded-full border-0 bg-[hsl(var(--mn-blue-soft))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--mn-blue))] dark:bg-white/10 dark:text-white">
          Key Performance Indicators
        </Badge>
        <h1 className="text-xl font-semibold md:text-2xl">KPI Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Metrics, disparity monitoring, and alerts across all program outcomes
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Total KPIs</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{KPIS.length}</div>
        </CardContent></Card>
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">On track</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-600 tabular-nums">{onTrack}</div>
        </CardContent></Card>
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">At risk</div>
          <div className="mt-2 text-2xl font-semibold text-amber-600 tabular-nums">{atRisk}</div>
        </CardContent></Card>
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Off track</div>
          <div className="mt-2 text-2xl font-semibold text-rose-600 tabular-nums">{offTrack}</div>
        </CardContent></Card>
      </div>

      {/* Disparity monitor */}
      <Card className="panel-card">
        <CardHeader>
          <CardTitle className="text-base">Regional disparity monitor</CardTitle>
          <CardDescription>Service access per 1,000 people with disabilities by region. Gaps exceeding 10 points trigger escalation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={DISPARITY_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 14, borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="access" name="Access rate" radius={[8, 8, 3, 3]}>
                  {DISPARITY_DATA.map((entry) => (
                    <Cell key={entry.region} fill={Math.abs(entry.gap) > 10 ? "hsl(var(--destructive))" : "hsl(var(--mn-blue))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {DISPARITY_DATA.filter(d => Math.abs(d.gap) > 10).map(d => (
              <div key={d.region} className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs dark:bg-rose-950/30 dark:border-rose-800">
                <span className="font-semibold text-rose-700 dark:text-rose-300">Escalation: </span>
                <span className="text-rose-900 dark:text-rose-100">{d.region} gap is {Math.abs(d.gap)} points below urban baseline</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} className={categoryFilter === cat ? "chip-button chip-button-active" : "chip-button"}>
            {cat === "all" ? "All categories" : cat}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map(kpi => {
          const statusCfg = STATUS_CONFIG[kpi.status];
          const pct = Math.round((kpi.current / kpi.target) * 100);
          const trendData = kpi.trend.map((v, i) => ({ month: `M${i + 1}`, value: v }));
          return (
            <Card key={kpi.id} className="panel-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{kpi.id}</span>
                      <Badge variant="outline" className="text-[10px]">{kpi.category}</Badge>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold">{kpi.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.description}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>
                </div>

                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-2xl font-semibold tabular-nums">{kpi.current}<span className="text-sm text-muted-foreground ml-0.5">{kpi.unit === "%" ? "%" : ` ${kpi.unit}`}</span></div>
                    <div className="text-xs text-muted-foreground">Target: {kpi.target}{kpi.unit === "%" ? "%" : ` ${kpi.unit}`}</div>
                  </div>
                  <div className="flex-1">
                    <Progress value={Math.min(pct, 100)} className="h-2" />
                    <div className="mt-1 text-right text-xs text-muted-foreground tabular-nums">{pct}% of target</div>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-2">
                  <ResponsiveContainer width="100%" height={60}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id={`grad-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--mn-blue))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--mn-blue))" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--mn-blue))" fill={`url(#grad-${kpi.id})`} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <KnowledgeRouting currentModule="KPIs" />
      <UniversalActionBar pageName="KPIs" />
    </div>
  );
}
