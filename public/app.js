/* ============================================================ 
   One DSD Equity Program — Application Controller 
   Minnesota DHS Disability Services Division 
   ============================================================ */ (function () { 
 "use strict"; 
 const D = window.APP_DATA; 
 const $ = (s, c) => (c || document).querySelector(s); 
 const $$ = (s, c) => [...(c || document).querySelectorAll(s)]; 
 const mainEl = () => $("#main-content"); 
 const titleEl = () => $("#page-title"); 
 /* ── Helpers ────────────────────────────────────── */ 
 function getById(arr, id) { return arr.find(i => i.id === id); } 
 function lookupName(arr, id) { const o = getById(arr, id); return o ? o.name || o.title : id; } 
 function roleName(id) { return lookupName(D.roles, id); } 
 function formatDate(s) { 
     if (!s) return "—"; 
     const d = new Date(s + "T00:00:00"); 
     return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); 
 } 
 function getRelated(entityId) { 
     return D.relationships.filter(r => r.fromId === entityId || r.toId === entityId); 
 } 
 function entityLink(id, label, hash) { 
     return `<a href="#${hash}" class="entity-link">${label || id}</a>`; 
 } 
 function docLink(id) { return entityLink(id, lookupName(D.documents, id), `knowledge-base/${id}`); } 
 function wfLink(id) { return entityLink(id, lookupName(D.workflows, id), `workflows/${id}`); } 
 function tmpLink(id) { return entityLink(id, lookupName(D.templates, id), `templates/${id}`); } 
 function kpiLink(id) { return entityLink(id, lookupName(D.kpis, id), "metrics"); } 
 function laLink(id) { return entityLink(id, lookupName(D.learningAssets, id), `learning/${id}`); } 
 function roleLink(id) { return entityLink(id, roleName(id), `roles/${id}`); } 
 function runLink(id) { const r = getById(D.workflowRuns, id); return entityLink(id, r ? r.title : id, `workflows/run/${id}`); } 
 /* Badges */ 
 const statusColors = { 
     Active: "success", Completed: "success", Approved: "success", "Ready for Use": "success", "On Track": "success", Mitigated: "success", 
     "In Progress": "primary", Tagged: "primary", Linked: "primary", Monitoring: "primary", 
     Draft: "gold", "On Hold": "gold", "Under Review": "gold", Proposed: "gold", Partial: "gold", "Needs Validation": "gold", 
     "At Risk": "warning", "Manual Entry": "warning", 
     Overdue: "error", Closed: "muted", Archived: "muted", Superseded: "muted", "Not Yet Operational": "muted", 
     High: "error", Medium: "warning", Low: "success", 
     Required: "primary", Optional: "muted", Important: "gold" 
 }; 
 function badge(text, color) { 
     if (!text) return ""; 
     const c = color || statusColors[text] || "muted"; 
     return `<span class="badge badge--${c}">${text}</span>`; 
 } 
 function statusBadge(s) { return badge(s); } 
 function priorityBadge(p) { return badge(p); } 
 function authorityBadge(rank) { 
     const labels = { 1: "Law/Reg", 2: "Federal/State", 3: "Enterprise", 4: "Division", 5: "Program", 6: "Procedure", 7: "Educational", 8: "Archived" }; 
     const colors = { 1: "authority-1", 2: "authority-1", 3: "authority-2", 4: "authority-2", 5: "authority-3", 6: "authority-3", 7: "authority-4", 8: "authority-4" }; 
     return `<span class="badge badge--${colors[rank] || "muted"}" title="Authority Rank ${rank}">${rank} · ${labels[rank] || "Unknown"}</span>`; 
 } 
 function batchBadge(b) { 
     if (!b) return ""; 
     const map = { 
         "Governing Authority": "authority-1", "Institutional Context": "authority-2", 
         "Equity Analysis and Engagement": "primary", "Accessibility and Language Access": "blue", 
         "Workforce Equity": "purple", "Service System Operations": "gold", 
         "Educational and Reusable Resources": "success", 
         "One DSD Program Core Internal": "authority-3", "Program Operations Internal": "authority-3", 
         "Data and Measurement Internal": "authority-3", "Learning Architecture Internal": "authority-3", 
         "Templates Internal": "authority-3" 
     }; 
     return `<span class="badge badge--${map[b] || "muted"}">${b}</span>`; 
 } 
 function trendHTML(trend, current, previous) { 
     const icons = { up: "trending-up", down: "trending-down", flat: "minus" }; 
     const colors = { up: "var(--color-success)", down: "var(--color-error)", flat: "var(--color-text-muted)" }; 
     const diff = previous ? Math.round(Math.abs(current - previous) * 100) / 100 : ""; 
     return `<span class="trend trend--${trend}" style="color:${colors[trend]}"><i data-lucide="${icons[trend]}" style="width:16px;height:16px"></i>${diff !== "" ? ` ${diff}` : ""}</span>`; 
 } 
 function dataQualityBadge(q) { return badge(q); } 
 function breadcrumb(items) { 
 
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((it, i) => i < items.length - 1 ? `<a href="#${it.hash}" class="breadcrumb__link">${it.label}</a><span class="breadcrumb__sep">/</span>` : `<span class="breadcrumb__current">${it.label}</span>`).join("")}</nav>`; 
 } 
 function sectionTitle(text, icon) { return `<h2 class="section-title"><i data-lucide="${icon}" style="width:20px;height:20px"></i> ${text}</h2>`; } 
 function emptyState(msg) { return `<div class="empty-state"><i data-lucide="inbox" style="width:48px;height:48px;opacity:.3"></i><p>${msg}</p></div>`; } 
 function cardGrid(html) { return `<div class="card-grid">${html}</div>`; } 
 function metaRow(label, value) { return value ? `<div class="meta-row"><span class="meta-label">${label}</span><span class="meta-value">${value}</span></div>` : ""; } 
 /* ── Router ─────────────────────────────────────── */ 
 const pageNames = { 
     dashboard: "Dashboard", "knowledge-base": "Knowledge Base", workflows: "Workflows", 
     templates: "Templates", metrics: "Metrics & Reporting", learning: "Learning Portal", 
     assistant: "Assistant", roles: "Roles & Governance", actions: "Actions", risks: "Risks" 
 }; 
 function route() { 
     const hash = location.hash.slice(1) || "dashboard"; 
     const parts = hash.split("/"); 
     const page = parts[0]; 
     const id = parts[1]; 
     const subId = parts[2]; 
     const el = mainEl(); 
     // Update sidebar active state 
     $$(".nav-item").forEach(btn => { 
         btn.classList.toggle("active", btn.dataset.page === page); 
     }); 
     // Render icons in sidebar 
     $$(".nav-item").forEach(btn => { 
         const iconSpan = btn.querySelector(".nav-item__icon"); 
         if (iconSpan && btn.dataset.icon) { 
             iconSpan.innerHTML = `<i data-lucide="${btn.dataset.icon}"></i>`; 
         } 
     }); 
     // Close mobile sidebar 
     $("#sidebar").classList.remove("sidebar--open"); 
     $("#sidebar-overlay").classList.remove("sidebar-overlay--visible"); 
     // Route to page 
     try { 
         if (page === "dashboard") { renderDashboard(el); titleEl().textContent = "Dashboard"; } 
         else if (page === "knowledge-base" && id) { renderDocDetail(el, id); titleEl().textContent = "Knowledge Base"; } 
         else if (page === "knowledge-base") { renderKnowledgeBase(el); titleEl().textContent = "Knowledge Base"; } 
         else if (page === "workflows" && id === "run" && subId) { renderRunDetail(el, subId); titleEl().textContent = "Workflows"; } 
         else if (page === "workflows" && id) { renderWorkflowDetail(el, id); titleEl().textContent = "Workflows"; } 
         else if (page === "workflows") { renderWorkflows(el); titleEl().textContent = "Workflows"; } 
         else if (page === "templates" && id) { renderTemplateDetail(el, id); titleEl().textContent = "Templates"; } 
         else if (page === "templates") { renderTemplates(el); titleEl().textContent = "Templates"; } 
         else if (page === "metrics") { renderMetrics(el); titleEl().textContent = "Metrics & Reporting"; } 
         else if (page === "learning" && id) { renderLearningDetail(el, id); titleEl().textContent = "Learning Portal"; } 
         else if (page === "learning") { renderLearning(el); titleEl().textContent = "Learning Portal"; } 
         else if (page === "assistant") { renderAssistant(el); titleEl().textContent = "Assistant"; } 
         else if (page === "roles" && id) { renderRoleDetail(el, id); titleEl().textContent = "Roles & Governance"; } 
         else if (page === "roles") { renderRoles(el); titleEl().textContent = "Roles & Governance"; } 
         else if (page === "actions") { renderActions(el); titleEl().textContent = "Actions"; } 
         else if (page === "risks") { renderRisks(el); titleEl().textContent = "Risks"; } 
         else { renderDashboard(el); titleEl().textContent = "Dashboard"; } 
     } catch (e) { console.error("Render error:", e); el.innerHTML = `<div class="empty-state"><p>Error loading page: ${e.message}</p></div>`; } 
     if (typeof lucide !== "undefined") lucide.createIcons(); 
     el.scrollTop = 0; 
 } 
 /* ── DASHBOARD ──────────────────────────────────── */ 
 function renderDashboard(el) { 
     const groups = ["Demand & Throughput", "Timeliness", "Quality & Follow-Through", "Learning & Capacity", "Accountability & Progress"]; 
     const activeRuns = D.workflowRuns.filter(r => r.status !== "Completed"); 
     let kpiHTML = ""; 
     groups.forEach(g => { 
         const kpis = D.kpis.filter(k => k.dashboardGroup === g); 
         if (!kpis.length) return; 
         kpiHTML += `<div class="kpi-group"><h3 class="kpi-group__title">${g}</h3><div class="kpi-grid">`; 
         kpis.forEach(k => { 
             const pct = k.target ? Math.round((k.currentValue / k.target) * 100) : null; 
             kpiHTML += `<div class="kpi-card"> 
                 <div class="kpi-card__header"><span class="kpi-card__name">${k.name}</span>${dataQualityBadge(k.dataQuality)}</div> 
                 <div class="kpi-card__value">${k.unit === "percentage" ? k.currentValue + "%" : k.currentValue}<span class="kpi-card__unit">${k.unit === "days" ? " days" : ""}</span></div> 
                 <div class="kpi-card__footer"> 
                     ${k.target ? `<span class="kpi-card__target">Target: ${k.unit === "percentage" ? k.target + "%" : k.target}</span>` : ""} 
                     ${trendHTML(k.trend, k.currentValue, k.previousValue)} 
                 </div> 
                 ${pct !== null ? `<div class="kpi-card__progress"><div class="progress-bar"><div class="progress-bar__fill" style="width:${Math.min(pct, 100)}%;background:${pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-warning)" : "var(--color-error)"}"></div></div></div>` : ""} 
             </div>`; 
         }); 
         kpiHTML += `</div></div>`; 
     }); 
     let runsHTML = activeRuns.length ? `<table class="data-table"><thead><tr><th>Title</th><th>Workflow</th><th>Stage</th><th>Status</th><th>Priority</th><th>Assigned</th></tr></thead><tbody>` + 
         activeRuns.map(r => `<tr class="clickable-row" data-href="#workflows/run/${r.id}"><td>${r.title}</td><td>${lookupName(D.workflows, r.workflowId)}</td><td>${badge(r.currentStage, "primary")}</td><td>${statusBadge(r.status)}</td><td>${priorityBadge(r.priority)}</td><td>${roleName(r.assignedTo)}</td></tr>`).join("") + 
         `</tbody></table>` : emptyState("No active workflow runs"); 
     let actionsHTML = D.actions.length ? `<table class="data-table"><thead><tr><th>Action</th><th>Owner</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead><tbody>` + 
         D.actions.map(a => `<tr><td>${a.title}</td><td>${roleName(a.owner)}</td><td>${statusBadge(a.status)}</td><td>${priorityBadge(a.priority)}</td><td>${formatDate(a.dueDate)}</td></tr>`).join("") + 
         `</tbody></table>` : ""; 
     let risksHTML = D.risks.filter(r => r.status === "Active").map(r => 
         `<div class="card card--compact"><div class="card__header"><span class="card__title">${r.title}</span><div>${badge(r.severity)} ${badge(r.likelihood)}</div></div><p class="card__desc">${r.mitigationPlan}</p><div class="card__footer">${statusBadge(r.status)} · ${roleName(r.owner)}</div></div>` 
     ).join(""); 
     const rp = D.reportingPeriods[0]; 
     el.innerHTML = ` 
         <div class="page-content"> 
             <div class="welcome-banner"> 
           
    <div class="welcome-banner__text"> 
                     <h1 class="welcome-banner__title">One DSD Equity Program</h1> 
                     <p class="welcome-banner__subtitle">Disability Services Division — Equity Operating System</p> 
                 </div> 
                 <div class="welcome-banner__meta"> 
                     <span class="welcome-banner__period"><i data-lucide="calendar" style="width:16px;height:16px"></i> ${rp ? rp.name : "—"}</span> 
                 </div> 
             </div> 
             <div class="snapshot-bar"> 
                 <div class="snapshot-item"><span class="snapshot-item__value">${D.documents.length}</span><span class="snapshot-item__label">Documents</span></div> 
                 <div class="snapshot-item"><span class="snapshot-item__value">${D.workflows.length}</span><span class="snapshot-item__label">Workflows</span></div> 
                 <div class="snapshot-item"><span class="snapshot-item__value">${D.templates.length}</span><span class="snapshot-item__label">Templates</span></div> 
                 <div class="snapshot-item"><span class="snapshot-item__value">${D.kpis.length}</span><span class="snapshot-item__label">KPIs</span></div> 
                 <div class="snapshot-item"><span class="snapshot-item__value">${D.learningAssets.length}</span><span class="snapshot-item__label">Learning Assets</span></div> 
                 <div class="snapshot-item"><span class="snapshot-item__value">${D.roles.length}</span><span class="snapshot-item__label">Roles</span></div> 
             </div> 
             ${kpiHTML} 
             ${sectionTitle("Active Workflow Runs", "git-branch")} 
             ${runsHTML} 
             ${sectionTitle("Program Actions", "check-circle-2")} 
             ${actionsHTML} 
             ${risksHTML.length ? sectionTitle("Active Risks", "alert-triangle") + `<div class="card-grid card-grid--2">${risksHTML}</div>` : ""} 
         </div>`; 
     setupClickableRows(el); 
 } 
 /* ── KNOWLEDGE BASE ─────────────────────────────── */ 
 function renderKnowledgeBase(el) { 
     const batches = [...new Set(D.documents.map(d => d.batch))].sort(); 
     const types = [...new Set(D.documents.map(d => d.authorityType))].sort(); 
     const sources = ["Public", "Internal"]; 
     el.innerHTML = `<div class="page-content"> 
         <div class="page-actions"><button class="btn btn--primary" id="btn-add-doc"><i data-lucide="plus" style="width:16px;height:16px"></i> Add Document</button></div> 
         ${sectionTitle("Knowledge Base", "book-open")} 
         <div class="filter-bar"> 
             <select id="f-batch" class="filter-select"><option value="">All Batches</option>${batches.map(b => `<option>${b}</option>`).join("")}</select> 
             <select id="f-auth" class="filter-select"><option value="">All Authority Types</option>${types.map(t => `<option>${t}</option>`).join("")}</select> 
             <select id="f-source" class="filter-select"><option value="">All Sources</option>${sources.map(s => `<option>${s}</option>`).join("")}</select> 
             <input type="search" id="f-search" class="filter-search" placeholder="Search documents…"> 
         </div> 
         <p class="result-count" id="doc-count">${D.documents.length} documents</p> 
         <table class="data-table" id="doc-table"><thead><tr> 
             <th>Title</th><th>Batch</th><th>Authority</th><th>Source</th><th>Status</th><th>SoT</th> 
         </tr></thead><tbody id="doc-tbody"></tbody></table> 
     </div>`; 
     filterDocs(el); 
     ["f-batch", "f-auth", "f-source", "f-search"].forEach(id => { 
         const input = $(`#${id}`, el); 
         input.addEventListener(id === "f-search" ? "input" : "change", () => filterDocs(el)); 
     }); 
     const addDocBtn = $("#btn-add-doc", el); 
     if (addDocBtn) addDocBtn.addEventListener("click", () => window.CRUD.openDocumentForm()); 
 } 
 function filterDocs(el) { 
     const batch = ($("#f-batch", el) || {}).value || ""; 
     const auth = ($("#f-auth", el) || {}).value || ""; 
     const source = ($("#f-source", el) || {}).value || ""; 
     const q = ($("#f-search", el) || {}).value.toLowerCase(); 
     let docs = D.documents; 
     if (batch) docs = docs.filter(d => d.batch === batch); 
     if (auth) docs = docs.filter(d => d.authorityType === auth); 
     if (source) docs = docs.filter(d => d.sourceType === source); 
     if (q) docs = docs.filter(d => (d.title + " " + d.shortTitle + " " + d.purpose).toLowerCase().includes(q)); 
     docs.sort((a, b) => a.authorityRank - b.authorityRank); 
     const tbody = $("#doc-tbody", el); 
     if (!tbody) return; 
     tbody.innerHTML = docs.length ? docs.map(d => `<tr class="clickable-row" data-href="#knowledge-base/${d.id}"> 
         <td><strong>${d.title}</strong></td><td>${batchBadge(d.batch)}</td><td>${authorityBadge(d.authorityRank)}</td> 
         <td>${badge(d.sourceType, d.sourceType === "Public" ? "primary" : "gold")}</td> 
         <td>${statusBadge(d.status)}</td><td>${d.sourceOfTruth ? '<i data-lucide="shield-check" style="width:16px;height:16px;color:var(--color-success)"></i>' : "—"}</td> 
     </tr>`).join("") : `<tr><td colspan="6">${emptyState("No documents match filters")}</td></tr>`; 
     const countEl = $("#doc-count", el); 
     if (countEl) countEl.textContent = `${docs.length} document${docs.length !== 1 ? "s" : ""}`; 
     setupClickableRows(el); 
     if (typeof lucide !== "undefined") lucide.createIcons(); 
 } 
 function renderDocDetail(el, id) { 
     const d = getById(D.documents, id); 
     if (!d) { el.innerHTML = emptyState("Document not found"); return; } 
     const rels = getRelated(id); 
     const relDocs = rels.filter(r => (r.fromType === "Document" && r.toType === "Document") || (r.toType === "Document" && r.fromType === "Document")); 
     const relWfs = rels.filter(r => r.fromType === "Workflow" || r.toType === "Workflow"); 
     const relKpis = rels.filter(r => r.fromType === "KPI" || r.toType === "KPI" || r.fromType === "Metric" || r.toType === "Metric"); 
     const relTraining = rels.filter(r => r.fromType === "Learning" || r.toType === "Learning" || r.fromType === "Educational" || r.toType === "Educational"); 
     el.innerHTML = `<div class="page-content"> 
         ${breadcrumb([{ label: "Knowledge Base", hash: "knowledge-base" }, { label: d.shortTitle || d.title }])} 
         <div class="detail-header"> 
             <h1 class="detail-title">${d.title}</h1> 
             <div class="detail-badges">${batchBadge(d.batch)} ${d.secondaryBatch ? batchBadge(d.secondaryBatch) : ""} ${authorityBadge(d.authorityRank)} ${statusBadge(d.status)}</div> 
             <div class="detail-actions"><button class="btn btn--ghost btn--sm" id="btn-edit-doc"><i data-lucide="pencil" style="width:14px;height:14px"></i> Edit</button><button class="btn btn--ghost btn--sm btn--delete" id="btn-del-doc"><i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete</button></div> 
         </div> 
         <div class="detail-grid"> 
             <div class="detail-main"> 
                 <div class="card"> 
                     <h3 class="card__title">Document Information</h3> 
                     <div class="meta-grid"> 
                         ${metaRow("Short Title", d.shortTitle)} 
                         ${metaRow("Authority Type", d.authorityType)} 
                         ${metaRow("Authority Rank", authorityBadge(d.authorityRank))} 
                         ${metaRow("Source Type", badge(d.sourceType, d.sourceType === "Public" ? "primary" : "gold"))} 
                         ${metaRow("Source Organization", d.sourceOrg)} 
                         ${metaRow("Document Type", d.documentType)} 
                         ${metaRow("Format", d.format)} 
                         ${metaRow("Audience", d.audience)} 
                         ${metaRow("Owner", roleLink(d.owner))} 
                         ${metaRow("Effective Date", formatDate(d.effectiveDate))} 
                         ${metaRow("Review Date", formatDate(d.reviewDate))} 
                         ${metaRow("Processing Status", statusBadge(d.processingStatus))} 
                         ${metaRow("Source of Truth", d.sourceOfTruth ? '<i data-lucide="shield-check" style="width:16px;height:16px;color:var(--color-success)"></i> Yes' : "No")} 
                         ${metaRow("Required for Compliance", d.requiredForCompliance ? "Yes" : "No")} 
                         ${metaRow("Program Relevance", badge(d.programRelevance))} 
                         ${metaRow("Educational Relevance", d.educationalRelevance)} 
                         ${metaRow("Equity Method", d.equityMethod)} 
                         ${metaRow("Institutional Scope", d.institutionalScope)} 
                         ${metaRow("Geographic Scope", d.geographicScope)} 
                     </div> 
                 </div> 
                 <div class="card"> 
                     <h3 class="card__title">Purpose</h3> 
                     <p>${d.purpose}</p> 
                 </div> 
                 ${d.notes ? `<div class="card"><h3 class="card__title">Notes</h3><p>${d.notes}</p></div>` : ""} 
             </div> 
             <div class="detail-sidebar"> 
                 <div class="card"> 
                     <h3 class="card__title">Related Documents</h3> 
                     ${relDocs.length ? relDocs.map(r => { 
                   
    const otherId = r.fromId === id ? r.toId : r.fromId; 
                         return `<div class="related-item">${docLink(otherId)}<span class="related-type">${r.relationshipType}</span>${badge(r.strength)}</div>`; 
                     }).join("") : "<p class='text-muted'>No related documents</p>"} 
                 </div> 
                 <div class="card"> 
                     <h3 class="card__title">Related Workflows</h3> 
                     ${relWfs.length ? relWfs.map(r => { 
                         const wfId = r.fromType === "Workflow" ? r.fromId : r.toId; 
 
                      return `<div class="related-item">${wfLink(wfId)}<span class="related-type">${r.relationshipType}</span></div>`; 
                     }).join("") : (d.relatedWorkflow ? `<p>${d.relatedWorkflow}</p>` : "<p class='text-muted'>None</p>")} 
                 </div> 
                 <div class="card"> 
                     <h3 class="card__title">Related Metrics</h3> 
                     ${relKpis.length ? relKpis.map(r => { 
                         const kId = r.fromType === "KPI" || r.fromType === "Metric" ? r.fromId : r.toId; 
                         return `<div class="related-item">${kpiLink(kId)}<span class="related-type">${r.relationshipType}</span></div>`; 
                     }).join("") : (d.relatedMetric ? `<p>${d.relatedMetric}</p>` : "<p class='text-muted'>None</p>")} 
                 </div> 
                 <div class="card"> 
                     <h3 class="card__title">Related Educational Resources</h3> 
                     ${relTraining.length ? relTraining.map(r => { 
                         const tId = r.fromType === "Learning" || r.fromType === "Educational" ? r.fromId : r.toId; 
                         return `<div class="related-item">${laLink(tId)}<span class="related-type">${r.relationshipType}</span></div>`; 
                     }).join("") : (d.relatedEducation ? `<p>${d.relatedEducation}</p>` : "<p class='text-muted'>None</p>")} 
                 </div> 
             </div> 
         </div> 
     </div>`; 
     const editBtn = $("#btn-edit-doc", el); 
     if (editBtn) editBtn.addEventListener("click", () => window.CRUD.openDocumentForm(d)); 
     const delBtn = $("#btn-del-doc", el); 
     if (delBtn) delBtn.addEventListener("click", () => window.CRUD.deleteDocument(id)); 
 } 
 /* ── WORKFLOWS ──────────────────────────────────── */ 
 function renderWorkflows(el) { 
     const wfCards = D.workflows.map(w => { 
         const runs = D.workflowRuns.filter(r => r.workflowId === w.id); 
         const activeCount = runs.filter(r => r.status !== "Completed").length; 
         return `<div class="card card--clickable" data-href="#workflows/${w.id}"> 
             <div class="card__header"><span class="card__title">${w.name}</span>${statusBadge(w.status)}</div> 
         
  <p class="card__desc">${w.description.slice(0, 120)}…</p> 
             <div class="card__footer"> 
                 <span><i data-lucide="layers" style="width:14px;height:14px"></i> ${w.stages.length} stages</span> 
                 <span><i data-lucide="play" style="width:14px;height:14px"></i> ${activeCount} active run${activeCount !== 1 ? "s" : ""}</span> 
                 <span>${roleName(w.owner)}</span> 
             </div> 
         </div>`; 
     }).join(""); 
     const runsTable = D.workflowRuns.length ? `<table class="data-table"><thead><tr><th>Title</th><th>Workflow</th><th>Stage</th><th>Status</th><th>Priority</th><th>Target</th></tr></thead><tbody>` + 
         D.workflowRuns.map(r => `<tr class="clickable-row" data-href="#workflows/run/${r.id}"><td>${r.title}</td><td>${lookupName(D.workflows, r.workflowId)}</td><td>${badge(r.currentStage, "primary")}</td><td>${statusBadge(r.status)}</td><td>${priorityBadge(r.priority)}</td><td>${formatDate(r.targetDate)}</td></tr>`).join("") + 
         `</tbody></table>` : ""; 
     el.innerHTML = `<div class="page-content"> 
         ${sectionTitle("Workflows", "git-branch")} 
         <div class="card-grid">${wfCards}</div> 
         <div class="page-actions" style="margin-top:var(--space-4)"><button class="btn btn--primary" id="btn-add-run"><i data-lucide="plus" style="width:16px;height:16px"></i> Start New Run</button></div> 
         ${sectionTitle("All Workflow Runs", "play")} 
         ${runsTable} 
     </div>`; 
     setupClickableRows(el); 
     setupClickableCards(el); 
     const addRunBtn = $("#btn-add-run", el); 
     if (addRunBtn) addRunBtn.addEventListener("click", () => window.CRUD.openRunForm()); 
 } 
 function renderWorkflowDetail(el, id) { 
     const w = getById(D.workflows, id); 
     if (!w) { el.innerHTML = emptyState("Workflow not found"); return; } 
     const runs = D.workflowRuns.filter(r => r.workflowId === id); 
     const stages = w.stages.sort((a, b) => a.order - b.order); 
     const stagesHTML = `<div class="stage-pipeline">${stages.map((s, i) => 
         `<div class="stage-step"><div class="stage-step__number">${i + 1}</div><div class="stage-step__name">${s.name}</div></div>${i < stages.length - 1 ? '<div class="stage-step__arrow"><i data-lucide="chevron-right" style="width:16px;height:16px"></i></div>' : ""}` 
     ).join("")}</div>`; 
     const reqDocs = (w.requiredDocs || []).map(id => `<li>${docLink(id)}</li>`).join(""); 
     const outTemps = (w.outputTemplates || []).map(id => `<li>${tmpLink(id)}</li>`).join(""); 
     const relMetrics = (w.relatedMetrics || []).map(id => `<li>${kpiLink(id)}</li>`).join(""); 
     el.innerHTML = `<div class="page-content"> 
         ${breadcrumb([{ label: "Workflows", hash: "workflows" }, { label: w.name }])} 
         <div class="detail-header"> 
             <h1 class="detail-title">${w.name}</h1> 
             <div class="detail-badges">${statusBadge(w.status)}</div> 
         </div> 
         <div class="card"><p>${w.description}</p></div> 
         <div class="meta-grid" style="margin-bottom:var(--space-6)"> 
             ${metaRow("Owner", roleLink(w.owner))} 
             ${metaRow("Trigger", w.trigger)} 
             ${metaRow("Review Frequency", w.reviewFrequency)} 
         </div> 
         ${sectionTitle("Workflow Stages", "layers")} 
         ${stagesHTML} 
         <div class="detail-grid" style="margin-top:var(--space-6)"> 
             <div class="detail-main"> 
                 ${sectionTitle("Runs", "play")} 
                 ${runs.length ? `<table class="data-table"><thead><tr><th>Title</th><th>Stage</th><th>Status</th><th>Priority</th><th>Target</th></tr></thead><tbody>` + 
                     runs.map(r => `<tr class="clickable-row" data-href="#workflows/run/${r.id}"><td>${r.title}</td><td>${badge(r.currentStage, "primary")}</td><td>${statusBadge(r.status)}</td><td>${priorityBadge(r.priority)}</td><td>${formatDate(r.targetDate)}</td></tr>`).join("") + 
                     `</tbody></table>` : emptyState("No runs for this workflow")} 
             </div> 
             <div class="detail-sidebar"> 
                 ${reqDocs ? `<div class="card"><h3 class="card__title">Required Documents</h3><ul class="link-list">${reqDocs}</ul></div>` : ""} 
                 ${outTemps ? `<div class="card"><h3 class="card__title">Output Templates</h3><ul class="link-list">${outTemps}</ul></div>` : ""} 
                 ${relMetrics ? `<div class="card"><h3 class="card__title">Related Metrics</h3><ul class="link-list">${relMetrics}</ul></div>` : ""} 
             </div> 
         </div> 
     </div>`; 
     setupClickableRows(el); 
 } 
 function renderRunDetail(el, id) { 
     const r = getById(D.workflowRuns, id); 
     if (!r) { el.innerHTML = emptyState("Workflow run not found"); return; } 
     const w = getById(D.workflows, r.workflowId); 
     const stages = w ? w.stages.sort((a, b) => a.order - b.order) : []; 
     const currentIdx = stages.findIndex(s => s.name === r.currentStage); 
     const progressHTML = stages.length ? `<div class="stage-pipeline">${stages.map((s, i) => { 
         const state = i < currentIdx ? "completed" : i === currentIdx ? "active" : "upcoming"; 
         return `<div class="stage-step stage-step--${state}"><div class="stage-step__number">${i < currentIdx ? '✓' : i + 1}</div><div class="stage-step__name">${s.name}</div></div>${i < stages.length - 1 ? '<div class="stage-step__arrow"><i data-lucide="chevron-right" style="width:16px;height:16px"></i></div>' : ""}`; 
     }).join("")}</div>` : ""; 
     el.innerHTML = `<div class="page-content"> 
         ${breadcrumb([{ label: "Workflows", hash: "workflows" }, { label: w ? w.name : "Workflow", hash: w ? `workflows/${w.id}` : "workflows" }, { label: r.title }])} 
         <div class="detail-header"> 
             <h1 class="detail-title">${r.title}</h1> 
             <div class="detail-badges">${statusBadge(r.status)} ${priorityBadge(r.priority)}</div> 
             <div class="detail-actions"><button class="btn btn--ghost btn--sm" id="btn-edit-run"><i data-lucide="pencil" style="width:14px;height:14px"></i> Edit</button><button class="btn btn--ghost btn--sm btn--delete" id="btn-del-run"><i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete</button></div> 
         </div> 
         ${progressHTML} 
         <div class="detail-grid" style="margin-top:var(--space-6)"> 
             <div class="detail-main"> 
                 <div class="card"><h3 class="card__title">Details</h3><p>${r.description}</p> 
                     <div class="meta-grid" style="margin-top:var(--space-4)"> 
                         ${metaRow("Workflow", w ? wfLink(w.id) : "—")} 
                         ${metaRow("Current Stage", badge(r.currentStage, "primary"))} 
                         ${metaRow("Requested By", roleLink(r.requestedBy))} 
                         ${metaRow("Assigned To", roleLink(r.assignedTo))} 
                         ${metaRow("Start Date", formatDate(r.startDate))} 
                         ${metaRow("Target Date", formatDate(r.targetDate))} 
                     </div> 
                 </div> 
                 ${r.notes ? `<div class="card"><h3 class="card__title">Notes</h3><p>${r.notes}</p></div>` : ""} 
             </div> 
             <div class="detail-sidebar"> 
                 <div class="card"><h3 class="card__title">Linked Documents</h3> 
                     ${(r.linkedDocs || []).length ? `<ul class="link-list">${r.linkedDocs.map(id => `<li>${docLink(id)}</li>`).join("")}</ul>` : "<p class='text-muted'>None</p>"} 
                 </div> 
                 <div class="card"><h3 class="card__title">Linked Templates</h3> 
                     ${(r.linkedTemplates || []).length ? `<ul class="link-list">${r.linkedTemplates.map(id => `<li>${tmpLink(id)}</li>`).join("")}</ul>` : "<p class='text-muted'>None</p>"} 
                 </div> 
             </div> 
         </div> 
     </div>`; 
     const editRunBtn = $("#btn-edit-run", el); 
     if (editRunBtn) editRunBtn.addEventListener("click", () => window.CRUD.openRunForm(r, r.workflowId)); 
     const delRunBtn = $("#btn-del-run", el); 
     if (delRunBtn) delRunBtn.addEventListener("click", () => window.CRUD.deleteRun(id)); 
 } 
 /* ── TEMPLATES ──────────────────────────────────── */ 
 function renderTemplates(el) { 
     const types = [...new Set(D.templates.map(t => t.type))].sort(); 
     el.innerHTML = `<div class="page-content"> 
         <div class="page-actions"><button class="btn btn--primary" id="btn-add-tmpl"><i data-lucide="plus" style="width:16px;height:16px"></i> Add Template</button></div> 
         ${sectionTitle("Templates & Forms", "file-text")} 
         <div class="filter-bar"> 
             <select id="f-type" class="filter-select"><option value="">All Types</option>${types.map(t => `<option>${t}</option>`).join("")}</select> 
             <input type="search" id="f-search" class="filter-search" placeholder="Search templates…"> 
         </div> 
         <table class="data-table"><thead><tr><th>Name</th><th>Type</th><th>Linked Workflows</th><th>Owner</th><th>Status</th><th>Version</th></tr></thead><tbody id="tmp-tbody"></tbody></table> 
     </div>`; 
     filterTemplates(el); 
     ["f-type", "f-search"].forEach(id => { 
         const input = $(`#${id}`, el); 
         if (input) input.addEventListener(id === "f-search" ? "input" : "change", () => filterTemplates(el)); 
     }); 
     const addTmplBtn = $("#btn-add-tmpl", el); 
     if (addTmplBtn) addTmplBtn.addEventListener("click", () => window.CRUD.openTemplateForm()); 
 } 
 function filterTemplates(el) { 
     const type = ($("#f-type", el) || {}).value || ""; 
     const q = ($("#f-search", el) || {}).value.toLowerCase(); 
     let tmps = D.templates; 
     if (type) tmps = tmps.filter(t => t.type === type); 
     if (q) tmps = tmps.filter(t => t.name.toLowerCase().includes(q)); 
     const tbody = $("#tmp-tbody", el); 
     if (!tbody) return; 
     tbody.innerHTML = tmps.length ? tmps.map(t => `<tr class="clickable-row" data-href="#templates/${t.id}"> 
         <td><strong>${t.name}</strong></td><td>${badge(t.type, t.type === "Form" ? "primary" : t.type === "Checklist" ? "gold" : "muted")}</td> 
         <td>${(t.linkedWorkflows || []).map(id => lookupName(D.workflows, id)).join(", ") || "—"}</td> 
         <td>${roleName(t.owner)}</td><td>${statusBadge(t.status)}</td><td>${t.version || "—"}</td> 
     </tr>`).join("") : `<tr><td colspan="6">${emptyState("No templates match")}</td></tr>`; 
     setupClickableRows(el); 
     if (typeof lucide !== "undefined") lucide.createIcons(); 
 } 
 function renderTemplateDetail(el, id) { 
     const t = getById(D.templates, id); 
     if (!t) { el.innerHTML = emptyState("Template not found"); return; } 
     el.innerHTML = `<div class="page-content"> 
         ${breadcrumb([{ label: "Templates", hash: "templates" }, { label: t.name }])} 
         <div class="detail-header"> 
             <h1 class="detail-title">${t.name}</h1> 
             <div class="detail-badges">${badge(t.type, t.type === "Form" ? "primary" : t.type === "Checklist" ? "gold" : "muted")} ${statusBadge(t.status)} <span class="text-muted">v${t.version || "1.0"}</span></div> 
             <div class="detail-actions"><button class="btn btn--ghost btn--sm" id="btn-edit-tmpl"><i data-lucide="pencil" style="width:14px;height:14px"></i> Edit</button><button class="btn btn--ghost btn--sm btn--delete" id="btn-del-tmpl"><i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete</button></div> 
         </div> 
         <div class="detail-grid"> 
             <div class="detail-main"> 
                 <div class="card"><h3 class="card__title">Description</h3><p>${t.description}</p></div> 
                 <div class="card"><div class="meta-grid"> 
                     ${metaRow("Type", t.type)} 
                     ${metaRow("Owner", roleLink(t.owner))} 
                     ${metaRow("Audience", t.audience)} 
                     ${metaRow("Status", statusBadge(t.status))} 
                 </div></div> 
             </div> 
             <div class="detail-sidebar"> 
                 <div class="card"><h3 class="card__title">Linked Workflows</h3> 
                     ${(t.linkedWorkflows || []).length ? `<ul class="link-list">${t.linkedWorkflows.map(id => `<li>${wfLink(id)}</li>`).join("")}</ul>` : "<p class='text-muted'>None</p>"} 
                 </div> 
                 <div class="card"><h3 class="card__title">Linked Documents</h3> 
                     ${(t.linkedDocs || []).length ? `<ul class="link-list">${t.linkedDocs.map(id => `<li>${docLink(id)}</li>`).join("")}</ul>` : "<p class='text-muted'>None</p>"} 
                 </div> 
             </div> 
         </div> 
     </div>`; 
     const editTmplBtn = $("#btn-edit-tmpl", el); 
     if (editTmplBtn) editTmplBtn.addEventListener("click", () => window.CRUD.openTemplateForm(t)); 
     const delTmplBtn = $("#btn-del-tmpl", el); 
     if (delTmplBtn) delTmplBtn.addEventListener("click", () => window.CRUD.deleteTemplate(id)); 
 } 
 /* ── METRICS ────────────────────────────────────── */ 
 function renderMetrics(el) { 
     const rp = D.reportingPeriods[0]; 
     const groups = ["Demand & Throughput", "Timeliness", "Quality & Follow-Through", "Learning & Capacity", "Accountability & Progress"]; 
     let opsKPIs = ""; 
     groups.forEach(g => { 
         const kpis = D.kpis.filter(k => k.dashboardGroup === g); 
         if (!kpis.length) return; 
         opsKPIs += `<div class="kpi-group"><h3 class="kpi-group__title">${g}</h3><div class="kpi-grid">${kpis.map(k => { 
             const pct = k.target ? Math.round((k.currentValue / k.target) * 100) : null; 
             return `<div class="kpi-card"> 
                 <div class="kpi-card__header"><span class="kpi-card__name">${k.name}</span>${dataQualityBadge(k.dataQuality)}</div> 
                 <div class="kpi-card__value">${k.unit === "percentage" ? k.currentValue + "%" : k.currentValue}<span class="kpi-card__unit">${k.unit === "days" ? " days" : ""}</span></div> 
                 <div class="kpi-card__footer">${k.target ? `<span class="kpi-card__target">Target: ${k.unit === "percentage" ? k.target + "%" : k.target}</span>` : ""}${trendHTML(k.trend, k.currentValue, k.previousValue)}</div> 
                 ${pct !== null ? `<div class="kpi-card__progress"><div class="progress-bar"><div class="progress-bar__fill" style="width:${Math.min(pct, 100)}%;background:${pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-warning)" : "var(--color-error)"}"></div></div></div>` : ""} 
             </div>`; 
         }).join("")}</div></div>`; 
     }); 
     const kpiTable = `<table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Group</th><th>Current</th><th>Target</th><th>Trend</th><th>Data Quality</th><th>Owner</th><th></th></tr></thead><tbody>` + 
         D.kpis.map(k => `<tr><td class="text-muted">${k.id}</td><td>${k.name}</td><td>${badge(k.dashboardGroup, "muted")}</td><td><strong>${k.unit === "percentage" ? k.currentValue + "%" : k.currentValue}${k.unit === "days" ? " days" : ""}</strong></td><td>${k.target ? (k.unit === "percentage" ? k.target + "%" : k.target) : "—"}</td><td>${trendHTML(k.trend, k.currentValue, k.previousValue)}</td><td>${dataQualityBadge(k.dataQuality)}</td><td>${roleName(k.owner)}</td><td><button class="btn btn--ghost btn--sm kpi-edit-btn" data-kpi-id="${k.id}"><i data-lucide="pencil" style="width:12px;height:12px"></i></button></td></tr>`).join("") + 
         `</tbody></table>`; 
     const actionsTable = D.actions.length ? `<table class="data-table"><thead><tr><th>Action</th><th>Owner</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead><tbody>` + 
         D.actions.map(a => `<tr><td>${a.title}</td><td>${roleName(a.owner)}</td><td>${statusBadge(a.status)}</td><td>${priorityBadge(a.priority)}</td><td>${formatDate(a.dueDate)}</td></tr>`).join("") + 
         `</tbody></table>` : emptyState("No actions"); 
     const risksTable = D.risks.length ? `<table class="data-table"><thead><tr><th>Risk</th><th>Severity</th><th>Likelihood</th><th>Status</th><th>Owner</th></tr></thead><tbody>` + 
         D.risks.map(r => `<tr><td>${r.title}</td><td>${badge(r.severity)}</td><td>${badge(r.likelihood)}</td><td>${statusBadge(r.status)}</td><td>${roleName(r.owner)}</td></tr>`).join("") + 
         `</tbody></table>` : emptyState("No risks"); 
     el.innerHTML = `<div class="page-content"> 
         <div class="reporting-banner"> 
             <i data-lucide="calendar" style="width:16px;height:16px"></i> 
             <span>Reporting Period: <strong>${rp ? rp.name : "—"}</strong></span> 
             <span class="text-muted">${rp ? formatDate(rp.startDate) + " — " + formatDate(rp.endDate) : ""}</span> 
         </div> 
         <div class="tabs" id="metrics-tabs"> 
             <button class="tab active" data-tab="operations">Operations Dashboard</button> 
             <button class="tab" data-tab="leadership">Leadership Dashboard</button> 
         </div> 
         <div id="tab-operations" class="tab-content active"> 
             ${opsKPIs} 
             ${sectionTitle("Full KPI Table", "table")} 
             ${kpiTable} 
         </div> 
         <div id="tab-leadership" class="tab-content" style="display:none"> 
             ${sectionTitle("Leadership Summary", "crown")} 
             <div class="kpi-grid">${D.kpis.filter(k => ["KPI-001", "KPI-005", "KPI-007", "KPI-010", "KPI-011", "KPI-012"].includes(k.id)).map(k => 
                 `<div class="kpi-card"><div class="kpi-card__header"><span class="kpi-card__name">${k.name}</span></div><div class="kpi-card__value">${k.unit === "percentage" ? k.currentValue + "%" : k.currentValue}</div><div class="kpi-card__footer">${trendHTML(k.trend, k.currentValue, k.previousValue)}</div></div>` 
             ).join("")}</div> 
             ${sectionTitle("Actions", "check-circle-2")} 
             ${actionsTable} 
             ${sectionTitle("Risks", "alert-triangle")} 
             ${risksTable} 
         </div> 
     </div>`; 
     $$(".tab", el).forEach(tab => { 
         tab.addEventListener("click", () => { 
             $$(".tab", el).forEach(t => t.classList.remove("active")); 
             $$(".tab-content", el).forEach(c => { c.style.display = "none"; c.classList.remove("active"); }); 
             tab.classList.add("active"); 
             const panel = $(`#tab-${tab.dataset.tab}`, el); 
             if (panel) { panel.style.display = "block"; panel.classList.add("active"); } 
         }); 
     }); 
     $$(".kpi-edit-btn", el).forEach(btn => { 
         btn.addEventListener("click", (e) => { 
             e.stopPropagation(); 
             const kpi = getById(D.kpis, btn.dataset.kpiId); 
             if (kpi) window.CRUD.openKPIForm(kpi); 
         }); 
     }); 
 } 
 /* ── LEARNING ───────────────────────────────────── */ 
 function renderLearning(el) { 
     const types = [...new Set(D.learningAssets.map(l => l.type))].sort(); 
     const audiences = [...new Set(D.learningAssets.flatMap(l => l.audience || []))].sort(); 
     el.innerHTML = `<div class="page-content"> 
         <div class="page-actions"><button class="btn btn--primary" id="btn-add-la"><i data-lucide="plus" style="width:16px;height:16px"></i> Add Learning Asset</button></div> 
         ${sectionTitle("Learning Portal", "graduation-cap")} 
         <div class="filter-bar"> 
             <select id="f-type" class="filter-select"><option value="">All Types</option>${types.map(t => `<option>${t}</option>`).join("")}</select> 
             <select id="f-audience" class="filter-select"><option value="">All Audiences</option>${audiences.map(a => `<option>${a}</option>`).join("")}</select> 
             <select id="f-req" class="filter-select"><option value="">Required & Optional</option><option>Required</option><option>Optional</option></select> 
             <input type="search" id="f-search" class="filter-search" placeholder="Search learning assets…"> 
         </div> 
         <div class="card-grid" id="la-grid"></div> 
     </div>`; 
     filterLearning(el); 
     ["f-type", "f-audience", "f-req", "f-search"].forEach(id => { 
         const input = $(`#${id}`, el); 
         if (input) input.addEventListener(id === "f-search" ? "input" : "change", () => filterLearning(el)); 
     }); 
     const addLaBtn = $("#btn-add-la", el); 
     if (addLaBtn) addLaBtn.addEventListener("click", () => window.CRUD.openLearningForm()); 
 } 
 function filterLearning(el) { 
     const type = ($("#f-type", el) || {}).value || ""; 
     const aud = ($("#f-audience", el) || {}).value || ""; 
     const req = ($("#f-req", el) || {}).value || ""; 
     const q = ($("#f-search", el) || {}).value.toLowerCase(); 
     let assets = D.learningAssets; 
     if (type) assets = assets.filter(a => a.type === type); 
     if (aud) assets = assets.filter(a => (a.audience || []).includes(aud)); 
     if (req) assets = assets.filter(a => a.requiredOrOptional === req); 
     if (q) assets = assets.filter(a => (a.title + " " + a.description).toLowerCase().includes(q)); 
     const grid = $("#la-grid", el); 
     if (!grid) return; 
     grid.innerHTML = assets.length ? assets.map(a => `<div class="card card--clickable" data-href="#learning/${a.id}"> 
         <div class="card__header"> 
             <span class="card__title">${a.title}</span> 
             ${badge(a.type, a.type === "Microlearning" ? "primary" : a.type === "Job Aid" ? "gold" : "muted")} 
         </div> 
         <p class="card__desc">${a.description.slice(0, 100)}…</p> 
         <div class="card__meta"> 
             ${badge(a.requiredOrOptional)} 
             <span class="text-muted">${a.estimatedDuration || ""}</span> 
         </div> 
         <div class="card__footer">${(a.audience || []).map(au => `<span class="badge badge--muted">${au}</span>`).join(" ")}</div> 
     </div>`).join("") : emptyState("No learning assets match filters"); 
     setupClickableCards(el); 
     if (typeof lucide !== "undefined") lucide.createIcons(); 
 } 
 function renderLearningDetail(el, id) { 
     const a = getById(D.learningAssets, id); 
     if (!a) { el.innerHTML = emptyState("Learning asset not found"); return; } 
     el.innerHTML = `<div class="page-content"> 
         ${breadcrumb([{ label: "Learning Portal", hash: "learning" }, { label: a.title }])} 
         <div class="detail-header"> 
             <h1 class="detail-title">${a.title}</h1> 
             <div class="detail-badges">${badge(a.type, a.type === "Microlearning" ? "primary" : "gold")} ${badge(a.requiredOrOptional)} ${statusBadge(a.status)}</div> 
             <div class="detail-actions"><button class="btn btn--ghost btn--sm" id="btn-edit-la"><i data-lucide="pencil" style="width:14px;height:14px"></i> Edit</button><button class="btn btn--ghost btn--sm btn--delete" id="btn-del-la"><i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete</button></div> 
         </div> 
         <div class="detail-grid"> 
             <div class="detail-main"> 
                 <div class="card"><h3 class="card__title">Description</h3><p>${a.description}</p></div> 
                 <div class="card"><div class="meta-grid"> 
                     ${metaRow("Type", a.type)} 
                     ${metaRow("Duration", a.estimatedDuration)} 
                     ${metaRow("Required / Optional", badge(a.requiredOrOptional))} 
                     ${metaRow("Owner", roleLink(a.owner))} 
                     ${metaRow("Status", statusBadge(a.status))} 
                 </div></div> 
                 <div class="card"><h3 class="card__title">Audience</h3><div class="badge-group">${(a.audience || []).map(au => `<span class="badge badge--muted">${au}</span>`).join(" ")}</div></div> 
             </div> 
             <div class="detail-sidebar"> 
                 <div class="card"><h3 class="card__title">Source Documents</h3> 
                     ${(a.sourceDocs || []).length ? `<ul class="link-list">${a.sourceDocs.map(id => `<li>${docLink(id)}</li>`).join("")}</ul>` : "<p class='text-muted'>None</p>"} 
                 </div> 
                 <div class="card"><h3 class="card__title">Linked Workflows</h3> 
                     ${(a.linkedWorkflows || []).length ? `<ul class="link-list">${a.linkedWorkflows.map(id => `<li>${wfLink(id)}</li>`).join("")}</ul>` : "<p class='text-muted'>None</p>"} 
                 </div> 
                 <div class="card"><h3 class="card__title">Linked Templates</h3> 
                     ${(a.linkedTemplates || []).length ? `<ul class="link-list">${a.linkedTemplates.map(id => `<li>${tmpLink(id)}</li>`).join("")}</ul>` : "<p class='text-muted'>None</p>"} 
                 </div> 
             </div> 
         </div> 
     </div>`; 
     const editLaBtn = $("#btn-edit-la", el); 
     if (editLaBtn) editLaBtn.addEventListener("click", () => window.CRUD.openLearningForm(a)); 
     const delLaBtn = $("#btn-del-la", el); 
     if (delLaBtn) delLaBtn.addEventListener("click", () => window.CRUD.deleteLearningAsset(id)); 
 } 
 /* ── ASSISTANT ──────────────────────────────────── */ 
 function renderAssistant(el) { 
     el.innerHTML = `<div class="page-content assistant-page"> 
         ${sectionTitle("Equity Assistant", "message-circle")} 
         <p class="text-muted" style="margin-bottom:var(--space-4)">Grounded in the One DSD Equity Program knowledge base. Select a mode and ask a question.</p> 
         <div class="assistant-modes"> 
             <button class="assistant-mode active" data-mode="policy"><i data-lucide="shield" style="width:16px;height:16px"></i> Policy Lookup</button> 
     
      <button class="assistant-mode" data-mode="workflow"><i data-lucide="git-branch" style="width:16px;height:16px"></i> Workflow Guidance</button> 
             <button class="assistant-mode" data-mode="learning"><i data-lucide="graduation-cap" style="width:16px;height:16px"></i> Learning Recommendations</button> 
         </div> 
         <div class="assistant-questions" id="assistant-questions"></div> 
         <div class="assistant-chat" id="assistant-chat"></div> 
         <div class="assistant-input-area"> 
             <input type="text" id="assistant-input" class="assistant-input" placeholder="Ask about equity policies, workflows, or learning resources…"> 
             <button class="btn btn--primary" id="assistant-send"><i data-lucide="send" style="width:16px;height:16px"></i></button> 
         </div> 
     </div>`; 
     const questions = { 
         policy: [ 
             "What are the governing policy sources for equity work?", 
             "What is the authority hierarchy for documents?", 
             "What accessibility requirements apply to DSD?", 
       
    "What CLAS standards are relevant?" 
         ], 
         workflow: [ 
             "How do I start a consultation request?", 
             "What are the steps in an equity scan?", 
             "How does the quarterly review process work?", 
             "What templates do I need for an accessibility review?" 
         ], 
         learning: [ 
             "What educational resources are available for all staff?", 
             "What learning resources cover equity analysis?", 
             "What job aids are available?", 
             "What educational resources exist for accessibility?" 
         ] 
     }; 
     let currentMode = "policy"; 
     const questionsEl = $("#assistant-questions", el); 
     const chatEl = $("#assistant-chat", el); 
     function showQuestions() { 
         questionsEl.innerHTML = questions[currentMode].map(q => 
             `<button class="assistant-question-btn">${q}</button>` 
         ).join(""); 
         $$(".assistant-question-btn", el).forEach(btn => { 
             btn.addEventListener("click", () => handleQuery(btn.textContent)); 
         }); 
     } 
     $$(".assistant-mode", el).forEach(btn => { 
         btn.addEventListener("click", () => { 
             $$(".assistant-mode", el).forEach(b => b.classList.remove("active")); 
             btn.classList.add("active"); 
             currentMode = btn.dataset.mode; 
             showQuestions(); 
         }); 
     }); 
     const sendBtn = $("#assistant-send", el); 
     const inputEl = $("#assistant-input", el); 
     if (sendBtn) sendBtn.addEventListener("click", () => { if (inputEl.value.trim()) handleQuery(inputEl.value.trim()); }); 
     if (inputEl) inputEl.addEventListener("keydown", e => { if (e.key === "Enter" && inputEl.value.trim()) handleQuery(inputEl.value.trim()); }); 
     function handleQuery(query) { 
         inputEl.value = ""; 
         chatEl.innerHTML += `<div class="assistant-msg assistant-msg--user"><p>${query}</p></div>`; 
         const response = generateResponse(query, currentMode); 
         chatEl.innerHTML += `<div class="assistant-msg assistant-msg--assistant">${response}</div>`; 
         chatEl.scrollTop = chatEl.scrollHeight; 
         if (typeof lucide !== "undefined") lucide.createIcons(); 
     } 
     function generateResponse(query, mode) { 
         const q = query.toLowerCase(); 
         if (mode === "policy" || q.includes("policy") || q.includes("authority") || q.includes("governing") || q.includes("compliance") || q.includes("clas") || q.includes("accessibility") || q.includes("ada")) { 
             let docs = D.documents; 
             if (q.includes("accessibility") || q.includes("ada")) docs = docs.filter(d => d.title.toLowerCase().includes("accessibility") || d.title.toLowerCase().includes("ada") || d.batch === "Accessibility and Language Access"); 
             else if (q.includes("clas")) docs = docs.filter(d => d.title.toLowerCase().includes("clas") || d.equityMethod === "CLAS Implementation"); 
             else if (q.includes("authority") || q.includes("hierarchy")) docs = docs.sort((a, b) => a.authorityRank - b.authorityRank); 
             else if (q.includes("governing")) docs = docs.filter(d => d.batch === "Governing Authority"); 
             else docs = docs.filter(d => d.authorityRank <= 3); 
             docs = docs.sort((a, b) => a.authorityRank - b.authorityRank).slice(0, 8); 
             return `<div class="assistant-section"><h4><i data-lucide="shield" style="width:16px;height:16px"></i> Source Authority</h4> 
                 <p>Based on the program's authority hierarchy, here are the relevant sources (ranked by authority):</p> 
                 <div class="assistant-sources">${docs.map(d => `<div class="assistant-source-item"> 
                     <div class="assistant-source-header">${authorityBadge(d.authorityRank)} ${docLink(d.id)}</div> 
                     <p class="text-muted">${d.purpose}</p> 
                     <div>${batchBadge(d.batch)} ${badge(d.sourceType, d.sourceType === "Public" ? "primary" : "gold")} ${d.sourceOfTruth ? '<span class="badge badge--success">Source of Truth</span>' : ""}</div> 
                 </div>`).join("")}</div> 
                 <p class="assistant-note"><i data-lucide="info" style="width:14px;height:14px"></i> Documents are ranked by authority level. Law and federal guidance (ranks 1-2) take precedence over division and program-level guidance.</p> 
             </div>`; 
         } 
         if (mode === "workflow" || q.includes("workflow") || q.includes("consultation") || q.includes("scan") || q.includes("review") || q.includes("quarterly") || q.includes("template") || q.includes("how do i")) { 
             let wf; 
             if (q.includes("consultation") || q.includes("intake") || q.includes("request")) wf = getById(D.workflows, "WF-001"); 
             else if (q.includes("scan")) wf = getById(D.workflows, "WF-002"); 
         
  else if (q.includes("full") || q.includes("analysis")) wf = getById(D.workflows, "WF-003"); 
             else if (q.includes("accessibility")) wf = getById(D.workflows, "WF-004"); 
             else if (q.includes("community") || q.includes("engagement")) wf = getById(D.workflows, "WF-005"); 
             else if (q.includes("learning") || q.includes("educational")) wf = getById(D.workflows, "WF-006"); 
             else if (q.includes("quarterly") || q.includes("review")) wf = getById(D.workflows, "WF-007"); 
             else wf = D.workflows[0]; 
             const stages = wf.stages.sort((a, b) => a.order - b.order); 
             const temps = (wf.outputTemplates || []).map(id => getById(D.templates, id)).filter(Boolean); 
             return `<div class="assistant-section"><h4><i data-lucide="git-branch" style="width:16px;height:16px"></i> Workflow: ${wf.name}</h4> 
                 <p>${wf.description}</p> 
                 <div class="assistant-stages"><strong>Stages:</strong><ol>${stages.map(s => `<li>${s.name}</li>`).join("")}</ol></div> 
                 ${temps.length ? `<div><strong>Templates needed:</strong><ul class="link-list">${temps.map(t => `<li>${tmpLink(t.id)}</li>`).join("")}</ul></div>` : ""} 
                 ${(wf.requiredDocs || []).length ? `<div><strong>Required documents:</strong><ul class="link-list">${wf.requiredDocs.map(id => `<li>${docLink(id)}</li>`).join("")}</ul></div>` : ""} 
                 <p><strong>Owner:</strong> ${roleLink(wf.owner)}</p> 
                 <p class="assistant-note"><i data-lucide="info" style="width:14px;height:14px"></i> ${wfLink(wf.id)} for full details.</p> 
             </div>`; 
         } 
         if (mode === "learning" || q.includes("educational") || q.includes("learning") || q.includes("course") || q.includes("job aid")) { 
             let assets = D.learningAssets; 
             if (q.includes("required") || q.includes("all staff")) assets = assets.filter(a => a.requiredOrOptional === "Required"); 
             else if (q.includes("equity analysis")) assets = assets.filter(a => a.title.toLowerCase().includes("equity") || a.description.toLowerCase().includes("equity analysis")); 
             else if (q.includes("accessibility")) assets = assets.filter(a => a.title.toLowerCase().includes("accessibility") || a.description.toLowerCase().includes("accessibility")); 
             else if (q.includes("job aid")) assets = assets.filter(a => a.type === "Job Aid"); 
             if (!assets.length) assets = D.learningAssets.slice(0, 5); 
             return `<div class="assistant-section"><h4><i data-lucide="graduation-cap" style="width:16px;height:16px"></i> Learning Resources</h4> 
                 <div class="assistant-sources">${assets.map(a => `<div class="assistant-source-item"> 
                     <div class="assistant-source-header">${badge(a.type, a.type === "Microlearning" ? "primary" : "gold")} ${laLink(a.id)}</div> 
                     <p class="text-muted">${a.description.slice(0, 100)}…</p> 
                     <div>${badge(a.requiredOrOptional)} <span class="text-muted">${a.estimatedDuration || ""}</span> ${(a.audience || []).slice(0, 2).map(au => `<span class="badge badge--muted">${au}</span>`).join(" ")}</div> 
   
            </div>`).join("")}</div> 
                 ${assets.some(a => (a.sourceDocs || []).length) ? `<p class="assistant-note"><i data-lucide="info" style="width:14px;height:14px"></i> These learning assets are grounded in source documents from the Knowledge Base. Authority-ranked sources take precedence.</p>` : ""} 
             </div>`; 
         } 
         return `<p>I can help you find policies, navigate workflows, and discover learning resources. Try selecting a mode above and asking a more specific question about equity analysis, accessibility, consultation processes, or staff educational resources.</p>`; 
     } 
     showQuestions(); 
 } 
 /* ── ROLES ──────────────────────────────────────── */ 
 function renderRoles(el) { 
     el.innerHTML = `<div class="page-content"> 
         <div class="page-actions"><button class="btn btn--primary" id="btn-add-role"><i data-lucide="plus" style="width:16px;height:16px"></i> Add Role</button></div> 
         ${sectionTitle("Roles & Governance", "users")} 
         <table class="data-table"><thead><tr><th>Role</th><th>Type</th><th>Purpose</th><th>Active</th></tr></thead><tbody> 
             ${D.roles.map(r => `<tr class="clickable-row" data-href="#roles/${r.id}"> 
                 <td><strong>${r.name}</strong></td><td>${badge(r.type)}</td><td>${r.purpose.slice(0, 80)}…</td><td>${r.active ? '<i data-lucide="check" style="width:16px;height:16px;color:var(--color-success)"></i>' : "—"}</td> 
             </tr>`).join("")} 
         </tbody></table> 
     </div>`; 
     setupClickableRows(el); 
     const addRoleBtn = $("#btn-add-role", el); 
     if (addRoleBtn) addRoleBtn.addEventListener("click", () => window.CRUD.openRoleForm()); 
 } 
 function renderRoleDetail(el, id) { 
     const r = getById(D.roles, id); 
     if (!r) { el.innerHTML = emptyState("Role not found"); return; } 
     const ownedDocs = D.documents.filter(d => d.owner === id); 
     const ownedWfs = D.workflows.filter(w => w.owner === id); 
     const ownedKpis = D.kpis.filter(k => k.owner === id); 
     const ownedTmps = D.templates.filter(t => t.owner === id); 
     const ownedLAs = D.learningAssets.filter(a => a.owner === id); 
     el.innerHTML = `<div class="page-content"> 
         ${breadcrumb([{ label: "Roles", hash: "roles" }, { label: r.name }])} 
         <div class="detail-header"> 
             <h1 class="detail-title">${r.name}</h1> 
             <div class="detail-badges">${badge(r.type)} ${r.active ? badge("Active", "success") : badge("Inactive", "muted")}</div> 
             <div class="detail-actions"><button class="btn btn--ghost btn--sm" id="btn-edit-role"><i data-lucide="pencil" style="width:14px;height:14px"></i> Edit</button><button class="btn btn--ghost btn--sm btn--delete" id="btn-del-role"><i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete</button></div> 
         </div> 
         <div class="detail-grid"> 
             <div class="detail-main"> 
                 <div class="card"><h3 class="card__title">Purpose</h3><p>${r.purpose}</p></div> 
                 <div class="card"><h3 class="card__title">Responsibilities</h3><ul>${(r.responsibilities || []).map(s => `<li>${s}</li>`).join("")}</ul></div> 
                 <div class="card"><h3 class="card__title">Decision Authority</h3><ul>${(r.decisionAuthority || []).map(s => `<li>${s}</li>`).join("")}</ul></div> 
                 ${(r.reviewScope || []).length ? `<div class="card"><h3 class="card__title">Review Scope</h3><ul>${r.reviewScope.map(s => `<li>${s}</li>`).join("")}</ul></div>` : ""} 
             </div> 
             <div class="detail-sidebar"> 
                 ${ownedDocs.length ? `<div class="card"><h3 class="card__title">Owned Documents (${ownedDocs.length})</h3><ul class="link-list">${ownedDocs.map(d => `<li>${docLink(d.id)}</li>`).join("")}</ul></div>` : ""} 
                 ${ownedWfs.length ? `<div class="card"><h3 class="card__title">Owned Workflows (${ownedWfs.length})</h3><ul class="link-list">${ownedWfs.map(w => `<li>${wfLink(w.id)}</li>`).join("")}</ul></div>` : ""} 
                 ${ownedKpis.length ? `<div class="card"><h3 class="card__title">Owned KPIs (${ownedKpis.length})</h3><ul class="link-list">${ownedKpis.map(k => `<li>${kpiLink(k.id)}</li>`).join("")}</ul></div>` : ""} 
                 ${ownedTmps.length ? `<div class="card"><h3 class="card__title">Owned Templates (${ownedTmps.length})</h3><ul class="link-list">${ownedTmps.map(t => `<li>${tmpLink(t.id)}</li>`).join("")}</ul></div>` : ""} 
                 ${ownedLAs.length ? `<div class="card"><h3 class="card__title">Owned Learning Assets (${ownedLAs.length})</h3><ul class="link-list">${ownedLAs.map(a => `<li>${laLink(a.id)}</li>`).join("")}</ul></div>` : ""} 
             </div> 
         </div> 
     </div>`; 
     const editRoleBtn = $("#btn-edit-role", el); 
     if (editRoleBtn) editRoleBtn.addEventListener("click", () => window.CRUD.openRoleForm(r)); 
     const delRoleBtn = $("#btn-del-role", el); 
     if (delRoleBtn) delRoleBtn.addEventListener("click", () => window.CRUD.deleteRole(id)); 
 } 
 /* ── ACTIONS ────────────────────────────────────── */ 
 function renderActions(el) { 
     el.innerHTML = `<div class="page-content"> 
         <div class="page-actions"><button class="btn btn--primary" id="btn-add-action"><i data-lucide="plus" style="width:16px;height:16px"></i> Add Action</button></div> 
         ${sectionTitle("Program Actions", "check-circle-2")} 
         <div class="filter-bar"> 
             <select id="f-status" class="filter-select"><option value="">All Statuses</option><option>On Track</option><option>At Risk</option><option>Overdue</option><option>Completed</option></select> 
             <select id="f-priority" class="filter-select"><option value="">All Priorities</option><option>High</option><option>Medium</option><option>Low</option></select> 
         </div> 
         <table class="data-table"><thead><tr><th>Action</th><th>Owner</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Linked KPIs</th><th>Linked Workflows</th><th></th></tr></thead><tbody id="act-tbody"></tbody></table> 
     </div>`; 
     filterActions(el); 
     ["f-status", "f-priority"].forEach(id => { 
         const input = $(`#${id}`, el); 
         if (input) input.addEventListener("change", () => filterActions(el)); 
     }); 
     const addActionBtn = $("#btn-add-action", el); 
     if (addActionBtn) addActionBtn.addEventListener("click", () => window.CRUD.openActionForm()); 
 } 
 function filterActions(el) { 
     const status = ($("#f-status", el) || {}).value || ""; 
     const priority = ($("#f-priority", el) || {}).value || ""; 
     let items = D.actions; 
     if (status) items = items.filter(a => a.status === status); 
     if (priority) items = items.filter(a => a.priority === priority); 
     const tbody = $("#act-tbody", el); 
     if (!tbody) return; 
     tbody.innerHTML = items.length ? items.map(a => `<tr> 
         <td><strong>${a.title}</strong><br><span class="text-muted">${a.description.slice(0, 60)}…</span></td> 
         <td>${roleName(a.owner)}</td><td>${statusBadge(a.status)}</td><td>${priorityBadge(a.priority)}</td> 
         <td>${formatDate(a.dueDate)}</td> 
         <td>${(a.linkedKPIs || []).map(id => kpiLink(id)).join(", ") || "—"}</td> 
         <td>${(a.linkedWorkflows || []).map(id => wfLink(id)).join(", ") || "—"}</td> 
         <td><div class="row-actions"><button class="btn btn--icon action-edit" data-id="${a.id}" title="Edit"><i data-lucide="pencil" style="width:14px;height:14px"></i></button><button class="btn btn--icon btn--delete action-del" data-id="${a.id}" title="Delete"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button></div></td> 
     </tr>`).join("") : `<tr><td colspan="8">${emptyState("No actions match filters")}</td></tr>`; 
     $$(".action-edit", el).forEach(btn => btn.addEventListener("click", () => { const act = D.actions.find(a => a.id === btn.dataset.id); if (act) window.CRUD.openActionForm(act); })); 
     $$(".action-del", el).forEach(btn => btn.addEventListener("click", () => window.CRUD.deleteAction(btn.dataset.id))); 
     if (typeof lucide !== "undefined") lucide.createIcons(); 
 } 
 /* ── RISKS ──────────────────────────────────────── */ 
 function renderRisks(el) { 
     el.innerHTML = `<div class="page-content"> 
         <div class="page-actions"><button class="btn btn--primary" id="btn-add-risk"><i data-lucide="plus" style="width:16px;height:16px"></i> Add Risk</button></div> 
         ${sectionTitle("Risk Registry", "alert-triangle")} 
         <div class="filter-bar"> 
             <select id="f-severity" class="filter-select"><option value="">All Severities</option><option>High</option><option>Medium</option><option>Low</option></select> 
             <select id="f-status" class="filter-select"><option value="">All Statuses</option><option>Active</option><option>Monitoring</option><option>Mitigated</option><option>Closed</option></select> 
         </div> 
         <div class="card-grid card-grid--2" id="risk-grid"></div> 
     </div>`; 
     filterRisks(el); 
     ["f-severity", "f-status"].forEach(id => { 
         const input = $(`#${id}`, el); 
         if (input) input.addEventListener("change", () => filterRisks(el)); 
     }); 
     const addRiskBtn = $("#btn-add-risk", el); 
     if (addRiskBtn) addRiskBtn.addEventListener("click", () => window.CRUD.openRiskForm()); 
 } 
 function filterRisks(el) { 
     const severity = ($("#f-severity", el) || {}).value || ""; 
     const status = ($("#f-status", el) || {}).value || ""; 
     let items = D.risks; 
     if (severity) items = items.filter(r => r.severity === severity); 
     if (status) items = items.filter(r => r.status === status); 
     const grid = $("#risk-grid", el); 
     if (!grid) return; 
     grid.innerHTML = items.length ? items.map(r => `<div class="card"> 
         <div class="card__header"><span class="card__title">${r.title}</span>${statusBadge(r.status)} 
             <div class="row-actions" style="margin-left:auto"><button class="btn btn--icon risk-edit" data-id="${r.id}" title="Edit"><i data-lucide="pencil" style="width:14px;height:14px"></i></button><button class="btn btn--icon btn--delete risk-del" data-id="${r.id}" title="Delete"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button></div> 
         </div> 
         <p class="card__desc">${r.description}</p> 
         <div class="meta-grid" style="margin-top:var(--space-3)"> 
             ${metaRow("Severity", badge(r.severity))} 
             ${metaRow("Likelihood", badge(r.likelihood))} 
             ${metaRow("Owner", roleName(r.owner))} 
   
    </div> 
         <div class="card" style="margin-top:var(--space-3);background:var(--color-surface-offset);padding:var(--space-3)"> 
             <h4 style="margin-bottom:var(--space-2);font-size:var(--text-sm)">Mitigation Plan</h4> 
             <p>${r.mitigationPlan}</p> 
         </div> 
         <div class="card__footer" style="margin-top:var(--space-3)"> 
             ${(r.linkedKPIs || []).map(id => kpiLink(id)).join(" ")} 
             ${(r.linkedWorkflows || []).map(id => wfLink(id)).join(" ")} 
         </div> 
     </div>`).join("") : emptyState("No risks match filters"); 
     $$(".risk-edit", el).forEach(btn => btn.addEventListener("click", () => { const risk = D.risks.find(r => r.id === btn.dataset.id); if (risk) window.CRUD.openRiskForm(risk); })); 
     $$(".risk-del", el).forEach(btn => btn.addEventListener("click", () => window.CRUD.deleteRisk(btn.dataset.id))); 
     if (typeof lucide !== "undefined") lucide.createIcons(); 
 } 
 /* ── Global: Clickable rows/cards ───────────────── */ 
 function setupClickableRows(container) { 
     $$(".clickable-row", container).forEach(row => { 
         row.addEventListener("click", () => { if (row.dataset.href) location.hash = row.dataset.href; }); 
         row.style.cursor = "pointer"; 
     }); 
 } 
 function setupClickableCards(container) { 
     $$(".card--clickable", container).forEach(card => { 
         card.addEventListener("click", () => { if (card.dataset.href) location.hash = card.dataset.href; }); 
         card.style.cursor = "pointer"; 
     }); 
 } 
 /* ── Global Search ──────────────────────────────── */ 
 function setupGlobalSearch() { 
     const input = $(".header__search-input"); 
     if (!input) return; 
     let dropdown = document.createElement("div"); 
     dropdown.className = "search-dropdown"; 
     dropdown.style.display = "none"; 
     input.parentElement.style.position = "relative"; 
     input.parentElement.appendChild(dropdown); 
     input.addEventListener("input", () => { 
         const q = input.value.toLowerCase().trim(); 
         if (!q || q.length < 2) { dropdown.style.display = "none"; return; } 
         const results = []; 
         D.documents.forEach(d => { if ((d.title + d.shortTitle).toLowerCase().includes(q)) results.push({ label: d.title, type: "Document", hash: `knowledge-base/${d.id}` }); }); 
         D.workflows.forEach(w => { if (w.name.toLowerCase().includes(q)) results.push({ label: w.name, type: "Workflow", hash: `workflows/${w.id}` }); }); 
         D.templates.forEach(t => { if (t.name.toLowerCase().includes(q)) results.push({ label: t.name, type: "Template", hash: `templates/${t.id}` }); }); 
         D.kpis.forEach(k => { if (k.name.toLowerCase().includes(q)) results.push({ label: k.name, type: "KPI", hash: "metrics" }); }); 
         D.learningAssets.forEach(a => { if (a.title.toLowerCase().includes(q)) results.push({ label: a.title, type: "Learning", hash: `learning/${a.id}` }); }); 
         D.roles.forEach(r => { if (r.name.toLowerCase().includes(q)) results.push({ label: r.name, type: "Role", hash: `roles/${r.id}` }); }); 
         if (results.length) { 
             dropdown.innerHTML = results.slice(0, 10).map(r => 
 
              `<a class="search-result" href="#${r.hash}"><span class="search-result__label">${r.label}</span><span class="badge badge--muted">${r.type}</span></a>` 
             ).join(""); 
             dropdown.style.display = "block"; 
             $$(".search-result", dropdown).forEach(link => { 
                 link.addEventListener("click", () => { dropdown.style.display = "none"; input.value = ""; }); 
             }); 
         } else { 
             dropdown.innerHTML = `<div class="search-result search-result--empty">No results for "${q}"</div>`; 
             dropdown.style.display = "block"; 
         } 
     }); 
     input.addEventListener("blur", () => { setTimeout(() => { dropdown.style.display = "none"; }, 200); }); 
 } 
 /* ── Dark Mode Toggle ───────────────────────────── */ 
 function setupDarkMode() { 
     const toggle = $("[data-theme-toggle]"); 
     if (!toggle) return; 
     const html = document.documentElement; 
     let mode = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; 
     html.setAttribute("data-theme", mode); 
     updateThemeIcon(toggle, mode); 
     toggle.addEventListener("click", () => { 
         mode = mode === "dark" ? "light" : "dark"; 
         html.setAttribute("data-theme", mode); 
         updateThemeIcon(toggle, mode); 
     }); 
 } 
 function updateThemeIcon(btn, mode) { 
     const iconSpan = btn.querySelector(".theme-icon") || btn; 
     iconSpan.innerHTML = mode === "dark" 
         ? '<i data-lucide="sun" style="width:20px;height:20px"></i>' 
         : '<i data-lucide="moon" style="width:20px;height:20px"></i>'; 
     btn.setAttribute("aria-label", `Switch to ${mode === "dark" ? "light" : "dark"} mode`); 
     if (typeof lucide !== "undefined") lucide.createIcons(); 
 } 
 /* ── Mobile Menu ────────────────────────────────── */ 
 function setupMobileMenu() { 
     const hamburger = $("#hamburger"); 
     const sidebar = $("#sidebar"); 
     const overlay = $("#sidebar-overlay"); 
     if (!hamburger || !sidebar) return; 
     hamburger.addEventListener("click", () => { 
         const open = sidebar.classList.toggle("sidebar--open"); 
         if (overlay) overlay.classList.toggle("sidebar-overlay--visible", open); 
         hamburger.setAttribute("aria-expanded", open); 
     }); 
     if (overlay) overlay.addEventListener("click", () => { 
         sidebar.classList.remove("sidebar--open"); 
         overlay.classList.remove("sidebar-overlay--visible"); 
         hamburger.setAttribute("aria-expanded", "false"); 
     }); 
 } 
 /* ── Sidebar Nav ────────────────────────────────── */ 
 function setupSidebar() { 
     $$(".nav-item").forEach(btn => { 
         btn.addEventListener("click", () => { 
             location.hash = btn.dataset.page; 
         }); 
     }); 
 } 
 /* ── Header icons ───────────────────────────────── */ 
 function renderHeaderIcons() { 
     const searchIcon = $(".header__search-icon"); 
     if (searchIcon) searchIcon.innerHTML = '<i data-lucide="search" style="width:16px;height:16px"></i>'; 
     const notifIcon = $(".notification-icon"); 
     if (notifIcon) notifIcon.innerHTML = '<i data-lucide="bell" style="width:20px;height:20px"></i>'; 
     const hamburger = $(".hamburger__icon"); 
     if (hamburger) hamburger.innerHTML = '<i data-lucide="menu" style="width:20px;height:20px"></i>'; 
 } 
 /* ── Init ───────────────────────────────────────── */ 
 document.addEventListener("DOMContentLoaded", () => {
     setupDarkMode();
     if (window.AUTH) {
       window.AUTH.init().then(() => {
         window.addEventListener("auth:ready", () => {
           setupMobileMenu();
           setupSidebar();
           setupGlobalSearch();
           renderHeaderIcons();
           window.addEventListener("hashchange", route);
           route();
         });
       });
     } else {
       setupMobileMenu();
       setupSidebar();
       setupGlobalSearch();
       renderHeaderIcons();
       window.addEventListener("hashchange", route);
       route();
     }
 }); })();