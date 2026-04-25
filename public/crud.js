/* ============================================================ 
   One DSD Equity Program — CRUD Module 
   Add/Edit/Delete functionality for all entities 
   ============================================================ */ (function () { 
 "use strict"; 
 const D = window.APP_DATA; 
 const $ = (s, c) => (c || document).querySelector(s); 
 const $$ = (s, c) => [...(c || document).querySelectorAll(s)]; 
 /* ── ID Generation ──────────────────────────────── */ 
 function nextId(prefix, arr) { 
     const nums = arr.map(i => parseInt(i.id.replace(/\D/g, ""), 10) || 0); 
     const max = nums.length ? Math.max(...nums) : 0; 
     return `${prefix}-${String(max + 1).padStart(3, "0")}`; 
 } 
 /* ── Modal System ───────────────────────────────── */ 
 function createModal() { 
     let overlay = document.getElementById("crud-modal-overlay"); 
     if (overlay) return overlay; 
     overlay = document.createElement("div"); 
     overlay.id = "crud-modal-overlay"; 
     overlay.className = "modal-overlay"; 
     overlay.innerHTML = `<div class="modal" id="crud-modal"> 
         <div class="modal__header"> 
             <h2 class="modal__title" id="modal-title"></h2> 
             <button class="modal__close" id="modal-close" aria-label="Close modal"><i data-lucide="x" style="width:20px;height:20px"></i></button> 
         </div> 
         <div class="modal__body" id="modal-body"></div> 
         <div class="modal__footer" id="modal-footer"></div> 
     </div>`; 
     document.body.appendChild(overlay); 
     overlay.addEventListener("click", (e) => { 
         if (e.target === overlay) closeModal(); 
     }); 
     document.getElementById("modal-close").addEventListener("click", closeModal); 
     document.addEventListener("keydown", (e) => { 
         if (e.key === "Escape") closeModal(); 
     }); 
     return overlay; 
 } 
 function openModal(title, bodyHTML, footerHTML) { 
     const overlay = createModal(); 
     document.getElementById("modal-title").textContent = title; 
     document.getElementById("modal-body").innerHTML = bodyHTML; 
     document.getElementById("modal-footer").innerHTML = footerHTML; 
     overlay.classList.add("modal-overlay--visible"); 
     document.body.style.overflow = "hidden"; 
     if (typeof lucide !== "undefined") lucide.createIcons(); 
     // Focus first input 
     const firstInput = overlay.querySelector("input, select, textarea"); 
     if (firstInput) setTimeout(() => firstInput.focus(), 100); 
 } 
 function closeModal() { 
     const overlay = document.getElementById("crud-modal-overlay"); 
     if (overlay) { 
         overlay.classList.remove("modal-overlay--visible"); 
         document.body.style.overflow = ""; 
     } 
 } 
 /* ── Form Field Builders ────────────────────────── */ 
 function field(label, name, type, value, opts) { 
     const o = opts || {}; 
     const req = o.required ? "required" : ""; 
     const id = `field-${name}`; 
     let input; 
     if (type === "select") { 
         input = `<select id="${id}" name="${name}" class="form-input" ${req}> 
             ${o.placeholder ? `<option value="">${o.placeholder}</option>` : ""} 
             ${(o.options || []).map(op => `<option value="${op.value || op}" ${(value || "") === (op.value || op) ? "selected" : ""}>${op.label || op}</option>`).join("")} 
         </select>`; 
     } else if (type === "textarea") { 
         input = `<textarea id="${id}" name="${name}" class="form-input form-textarea" rows="${o.rows || 3}" ${req} placeholder="${o.placeholder || ""}">${value || ""}</textarea>`; 
     } else if (type === "date") { 
         input = `<input type="date" id="${id}" name="${name}" class="form-input" value="${value || ""}" ${req}>`; 
     } else if (type === "number") { 
         input = `<input type="number" id="${id}" name="${name}" class="form-input" value="${value || ""}" ${req} step="${o.step || "any"}" min="${o.min != null ? o.min : ""}" max="${o.max != null ? o.max : ""}">`; 
     } else if (type === "checkbox") { 
         input = `<label class="form-checkbox"><input type="checkbox" id="${id}" name="${name}" ${value ? "checked" : ""}> ${o.checkLabel || ""}</label>`; 
     } else { 
         input = `<input type="text" id="${id}" name="${name}" class="form-input" value="${escapeAttr(value || "")}" ${req} placeholder="${o.placeholder || ""}">`; 
     } 
     return `<div class="form-group"><label class="form-label" for="${id}">${label}${o.required ? ' <span class="form-required">*</span>' : ""}</label>${input}</div>`; 
 } 
 function escapeAttr(s) { return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;"); } 
 function getFormData(names) { 
     const data = {}; 
     names.forEach(name => { 
         const el = document.getElementById(`field-${name}`); 
         if (!el) return; 
         if (el.type === "checkbox") data[name] = el.checked; 
         else if (el.type === "number") data[name] = el.value ? parseFloat(el.value) : null; 
         else data[name] = el.value; 
     }); 
     return data; 
 } 
 function confirmDelete(entityType, entityName, callback) { 
     openModal( 
         `Delete ${entityType}`, 
         `<div class="delete-confirm"> 
             <i data-lucide="alert-triangle" style="width:48px;height:48px;color:var(--color-error);margin-bottom:var(--space-3)"></i> 
             <p>Are you sure you want to delete <strong>${entityName}</strong>?</p> 
         
  <p class="text-muted">This action cannot be undone.</p> 
         </div>`, 
         `<button class="btn btn--ghost" id="btn-cancel">Cancel</button> 
           <button class="btn btn--danger" id="btn-confirm-delete">Delete</button>` 
     ); 
     document.getElementById("btn-cancel").addEventListener("click", closeModal); 
     document.getElementById("btn-confirm-delete").addEventListener("click", () => { 
         callback(); 
         closeModal(); 
     }); 
 } 
 /* ── Role Options (reused across forms) ─────────── */ 
 function roleOptions() { 
     return D.roles.map(r => ({ value: r.id, label: r.name })); 
 } 
 function workflowOptions() { 
     return D.workflows.map(w => ({ value: w.id, label: w.name })); 
 } 
 function kpiOptions() { 
     return D.kpis.map(k => ({ value: k.id, label: `${k.id}: ${k.name}` })); 
 } 
 /* ── Toast Notification ─────────────────────────── */ 
 function showToast(message, type) { 
     const t = type || "success"; 
     let container = document.getElementById("toast-container"); 
     if (!container) { 
 
      container = document.createElement("div"); 
         container.id = "toast-container"; 
         container.className = "toast-container"; 
         document.body.appendChild(container); 
     } 
     const toast = document.createElement("div"); 
     toast.className = `toast toast--${t}`; 
     toast.innerHTML = `<i data-lucide="${t === "success" ? "check-circle-2" : t === "error" ? "x-circle" : "info"}" style="width:16px;height:16px"></i><span>${message}</span>`; 
     container.appendChild(toast); 
     if (typeof lucide !== "undefined") lucide.createIcons(); 
     setTimeout(() => { toast.classList.add("toast--exit"); setTimeout(() => toast.remove(), 300); }, 3000); 
 } 
 /* ============================================================ 
       ACTIONS CRUD 
       ============================================================ */ 
 function openActionForm(action) { 
     const isEdit = !!action; 
     const a = action || {}; 
     const body = `<form id="action-form" class="modal-form"> 
         ${field("Title", "title", "text", a.title, { required: true, placeholder: "Action title" })} 
         ${field("Description", "description", "textarea", a.description, { required: true, rows: 3 })} 
         ${field("Owner", "owner", "select", a.owner, { required: true, placeholder: "Select owner", options: roleOptions() })} 
         ${field("Status", "status", "select", a.status || "On Track", { required: true, options: ["On Track", "At Risk", "Overdue", "Completed"] })} 
         ${field("Priority", "priority", "select", a.priority || "Medium", { required: true, options: ["High", "Medium", "Low"] })} 
         ${field("Due Date", "dueDate", "date", a.dueDate, { required: true })} 
     </form>`; 
     openModal( 
         isEdit ? "Edit Action" : "Add Action", 
         body, 
         `<button class="btn btn--ghost" id="btn-cancel">Cancel</button> 
           <button class="btn btn--primary" id="btn-save">${isEdit ? "Save Changes" : "Add Action"}</button>` 
     ); 
     document.getElementById("btn-cancel").addEventListener("click", closeModal); 
     document.getElementById("btn-save").addEventListener("click", () => { 
         const form = document.getElementById("action-form"); 
         if (!form.checkValidity()) { form.reportValidity(); return; } 
         const data = getFormData(["title", "description", "owner", "status", "priority", "dueDate"]); 
         if (isEdit) { 
             Object.assign(action, data); 
             showToast("Action updated successfully"); 
         } else { 
             data.id = nextId("ACT", D.actions); 
             data.linkedKPIs = []; 
             data.linkedWorkflows = []; 
             D.actions.push(data); 
 
          showToast("Action added successfully"); 
         } 
         closeModal(); 
         window.dispatchEvent(new HashChangeEvent("hashchange")); 
     }); 
 } 
 function deleteAction(id) { 
     const idx = D.actions.findIndex(a => a.id === id); 
     if (idx >= 0) { 
         const name = D.actions[idx].title; 
         confirmDelete("Action", name, () => { 
             D.actions.splice(idx, 1); 
             showToast("Action deleted"); 
             window.dispatchEvent(new HashChangeEvent("hashchange")); 
         }); 
     } 
 } 
 /* ============================================================ 
       RISKS CRUD 
       ============================================================ */ 
 function openRiskForm(risk) { 
     const isEdit = !!risk; 
     const r = risk || {}; 
     const body = `<form id="risk-form" class="modal-form"> 
         ${field("Title", "title", "text", r.title, { required: true, placeholder: "Risk title" })} 
         ${field("Description", "description", "textarea", r.description, { required: true, rows: 3 })} 
         ${field("Severity", "severity", "select", r.severity || "Medium", { required: true, options: ["High", "Medium", "Low"] })} 
         ${field("Likelihood", "likelihood", "select", r.likelihood || "Medium", { required: true, options: ["High", "Medium", "Low"] })} 
         ${field("Status", "status", "select", r.status || "Active", { required: true, options: ["Active", "Monitoring", "Mitigated", "Closed"] })} 
         ${field("Owner", "owner", "select", r.owner, { required: true, placeholder: "Select owner", options: roleOptions() })} 
         ${field("Mitigation Plan", "mitigationPlan", "textarea", r.mitigationPlan, { required: true, rows: 4 })} 
     </form>`; 
     openModal( 
         isEdit ? "Edit Risk" : "Add Risk", 
         body, 
         `<button class="btn btn--ghost" id="btn-cancel">Cancel</button> 
           <button class="btn btn--primary" id="btn-save">${isEdit ? "Save Changes" : "Add Risk"}</button>` 
     ); 
     document.getElementById("btn-cancel").addEventListener("click", closeModal); 
     document.getElementById("btn-save").addEventListener("click", () => { 
         const form = document.getElementById("risk-form"); 
         if (!form.checkValidity()) { form.reportValidity(); return; } 
         const data = getFormData(["title", "description", "severity", "likelihood", "status", "owner", "mitigationPlan"]); 
         if (isEdit) { 
             Object.assign(risk, data); 
             showToast("Risk updated successfully"); 
         } else { 
             data.id = nextId("RISK", D.risks); 
             data.linkedKPIs = []; 
             data.linkedWorkflows = []; 
             data.linkedActions = []; 
 
          D.risks.push(data); 
             showToast("Risk added successfully"); 
         } 
         closeModal(); 
         window.dispatchEvent(new HashChangeEvent("hashchange")); 
     }); 
 } 
 function deleteRisk(id) { 
     const idx = D.risks.findIndex(r => r.id === id); 
     if (idx >= 0) { 
         const name = D.risks[idx].title; 
         confirmDelete("Risk", name, () => { 
             D.risks.splice(idx, 1); 
             showToast("Risk deleted"); 
             window.dispatchEvent(new HashChangeEvent("hashchange")); 
         }); 
     } 
 } 
  /* ============================================================ 
       DOCUMENTS CRUD 
       ============================================================ */ 
 function openDocumentForm(doc) { 
     const isEdit = !!doc; 
     const d = doc || {}; 
     const batches = ["Governing Authority", "Institutional Context", "Equity Analysis and Engagement", 
         "Accessibility and Language Access", "Workforce Equity", "Service System Operations", 
         "Training and Reusable Resources", "One DSD Program Core Internal", "Program Operations Internal", 
         "Data and Measurement Internal", "Learning Architecture Internal", "Templates Internal"]; 
     const body = `<form id="doc-form" class="modal-form"> 
         ${field("Title", "title", "text", d.title, { required: true, placeholder: "Full document title" })} 
         ${field("Short Title", "shortTitle", "text", d.shortTitle, { placeholder: "Abbreviated name" })} 
         ${field("Batch", "batch", "select", d.batch, { required: true, placeholder: "Select batch", options: batches })} 
 
      ${field("Authority Type", "authorityType", "select", d.authorityType, { required: true, placeholder: "Select type", 
             options: ["Federal Guidance", "Federal/State Law", "State Policy", "Enterprise Policy", "Division Policy", "Program Guidance", "Operational Procedure", "Training Resource"] })} 
         ${field("Authority Rank", "authorityRank", "number", d.authorityRank, { required: true, min: 1, max: 8, step: 1 })} 
         ${field("Source Type", "sourceType", "select", d.sourceType || "Public", { required: true, options: ["Public", "Internal"] })} 
         ${field("Source Organization", "sourceOrg", "text", d.sourceOrg, { placeholder: "Originating organization" })} 
         ${field("Document Type", "documentType", "text", d.documentType, { placeholder: "e.g., Standards / Framework" })} 
         ${field("Status", "status", "select", d.status || "Active", { required: true, options: ["Active", "Draft", "Under Review", "Archived", "Superseded"] })} 
         ${field("Owner", "owner", "select", d.owner, { required: true, placeholder: "Select owner", options: roleOptions() })} 
         ${field("Purpose", "purpose", "textarea", d.purpose, { required: true, rows: 3 })} 
         ${field("Effective Date", "effectiveDate", "date", d.effectiveDate)} 
         ${field("Review Date", "reviewDate", "date", d.reviewDate)} 
         ${field("Source of Truth", "sourceOfTruth", "checkbox", d.sourceOfTruth, { checkLabel: "This document is the source of truth" })} 
         ${field("Required for Compliance", "requiredForCompliance", "checkbox", d.requiredForCompliance, { checkLabel: "Required for compliance" })} 
     </form>`; 
     openModal( 
         isEdit ? "Edit Document" : "Add Document", 
         body, 
         `<button class="btn btn--ghost" id="btn-cancel">Cancel</button> 
           <button class="btn btn--primary" id="btn-save">${isEdit ? "Save Changes" : "Add Document"}</button>` 
     ); 
     document.getElementById("btn-cancel").addEventListener("click", closeModal); 
     document.getElementById("btn-save").addEventListener("click", () => { 
         const form = document.getElementById("doc-form"); 
         if (!form.checkValidity()) { form.reportValidity(); return; } 
         const data = getFormData(["title", "shortTitle", "batch", "authorityType", "authorityRank", "sourceType", "sourceOrg", "documentType", "status", "owner", "purpose", "effectiveDate", "reviewDate", "sourceOfTruth", "requiredForCompliance"]); 
         data.authorityRank = parseInt(data.authorityRank, 10) || 5; 
         if (isEdit) { 
             Object.assign(doc, data); 
             showToast("Document updated successfully"); 
         } else { 
             data.id = nextId("DOC", D.documents); 
             data.format = "Web"; 
             data.audience = ""; 
             data.processingStatus = "Tagged"; 
             data.programRelevance = ""; 
             data.trainingRelevance = ""; 
             data.equityMethod = ""; 
             data.institutionalScope = ""; 
             data.geographicScope = ""; 
             data.notes = ""; 
             D.documents.push(data); 
             showToast("Document added successfully"); 
         } 
         closeModal(); 
         window.dispatchEvent(new HashChangeEvent("hashchange")); 
     }); 
 } 
 function deleteDocument(id) { 
     const idx = D.documents.findIndex(d => d.id === id); 
     if (idx >= 0) { 
         const name = D.documents[idx].title; 
         confirmDelete("Document", name, () => { 
             D.documents.splice(idx, 1); 
             showToast("Document deleted"); 
             location.hash = "knowledge-base"; 
         }); 
     } 
 } 
 /* ============================================================ 
       KPI EDIT 
       ============================================================ */ 
 function openKPIForm(kpi) { 
     if (!kpi) return; 
     const body = `<form id="kpi-form" class="modal-form"> 
         <div class="form-group"><label class="form-label">KPI</label><p class="form-static">${kpi.name} (${kpi.id})</p></div> 
         ${field("Current Value", "currentValue", "number", kpi.currentValue, { required: true, step: "any" })} 
         ${field("Target", "target", "number", kpi.target, { step: "any" })} 
         ${field("Trend", "trend", "select", kpi.trend, { required: true, options: ["up", "down", "flat"] })} 
         ${field("Data Quality", "dataQuality", "select", kpi.dataQuality || "High", { required: true, options: ["High", "Medium", "Low", "Needs Validation"] })} 
         ${field("Owner", "owner", "select", kpi.owner, { required: true, placeholder: "Select owner", options: roleOptions() })} 
     </form>`; 
     openModal( 
         "Edit KPI", 
         body, 
         `<button class="btn btn--ghost" id="btn-cancel">Cancel</button> 
           <button class="btn btn--primary" id="btn-save">Save Changes</button>` 
     ); 
     document.getElementById("btn-cancel").addEventListener("click", closeModal); 
     document.getElementById("btn-save").addEventListener("click", () => { 
         const form = document.getElementById("kpi-form"); 
         if (!form.checkValidity()) { form.reportValidity(); return; } 
         const data = getFormData(["currentValue", "trend", "target", "dataQuality", "owner"]); 
         kpi.previousValue = kpi.currentValue; 
         Object.assign(kpi, data); 
         showToast("KPI updated successfully"); 
     
  closeModal(); 
         window.dispatchEvent(new HashChangeEvent("hashchange")); 
     }); 
 } 
 /* ============================================================ 
       WORKFLOW RUNS CRUD 
       ============================================================ */ 
 function openRunForm(run, workflowId) { 
     const isEdit = !!run; 
     const r = run || {}; 
     const wf = workflowId ? D.workflows.find(w => w.id === workflowId) : null; 
     const stages = wf ? wf.stages.sort((a, b) => a.order - b.order).map(s => s.name) : []; 
     const body = `<form id="run-form" class="modal-form"> 
         ${field("Title", "title", "text", r.title, { required: true, placeholder: "Run title" })} 
         ${field("Description", "description", "textarea", r.description, { rows: 3 })} 
         ${!isEdit ? field("Workflow", "workflowId", "select", workflowId || r.workflowId, { required: true, placeholder: "Select workflow", options: workflowOptions() }) : ""} 
         ${stages.length ? field("Current Stage", "currentStage", "select", r.currentStage, { required: true, options: stages }) : ""} 
         ${field("Status", "status", "select", r.status || "In Progress", { required: true, options: ["In Progress", "On Hold", "Completed"] })} 
         ${field("Priority", "priority", "select", r.priority || "Medium", { required: true, options: ["High", "Medium", "Low"] })} 
         ${field("Requested By", "requestedBy", "select", r.requestedBy, { required: true, placeholder: "Select role", options: roleOptions() })} 
         ${field("Assigned To", "assignedTo", "select", r.assignedTo, { required: true, placeholder: "Select role", options: roleOptions() })} 
         ${field("Start Date", "startDate", "date", r.startDate)} 
         ${field("Target Date", "targetDate", "date", r.targetDate)} 
     </form>`; 
     openModal( 
         isEdit ? "Edit Workflow Run" : "Start New Run", 
         body, 
         `<button class="btn btn--ghost" id="btn-cancel">Cancel</button> 
           <button class="btn btn--primary" id="btn-save">${isEdit ? "Save Changes" : "Start Run"}</button>` 
     ); 
     // If adding and no workflowId, populate stages on workflow change 
     if (!isEdit && !workflowId) { 
         const wfSelect = document.getElementById("field-workflowId"); 
         if (wfSelect) { 
             wfSelect.addEventListener("change", () => { 
                 const selWf = D.workflows.find(w => w.id === wfSelect.value); 
                 const stageField = document.getElementById("field-currentStage"); 
                 if (stageField && selWf) { 
                     const st = selWf.stages.sort((a, b) => a.order - b.order); 
                     stageField.innerHTML = st.map(s => `<option>${s.name}</option>`).join(""); 
                 } 
             }); 
         } 
     } 
     document.getElementById("btn-cancel").addEventListener("click", closeModal); 
     document.getElementById("btn-save").addEventListener("click", () => { 
         const form = document.getElementById("run-form"); 
         if (!form.checkValidity()) { form.reportValidity(); return; } 
         const fields = ["title", "description", "currentStage", "status", "priority", "requestedBy", "assignedTo", "startDate", "targetDate"]; 
 
      if (!isEdit) fields.push("workflowId"); 
         const data = getFormData(fields); 
         if (isEdit) { 
             Object.assign(run, data); 
             showToast("Workflow run updated"); 
         } else { 
             data.id = nextId("RUN", D.workflowRuns); 
             data.linkedDocs = []; 
             data.linkedTemplates = []; 
             data.notes = ""; 
             D.workflowRuns.push(data); 
             showToast("Workflow run started"); 
         } 
         closeModal(); 
         window.dispatchEvent(new HashChangeEvent("hashchange")); 
     }); 
 } 
 function deleteRun(id) { 
     const idx = D.workflowRuns.findIndex(r => r.id === id); 
     if (idx >= 0) { 
         const name = D.workflowRuns[idx].title; 
         confirmDelete("Workflow Run", name, () => { 
             D.workflowRuns.splice(idx, 1); 
             showToast("Workflow run deleted"); 
             location.hash = "workflows"; 
         }); 
     } 
 } 
 /* ============================================================ 
       TEMPLATES CRUD 
       ============================================================ */ 
 function openTemplateForm(tmpl) { 
     const isEdit = !!tmpl; 
     const t = tmpl || {}; 
     const body = `<form id="template-form" class="modal-form"> 
         ${field("Name", "name", "text", t.name, { required: true, placeholder: "Template name" })} 
         ${field("Type", "type", "select", t.type || "Template", { required: true, options: ["Template", "Form", "Checklist"] })} 
         ${field("Description", "description", "textarea", t.description, { required: true, rows: 3 })} 
         ${field("Owner", "owner", "select", t.owner, { required: true, placeholder: "Select owner", options: roleOptions() })} 
         ${field("Audience", "audience", "text", t.audience, { placeholder: "Target audience" })} 
         ${field("Status", "status", "select", t.status || "Active", { required: true, options: ["Active", "Draft", "Under Review", "Archived"] })} 
         ${field("Version", "version", "text", t.version || "1.0", { placeholder: "e.g., 1.0" })} 
     </form>`; 
     openModal( 
         isEdit ? "Edit Template" : "Add Template", 
         body, 
         `<button class="btn btn--ghost" id="btn-cancel">Cancel</button> 
           <button class="btn btn--primary" id="btn-save">${isEdit ? "Save Changes" : "Add Template"}</button>` 
     ); 
     document.getElementById("btn-cancel").addEventListener("click", closeModal); 
     document.getElementById("btn-save").addEventListener("click", () => { 
         const form = document.getElementById("template-form"); 
         if (!form.checkValidity()) { form.reportValidity(); return; } 
         const data = getFormData(["name", "type", "description", "owner", "audience", "status", "version"]); 
         if (isEdit) { 
             Object.assign(tmpl, data); 
             showToast("Template updated successfully"); 
         } else { 
             data.id = nextId("TMPL", D.templates); 
             data.linkedWorkflows = []; 
             data.linkedDocs = []; 
             D.templates.push(data); 
             showToast("Template added successfully"); 
         } 
         closeModal(); 
         window.dispatchEvent(new HashChangeEvent("hashchange")); 
     }); 
 } 
 function deleteTemplate(id) { 
 
  const idx = D.templates.findIndex(t => t.id === id); 
     if (idx >= 0) { 
         const name = D.templates[idx].name; 
         confirmDelete("Template", name, () => { 
             D.templates.splice(idx, 1); 
             showToast("Template deleted"); 
             location.hash = "templates"; 
         }); 
     } 
 } 
 /* ============================================================ 
       LEARNING ASSETS CRUD 
       ============================================================ */ 
 function openLearningForm(asset) { 
     const isEdit = !!asset; 
     const a = asset || {}; 
     const body = `<form id="learning-form" class="modal-form"> 
         ${field("Title", "title", "text", a.title, { required: true, placeholder: "Learning asset title" })} 
         ${field("Type", "type", "select", a.type || "Course", { required: true, options: ["Course", "Microlearning", "Job Aid"] })} 
         ${field("Description", "description", "textarea", a.description, { required: true, rows: 3 })} 
         ${field("Required / Optional", "requiredOrOptional", "select", a.requiredOrOptional || "Optional", { required: true, options: ["Required", "Optional"] })} 
         ${field("Estimated Duration", "estimatedDuration", "text", a.estimatedDuration, { placeholder: "e.g., 45 minutes" })} 
         ${field("Owner", "owner", "select", a.owner, { required: true, placeholder: "Select owner", options: roleOptions() })} 
         ${field("Status", "status", "select", a.status || "Active", { required: true, options: ["Active", "Draft", "Under Review", "Archived"] })} 
     </form>`; 
     openModal( 
 
      isEdit ? "Edit Learning Asset" : "Add Learning Asset", 
         body, 
         `<button class="btn btn--ghost" id="btn-cancel">Cancel</button> 
           <button class="btn btn--primary" id="btn-save">${isEdit ? "Save Changes" : "Add Learning Asset"}</button>` 
     ); 
     document.getElementById("btn-cancel").addEventListener("click", closeModal); 
     document.getElementById("btn-save").addEventListener("click", () => { 
         const form = document.getElementById("learning-form"); 
         if (!form.checkValidity()) { form.reportValidity(); return; } 
         const data = getFormData(["title", "type", "description", "requiredOrOptional", "estimatedDuration", "owner", "status"]); 
         if (isEdit) { 
             Object.assign(asset, data); 
             showToast("Learning asset updated successfully"); 
         } else { 
             data.id = nextId("LA", D.learningAssets); 
             data.audience = []; 
             data.sourceDocs = []; 
             data.linkedWorkflows = []; 
             data.linkedTemplates = []; 
             D.learningAssets.push(data); 
         
  showToast("Learning asset added successfully"); 
         } 
         closeModal(); 
         window.dispatchEvent(new HashChangeEvent("hashchange")); 
     }); 
 } 
 function deleteLearningAsset(id) { 
     const idx = D.learningAssets.findIndex(a => a.id === id); 
     if (idx >= 0) { 
         const name = D.learningAssets[idx].title; 
         confirmDelete("Learning Asset", name, () => { 
             D.learningAssets.splice(idx, 1); 
             showToast("Learning asset deleted"); 
             location.hash = "learning"; 
         }); 
     } 
  } 
 /* ============================================================ 
       ROLES CRUD 
       ============================================================ */ 
 function openRoleForm(role) { 
     const isEdit = !!role; 
     const r = role || {}; 
     const body = `<form id="role-form" class="modal-form"> 
         ${field("Name", "name", "text", r.name, { required: true, placeholder: "Role name" })} 
         ${field("Type", "type", "select", r.type || "Contributor", { required: true, options: ["Program Owner", "Approver", "Requester", "Contributor", "Analyst"] })} 
         ${field("Purpose", "purpose", "textarea", r.purpose, { required: true, rows: 3 })} 
         ${field("Active", "active", "checkbox", r.active !== false, { checkLabel: "Role is currently active" })} 
     </form>`; 
     openModal( 
         isEdit ? "Edit Role" : "Add Role", 
         body, 
         `<button class="btn btn--ghost" id="btn-cancel">Cancel</button> 
           <button class="btn btn--primary" id="btn-save">${isEdit ? "Save Changes" : "Add Role"}</button>` 
     ); 
     document.getElementById("btn-cancel").addEventListener("click", closeModal); 
     document.getElementById("btn-save").addEventListener("click", () => { 
         const form = document.getElementById("role-form"); 
         if (!form.checkValidity()) { form.reportValidity(); return; } 
         const data = getFormData(["name", "type", "purpose", "active"]); 
         if (isEdit) { 
             Object.assign(role, data); 
             showToast("Role updated successfully"); 
         } else { 
             data.id = nextId("ROLE", D.roles); 
     
      data.responsibilities = []; 
             data.decisionAuthority = []; 
             data.reviewScope = []; 
             D.roles.push(data); 
             showToast("Role added successfully"); 
         } 
         closeModal(); 
         window.dispatchEvent(new HashChangeEvent("hashchange")); 
     }); 
 } 
 function deleteRole(id) { 
     const idx = D.roles.findIndex(r => r.id === id); 
     if (idx >= 0) { 
         const name = D.roles[idx].name; 
         confirmDelete("Role", name, () => { 
             D.roles.splice(idx, 1); 
             showToast("Role deleted"); 
             location.hash = "roles"; 
         }); 
     } 
 } 
 /* ── Expose API ─────────────────────────────────── */ 
 window.CRUD = { 
     openActionForm, deleteAction, 
     openRiskForm, deleteRisk, 
     openDocumentForm, deleteDocument, 
     openKPIForm, 
     openRunForm, deleteRun, 
     openTemplateForm, deleteTemplate, 
     openLearningForm, deleteLearningAsset, 
     openRoleForm, deleteRole, 
     showToast 
 }; })();