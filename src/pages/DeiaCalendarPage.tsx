/**
 * DEIA Calendar — PRD Module 5
 * Events, cultural observances, training deadlines.
 * Staff: view. Consultant: create, edit, delete, share.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UniversalActionBar } from "@/components/UniversalActionBar";
import { KnowledgeRouting } from "@/components/KnowledgeRouting";

type EventType = "equity" | "cultural" | "training" | "deadline" | "odet";

const EVENT_CONFIG: Record<EventType, { label: string; color: string }> = {
  equity: { label: "Equity", color: "hsl(var(--mn-blue))" },
  cultural: { label: "Cultural Observance", color: "hsl(var(--mn-gold))" },
  training: { label: "Training", color: "hsl(var(--mn-green))" },
  deadline: { label: "Deadline", color: "hsl(var(--destructive))" },
  odet: { label: "ODET", color: "hsl(var(--chart-blue))" },
};

interface CalendarEvent {
  id: string;
  title: string;
  eventType: EventType;
  date: string;
  time: string;
  location: string;
  description: string;
}

const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "1", title: "Hmong New Year Celebration", eventType: "cultural", date: "2026-04-10", time: "10:00 AM – 3:00 PM", location: "St. Paul Convention Center", description: "Community celebration honoring Hmong New Year traditions. Staff encouraged to attend for cultural learning." },
  { id: "2", title: "Equity Lens Training — Cohort 4", eventType: "training", date: "2026-04-12", time: "1:00 PM – 3:00 PM", location: "Virtual (Teams)", description: "Equity lens assessment tool training for new DSD staff members." },
  { id: "3", title: "CLAS Compliance Review Deadline", eventType: "deadline", date: "2026-04-15", time: "5:00 PM", location: "Internal", description: "Quarterly CLAS compliance self-assessment due for all program areas." },
  { id: "4", title: "Disability Pride Month Planning Meeting", eventType: "equity", date: "2026-04-18", time: "2:00 PM – 3:30 PM", location: "DHS Room 240", description: "Planning session for July Disability Pride Month activities and communications." },
  { id: "5", title: "Somali Heritage Week", eventType: "cultural", date: "2026-04-20", time: "All week", location: "Statewide", description: "Week-long recognition of Somali community contributions to Minnesota." },
  { id: "6", title: "ODET Quarterly Report Due", eventType: "odet", date: "2026-04-25", time: "End of day", location: "Internal", description: "Organizational Development and Equity Team quarterly progress report submission." },
  { id: "7", title: "Rural Access Community Forum", eventType: "equity", date: "2026-04-28", time: "9:00 AM – 12:00 PM", location: "Olmsted County Office", description: "Community forum addressing disability service access in rural Minnesota counties." },
  { id: "8", title: "Cultural Responsiveness Module Launch", eventType: "training", date: "2026-04-30", time: "All day", location: "LMS", description: "New learning module on culturally responsive service delivery available in the training system." },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function DeiaCalendarPage() {
  const [selectedMonth] = useState(3); // April
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");

  const filteredEvents = typeFilter === "all"
    ? CALENDAR_EVENTS
    : CALENDAR_EVENTS.filter(e => e.eventType === typeFilter);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 md:px-6 md:py-6">
      {/* Header */}
      <div>
        <Badge className="mb-2 inline-flex rounded-full border-0 bg-[hsl(var(--mn-blue-soft))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--mn-blue))] dark:bg-white/10 dark:text-white">
          DEIA Calendar
        </Badge>
        <h1 className="text-xl font-semibold md:text-2xl">DEIA Calendar — {MONTHS[selectedMonth]} 2026</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Events, cultural observances, training sessions, and compliance deadlines
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {(Object.entries(EVENT_CONFIG) as [EventType, { label: string; color: string }][]).map(([type, config]) => {
          const count = CALENDAR_EVENTS.filter(e => e.eventType === type).length;
          return (
            <Card
              key={type}
              className="panel-card cursor-pointer transition-all hover:shadow-md"
              onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter("all")}
          className={typeFilter === "all" ? "chip-button chip-button-active" : "chip-button"}
        >
          All events
        </button>
        {(Object.entries(EVENT_CONFIG) as [EventType, { label: string; color: string }][]).map(([type, config]) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={typeFilter === type ? "chip-button chip-button-active" : "chip-button"}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-3">
        {filteredEvents.map(event => {
          const config = EVENT_CONFIG[event.eventType];
          return (
            <Card key={event.id} className="panel-card">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
                        {config.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>{event.date}</span>
                      <span>{event.time}</span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <KnowledgeRouting currentModule="DEIA Calendar" />
      <UniversalActionBar pageName="DEIA Calendar" />
    </div>
  );
}
