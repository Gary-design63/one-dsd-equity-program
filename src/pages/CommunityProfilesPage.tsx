/**
 * Community Profiles — PRD Module 8
 * Cultural intelligence for 30+ communities.
 * Staff: view, download. Consultant: edit, manage.
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UniversalActionBar } from "@/components/UniversalActionBar";
import { KnowledgeRouting } from "@/components/KnowledgeRouting";

interface CommunityProfile {
  id: string;
  communityName: string;
  category: string;
  languages: string[];
  populationEstimate: string;
  geographicConcentration: string;
  culturalConsiderations: string;
  communicationPreferences: string;
  serviceAccessBarriers: string;
  strengths: string[];
  priorityFlag: boolean;
}

const PROFILES: CommunityProfile[] = [
  {
    id: "CP-001",
    communityName: "Somali Community",
    category: "East African",
    languages: ["Somali", "English", "Arabic"],
    populationEstimate: "~80,000 in Minnesota",
    geographicConcentration: "Hennepin County (Minneapolis), Stearns County (St. Cloud), Olmsted County (Rochester)",
    culturalConsiderations: "Strong family and clan-based decision-making. Elders hold significant influence. Islamic faith practices shape daily life and service preferences. Oral tradition is valued — written documents may be less effective than verbal communication.",
    communicationPreferences: "Face-to-face meetings preferred. Male and female staff considerations for sensitive topics. Community health workers and cultural liaisons are trusted intermediaries.",
    serviceAccessBarriers: "Language access gaps at county offices, unfamiliarity with disability service systems, stigma around disability in some families, transportation in greater Minnesota.",
    strengths: ["Strong community networks", "Active self-advocacy organizations (SAPA)", "Multigenerational family support", "Growing bilingual workforce"],
    priorityFlag: true,
  },
  {
    id: "CP-002",
    communityName: "Hmong Community",
    category: "Southeast Asian",
    languages: ["Hmong", "English"],
    populationEstimate: "~95,000 in Minnesota",
    geographicConcentration: "Ramsey County (St. Paul), Hennepin County, Washington County",
    culturalConsiderations: "Clan-based social structure with respected elders. Holistic views of health including spiritual dimensions. Extended family involvement in care decisions. Strong emphasis on family honor and collective well-being.",
    communicationPreferences: "Bilingual staff preferred. Clan leaders may be initial point of contact. Visual materials and community events more effective than written mailings.",
    serviceAccessBarriers: "Generational language gaps, distrust of government systems among older adults, mental health stigma, limited Hmong-speaking providers.",
    strengths: ["Hmong American Partnership (HAP)", "Strong youth leadership", "Cultural preservation organizations", "Growing professional class"],
    priorityFlag: true,
  },
  {
    id: "CP-003",
    communityName: "Latino/Hispanic Community",
    category: "Latin American",
    languages: ["Spanish", "English"],
    populationEstimate: "~310,000 in Minnesota",
    geographicConcentration: "Hennepin County, Ramsey County, Nobles County (Worthington), Kandiyohi County (Willmar)",
    culturalConsiderations: "Family-centered decision-making (familismo). Respect for authority figures (respeto). Personal relationships valued in service delivery (personalismo). Diverse country-of-origin backgrounds with distinct cultural practices.",
    communicationPreferences: "Spanish-language materials essential. Community organizations (CLUES) as trusted partners. Radio and social media outreach effective.",
    serviceAccessBarriers: "Immigration status concerns affecting service utilization, language access, documentation requirements, rural isolation in southern Minnesota.",
    strengths: ["CLUES organization", "Strong community organizing", "Growing bilingual workforce", "Youth advocacy"],
    priorityFlag: true,
  },
  {
    id: "CP-004",
    communityName: "American Indian / Indigenous Nations",
    category: "Indigenous",
    languages: ["English", "Ojibwe", "Dakota"],
    populationEstimate: "~100,000 in Minnesota (11 tribal nations)",
    geographicConcentration: "White Earth Nation, Red Lake Nation, Leech Lake, Mille Lacs, urban Minneapolis/St. Paul",
    culturalConsiderations: "Sovereign nation status — government-to-government relationship required. Historical trauma from forced institutionalization. Holistic understanding of disability that differs from Western medical model. Sacred connection to land and community.",
    communicationPreferences: "Tribal liaison engagement required. Respect for tribal sovereignty in all communications. Community gatherings and powwows as engagement opportunities.",
    serviceAccessBarriers: "Historical distrust of state government, geographic remoteness of reservations, jurisdictional complexities, limited culturally specific providers.",
    strengths: ["Tribal sovereignty and self-determination", "Traditional healing practices", "Strong cultural identity", "Tribal health departments"],
    priorityFlag: true,
  },
  {
    id: "CP-005",
    communityName: "African American Community",
    category: "African American",
    languages: ["English"],
    populationEstimate: "~380,000 in Minnesota",
    geographicConcentration: "Hennepin County (Minneapolis, Brooklyn Park), Ramsey County (St. Paul)",
    culturalConsiderations: "Historical context of systemic racism in healthcare and social services. Faith community as central support structure. Multigenerational family networks. Intersectionality of race and disability experience.",
    communicationPreferences: "Community-based organizations and faith institutions as trusted partners. Representation in staff matters. Culturally relevant materials.",
    serviceAccessBarriers: "Systemic racism in service delivery, disproportionate poverty rates, distrust of government systems, implicit bias in assessments.",
    strengths: ["Strong faith communities", "Civil rights advocacy tradition", "Community organizing networks", "Cultural resilience"],
    priorityFlag: true,
  },
  {
    id: "CP-006",
    communityName: "Vietnamese Community",
    category: "Southeast Asian",
    languages: ["Vietnamese", "English"],
    populationEstimate: "~28,000 in Minnesota",
    geographicConcentration: "Hennepin County, Ramsey County",
    culturalConsiderations: "Respect for elders and authority. Family as primary support unit. Buddhist and Catholic faith influences. Mental health concerns may be expressed as physical symptoms.",
    communicationPreferences: "Vietnamese-language materials. Community organization partnerships. Multi-generational family engagement.",
    serviceAccessBarriers: "Language barriers for older adults, cultural stigma around disability and mental health, limited Vietnamese-speaking providers.",
    strengths: ["Strong family support networks", "Growing professional community", "Cultural organizations", "Bilingual youth"],
    priorityFlag: false,
  },
];

export default function CommunityProfilesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = PROFILES
    .filter(p => !showPriorityOnly || p.priorityFlag)
    .filter(p =>
      p.communityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.languages.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 md:px-6 md:py-6">
      {/* Header */}
      <div>
        <Badge className="mb-2 inline-flex rounded-full border-0 bg-[hsl(var(--mn-blue-soft))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--mn-blue))] dark:bg-white/10 dark:text-white">
          Community Profiles
        </Badge>
        <h1 className="text-xl font-semibold md:text-2xl">Community Profiles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cultural intelligence for {PROFILES.length}+ Minnesota communities served by DSD
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Total profiles</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{PROFILES.length}</div>
        </CardContent></Card>
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Priority populations</div>
          <div className="mt-2 text-2xl font-semibold text-amber-600 tabular-nums">{PROFILES.filter(p => p.priorityFlag).length}</div>
        </CardContent></Card>
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Languages covered</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{new Set(PROFILES.flatMap(p => p.languages)).size}</div>
        </CardContent></Card>
        <Card className="panel-card"><CardContent className="p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Categories</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{new Set(PROFILES.map(p => p.category)).size}</div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search communities, languages..."
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => setShowPriorityOnly(!showPriorityOnly)}
          className={showPriorityOnly ? "chip-button chip-button-active" : "chip-button"}
        >
          Priority only
        </button>
      </div>

      {/* Profiles */}
      <div className="space-y-4">
        {filtered.map(profile => (
          <Card key={profile.id} className="panel-card">
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold">{profile.communityName}</h3>
                  <Badge variant="outline" className="text-[11px]">{profile.category}</Badge>
                  {profile.priorityFlag && (
                    <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                      Priority population
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-xl text-xs"
                  onClick={() => setExpandedId(expandedId === profile.id ? null : profile.id)}
                >
                  {expandedId === profile.id ? "Collapse" : "View full profile"}
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Languages: {profile.languages.join(", ")}</span>
                <span>Population: {profile.populationEstimate}</span>
                <span>Areas: {profile.geographicConcentration}</span>
              </div>

              {expandedId === profile.id && (
                <div className="space-y-3 pt-3 border-t border-border/60">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Cultural considerations</div>
                    <p className="text-sm leading-relaxed">{profile.culturalConsiderations}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Communication preferences</div>
                    <p className="text-sm leading-relaxed">{profile.communicationPreferences}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Service access barriers</div>
                    <p className="text-sm leading-relaxed">{profile.serviceAccessBarriers}</p>
                  </div>
                  <div className="rounded-xl border border-[hsl(var(--mn-green))]/30 bg-emerald-50 p-4 dark:bg-emerald-950/20">
                    <div className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1">Community strengths</div>
                    <ul className="space-y-1">
                      {profile.strengths.map(s => (
                        <li key={s} className="text-sm text-emerald-900 dark:text-emerald-100">• {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <KnowledgeRouting currentModule="Community Profiles" />
      <UniversalActionBar pageName="Community Profiles" />
    </div>
  );
}
