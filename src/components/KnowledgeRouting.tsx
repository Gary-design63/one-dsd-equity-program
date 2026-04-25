/**
 * KnowledgeRouting — PRD Sections 7.1, 7.2, 8.2
 * REQUIRED on every page.
 * Bidirectional routing to Resource Library and Institutional Memory.
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";

interface KnowledgeRoutingProps {
  currentModule: string;
  relatedIds?: string[];
  className?: string;
}

export function KnowledgeRouting({ currentModule, relatedIds = [], className = "" }: KnowledgeRoutingProps) {
  const location = useLocation();
  const resourceQuery = relatedIds.length > 0
    ? `?module=${encodeURIComponent(currentModule)}&related=${relatedIds.join(",")}`
    : `?module=${encodeURIComponent(currentModule)}`;
  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = [
    { label: "Home", path: "/" },
    ...segments.map((seg, i) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
      path: "/" + segments.slice(0, i + 1).join("/"),
    })),
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            {i > 0 && <span className="text-border">/</span>}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-foreground transition-colors">{crumb.label}</Link>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link to={`/knowledge${resourceQuery}`} className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-[hsl(var(--mn-blue-soft))] p-4 transition-all hover:shadow-md dark:bg-[hsl(var(--mn-blue-soft))]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--mn-blue))] text-white shadow-sm"><span className="text-lg">📚</span></div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">Resource Library</div>
            <div className="text-xs text-muted-foreground">3,000+ documents · contextual search</div>
          </div>
        </Link>
        <Link to={`/institutional-memory?module=${encodeURIComponent(currentModule)}`} className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-amber-50 p-4 transition-all hover:shadow-md dark:bg-amber-950/20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm"><span className="text-lg">📖</span></div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">Institutional Memory</div>
            <div className="text-xs text-muted-foreground">Precedent · Decisions · Audit history</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
