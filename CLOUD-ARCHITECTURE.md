# One DSD Equity Program — Cloud Architecture & Operations Guide

**Division:** Disability Services Division (DSD), Minnesota DHS
**Program:** One DSD Equity Program
**Document owner:** Gary Bellows, Equity and Inclusion Operations Consultant
**Last updated:** March 2026
**Status:** Living document — update when infrastructure changes

---

## Quick Reference

| Resource | Value | Notes |
|----------|-------|-------|
| Live app URL | `https://equity-layout-shell.lovable.app` | Lovable-hosted deployment |
| Supabase project | `pmwqakhmcudwokupzsfj.supabase.co` | Hosted by Supabase Inc. (US-East-1 by default) |
| GitHub repository | `Gary-design63/One-DSD-Equity-Program` | Source of truth for all code |
| Build platform | Lovable (`lovable.dev`) | Auto-deploys on push to `main` |
| Auth method | TBD — see Section 2 | Azure AD recommended; not yet wired |
| Primary contact | Gary Bellows | gary.bellows@state.mn.us |

---

## 1. Current Cloud Setup

### 1.1 Where Things Live

```
GitHub Repo  ──push to main──►  Lovable Build  ──deploys──►  equity-layout-shell.lovable.app
                                                                          │
                                                              Calls Supabase REST/JS API
                                                                          │
                                                         pmwqakhmcudwokupzsfj.supabase.co
                                                         (Auth · Database · Storage · Edge Fn)
```

**GitHub (Gary-design63/One-DSD-Equity-Program)**
- All application code lives here: React/Vite/TypeScript frontend, public JS files, configuration
- Lovable monitors this repo and auto-deploys on every push to `main`
- Branch `claude/convert-elearning-to-html-3Kzfn` is the active development branch
- No secrets should ever be committed here (see Section 2.3)

**Lovable (`equity-layout-shell.lovable.app`)**
- Lovable is a cloud-based app builder that hosts the compiled React app on its CDN
- Deployment is automatic: push to `main` → Lovable builds → live in ~60 seconds
- Custom domain can be connected under Project > Settings > Domains
  - Recommended future domain: `equity.dsd.dhs.mn.gov` (requires MNIT DNS coordination)
- Lovable credentials are held by: **Gary Bellows** (gary.bellows@state.mn.us)
- No server-side compute runs on Lovable — it is purely a static host
- Lovable does not store program data; all data lives in Supabase

**Supabase (`pmwqakhmcudwokupzsfj.supabase.co`)**
- Cloud PostgreSQL database + auth + file storage + serverless edge functions
- Current data model: see `public/data.js` for the schema (roles, documents, workflows, templates, KPIs, learning assets, actions, risks)
- Supabase credentials held by: **Gary Bellows** — credentials must be transferred to a shared DSD service account (see Section 5)
- Row Level Security (RLS) policies must be enabled before any real staff data is stored (see Section 2.2)

### 1.2 Implementation Status

| Item | Status | Priority | Notes |
|------|--------|----------|-------|
| Supabase JS client in React app | **Done** | High | `src/core/supabaseClient.ts` — initialized with env vars |
| Authentication (Entra ID) | **Done** | High | `src/context/AuthContext.tsx` — Supabase OAuth with Azure AD; localhost auto-admin bypass for dev |
| Server-side token validation | **Done** | High | `supabase/functions/validate-token/` — validates Azure AD JWTs against JWKS |
| Server-side file storage | **Done** | High | `supabase/functions/blob-storage/` — Azure Blob or Supabase Storage fallback |
| Server-side PDF/report export | **Done** | Medium | `supabase/functions/export-pdf/` — print-optimized HTML reports |
| Azure Static Web Apps deployment | **Done** | Medium | `.github/workflows/azure-swa-deploy.yml` + `staticwebapp.config.json` |
| Environment variables / secrets | **Done** | High | `.env.example` with all variables documented; Edge Function secrets for server-side keys |
| Real database tables (not mock `data.js`) | Not started | High | Schema defined in Section 5.2; tables not yet created in Supabase |
| Row Level Security policies | Not started | High | Example policies in Section 2.2; not yet applied |
| Custom domain (dhs.mn.gov) | Not started | Medium | Requires MNIT DNS coordination |

---

## 2. Access & Authentication

### 2.1 Recommended Auth Method: Azure Active Directory (Microsoft Entra ID)

DSD staff already have state-issued Microsoft/Azure AD accounts. Using Azure AD as the identity provider means:
- Staff log in with their existing `@state.mn.us` credentials — no new password to manage
- Multi-factor authentication (MFA) is inherited from the state's existing Azure AD policies
- Account lifecycle (onboarding/offboarding) is managed by MNIT, not by this program

**Implementation status:** The React/Supabase auth flow is implemented in `src/context/AuthContext.tsx`. Server-side token validation is handled by the `validate-token` Supabase Edge Function. The legacy `public/auth.js` MSAL implementation is superseded by this approach.

**Remaining setup steps:**
1. Register the app in Azure AD (requires MNIT cooperation or an existing DHS app registration)
2. Configure the Supabase project to use Azure AD as an OAuth provider (Supabase Dashboard > Auth > Providers > Azure)
3. Set Edge Function secrets: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
4. Test with a non-production Azure AD tenant before going live

**Alternative (simpler, lower compliance posture):** Supabase email/password auth
- Faster to implement but requires managing a separate credential store outside the state's identity system
- Not recommended for a production DSD tool; use only for prototype/demo phases

### 2.2 Role-Based Access Control (RBAC)

The One DSD Equity Program has six defined roles (from `public/data.js`):

| Role ID | Role Name | Access Level | Sees |
|---------|-----------|-------------|------|
| ROLE-001 | Equity & Inclusion Operations Consultant | Admin | All pages including Risks, Actions, Roles |
| ROLE-002 | Leadership Reviewer | Approver | Dashboard, Reports, Risks, Actions |
| ROLE-003 | Program Manager / Initiative Lead | Editor | Dashboard, Workflows, Templates, Learning |
| ROLE-004 | Content Owner | Contributor | Knowledge Base, Accessibility, Templates |
| ROLE-005 | Educational Resources Owner | Contributor | Learning, Templates, Knowledge Base |
| ROLE-006 | Data Steward | Analyst | Metrics, Reports, Data exports |

**Supabase Row Level Security (RLS) policies to implement:**

```sql
-- Example: Only ROLE-001 and ROLE-002 can read the risks table
CREATE POLICY "risks_admin_only" ON risks
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('ROLE-001', 'ROLE-002')
  );

-- Example: Program managers can only edit their own workflow runs
CREATE POLICY "runs_own_edit" ON workflow_runs
  FOR UPDATE USING (
    auth.uid() = requested_by_user_id
  );
```

All RLS policies must be written and tested before any staff data is loaded into the production database.

### 2.3 Credential Management

**Rules — non-negotiable:**

1. **No secrets in GitHub.** API keys, Supabase service role keys, and OAuth client secrets must never appear in committed code. The `.gitignore` already excludes `*.local` files.

2. **Use environment variables.** The Vite build system reads from `.env.local` (local) and Lovable's environment variable settings (production). Variables must be prefixed `VITE_` to be accessible in the browser bundle.

3. **Supabase anon key vs. service role key:**
   - The `VITE_SUPABASE_ANON_KEY` (safe to expose to the browser) is used for all client-side calls
   - The service role key (bypasses RLS) must never be in the frontend — only in server-side Edge Functions

4. **Lovable environment variables:** Set in Lovable project settings under Environment Variables. These are injected at build time and not exposed in the GitHub repo.

**Variables to configure in Lovable:**

```
VITE_SUPABASE_URL=https://pmwqakhmcudwokupzsfj.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase dashboard — not the service role key>
VITE_AZURE_CLIENT_ID=<app registration client ID from Azure AD / MNIT>
VITE_AZURE_TENANT_ID=<DHS Azure AD tenant ID>
```

5. **Rotate credentials** whenever a team member with access leaves. Document the rotation in this file under Section 5.

---

## 2.5 Server-Side Services (Supabase Edge Functions)

The platform uses **Supabase Edge Functions** for all operations that must run server-side. These are Deno-based serverless functions deployed to Supabase infrastructure. They have access to secrets (Azure AD client secret, Supabase service role key, Azure Storage keys) that must never be exposed to the browser.

| Function | Path | Purpose |
|----------|------|---------|
| `validate-token` | `supabase/functions/validate-token/` | Validates Microsoft Entra ID JWTs server-side: checks signature against Azure AD JWKS, verifies issuer/audience/expiry, validates email domain |
| `blob-storage` | `supabase/functions/blob-storage/` | Server-side file upload/download/delete/list. Uses Azure Blob Storage if configured; falls back to Supabase Storage automatically |
| `export-pdf` | `supabase/functions/export-pdf/` | Generates print-optimized HTML reports (equity reports, policy documents, metrics snapshots, workflow summaries) with DSD branding and @page print CSS |

**Why Edge Functions instead of a Node.js server?**
- The frontend is a static SPA deployed to a CDN — there is no server to host Express/Fastify
- Edge Functions run on Supabase infrastructure, which is already the database/auth provider
- Zero server management, auto-scaling, and no additional hosting cost
- Secrets stay in Supabase (never in browser environment variables)
- If DSD/MNIT decides to move to a traditional backend later, the function logic can be ported directly to Express routes

**Deploying Edge Functions:**
```bash
supabase link --project-ref pmwqakhmcudwokupzsfj
supabase secrets set AZURE_TENANT_ID=<value> AZURE_CLIENT_ID=<value> AZURE_CLIENT_SECRET=<value>
supabase functions deploy validate-token
supabase functions deploy blob-storage
supabase functions deploy export-pdf
```

**Edge Function secrets (set via Supabase CLI or Dashboard):**
| Secret | Required | Purpose |
|--------|----------|---------|
| `AZURE_TENANT_ID` | Yes (for Entra ID) | Azure AD tenant for JWT validation |
| `AZURE_CLIENT_ID` | Yes (for Entra ID) | App registration client ID |
| `AZURE_CLIENT_SECRET` | Yes (for Entra ID) | App registration client secret |
| `AZURE_STORAGE_ACCOUNT` | Optional | Azure Blob Storage account name |
| `AZURE_STORAGE_KEY` | Optional | Azure Blob Storage access key |
| `AZURE_STORAGE_CONTAINER` | Optional | Container name (default: `one-dsd-files`) |

---

## 3. Data Residency & Compliance

### 3.1 What Data This System Handles

The One DSD Equity Program app handles:
- Equity analysis work products (non-personally identifiable at the program level)
- Consultation request logs (may include staff names and program details)
- KPI data and trend reports (aggregate counts, no individual-level data)
- Learning asset completion tracking (staff names and training completion status — PII)
- Risk and action registers (internal program management data)

It does **not** currently handle:
- Medicaid or waiver beneficiary records (that stays in MMIS)
- Social Security Numbers or financial data
- Medical or clinical records

**Classification:** Internal/Sensitive — not public-facing data, not classified as protected health information (PHI), but subject to Minnesota Government Data Practices Act (MGDPA) as government work product.

### 3.2 Questions to Resolve with DHS Information Security and MNIT

These must be answered before moving from prototype to production:

| Question | Who to Ask | Why It Matters |
|----------|-----------|----------------|
| Is Supabase (AWS US-East-1) an approved cloud vendor for DHS internal tools? | DHS Information Security Office | Some state data must stay in Minnesota or on approved infrastructure |
| Is an ATO (Authority to Operate) required for this tool? | DHS Information Security Office | Tools handling staff data or internal sensitive data often require formal ATO |
| Are there data retention requirements for equity analysis work products? | DHS Records Management | Determines how long data stays in Supabase before archiving |
| Can a third-party SaaS (Lovable) host the compiled app? | MNIT / DHS Security | Lovable hosts a static site; no DHS data transits Lovable, only Supabase — confirm this is acceptable |
| Does learning completion data (who completed what training) require MGDPA data inventory registration? | DHS Privacy Officer | Any system collecting data about state employees may need to be inventoried |
| What is the Business Associate Agreement (BAA) status of Supabase? | DHS Legal / Privacy | Not expected to handle PHI, but confirm |

### 3.3 Current Default Configuration

| Setting | Current Value | Target |
|---------|--------------|--------|
| Supabase region | US East 1 (AWS us-east-1, N. Virginia) | Confirm with MNIT whether this is acceptable or if a different region is needed |
| Data encryption at rest | Enabled by default in Supabase | Meets baseline requirement |
| Data encryption in transit | TLS enforced by Supabase | Meets baseline requirement |
| Backups | Supabase free tier: 7-day point-in-time restore | Upgrade to Supabase Pro for 30-day PITR (recommended for production) |
| Audit logs | Available in Supabase dashboard | Enable and export quarterly |

---

## 4. Backup & Continuity Plan

### 4.1 What Can Go Wrong and How to Recover

| Failure Scenario | Recovery Path | Time to Recover |
|-----------------|--------------|----------------|
| Lovable CDN outage | App is unavailable; data in Supabase is unaffected. Push code to Netlify/Vercel as fallback host (see 4.2) | 30–60 min |
| Supabase outage | App loads but data is unavailable. No recovery until Supabase restores. Read-only export mitigates (see 4.3) | Supabase SLA: 99.9% uptime |
| Accidental data deletion | Supabase point-in-time restore (PITR) — restore to any point in the last 7 days (free tier) or 30 days (Pro) | 15–30 min |
| GitHub repo access lost | Clone is in Lovable; download ZIP from Lovable project settings as emergency backup | 5 min |
| Credentials lost / account locked | See Section 4.4 — secondary access and key rotation procedure | Varies |
| Lovable discontinues service | Code lives in GitHub; redeploy to any static host (Netlify, Vercel, Azure Static Web Apps, or MNIT-hosted web server) | 1–2 hours |

### 4.2 Fallback Deployment (If Lovable Is Unavailable)

The compiled app can be deployed to any static host in under 30 minutes:

```bash
# 1. Build the app locally
npm install
npm run build          # outputs to /dist

# 2. Deploy to Netlify (example)
npx netlify-cli deploy --prod --dir=dist

# OR deploy to Azure Static Web Apps (MNIT-preferred)
# Follow: https://docs.microsoft.com/azure/static-web-apps/getting-started
```

The only change needed is updating `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the new host's environment variable settings. Supabase itself is not affected by a frontend host change.

### 4.3 Read-Only Export / Offline Fallback

To generate a read-only snapshot of program data at any time:

1. Log into the Supabase dashboard at `https://app.supabase.com`
2. Navigate to the project → Table Editor → export each table as CSV
3. Or use the Supabase CLI: `supabase db dump --project-ref pmwqakhmcudwokupzsfj > backup-YYYY-MM-DD.sql`

A quarterly data export should be saved to the DSD shared drive as a continuity measure. The `public/data.js` file in the GitHub repo also serves as a human-readable snapshot of the program's initial data model.

### 4.4 Credential Owners and Rotation

| Credential | Current Owner | Backup Access | Rotation Trigger |
|-----------|--------------|--------------|-----------------|
| Lovable account | Gary Bellows | None yet — add DSD IT contact | Staff departure |
| Supabase account | Gary Bellows | None yet — add DSD IT contact | Staff departure |
| GitHub repo admin | Gary Bellows | None yet — add DSD IT contact | Staff departure |
| Azure AD app registration | Gary Bellows + MNIT | MNIT IT support | Annual or on staff departure |
| Supabase anon key (in Lovable env vars) | Lovable env settings | Can be regenerated in Supabase dashboard | If key is ever exposed |
| Supabase service role key | Supabase dashboard only | N/A (never in frontend code) | If key is ever exposed |

**Action required:** Add at least one additional admin-level person to all three platforms (Lovable, Supabase, GitHub) before this moves into production. This eliminates the single-point-of-failure staffing risk identified in the program risk register (RISK-002).

---

## 5. Handoff Readiness

### 5.1 What DSD Needs to Own When Gary's Role Transitions

When the Equity and Inclusion Operations Consultant role eventually transitions — whether to a new person, a team, or DSD enterprise infrastructure — the following must be in place:

**Accounts and access:**
- [ ] Lovable account transferred to a `@state.mn.us` Google/GitHub org or a DSD shared account
- [ ] Supabase project ownership transferred to a DSD service account (service accounts managed by MNIT or DHS IT)
- [ ] GitHub repository transferred to a DSD or DHS GitHub organization (or mirrored to an MNIT-managed repo)
- [ ] All environment variables documented and stored in a DHS-approved secrets vault (not in a personal password manager)

**Documentation (maintained in this repo):**
- [ ] This `CLOUD-ARCHITECTURE.md` is current (update after every infrastructure change)
- [ ] All database table schemas documented (see Section 5.2)
- [ ] All workflows documented in the app itself (see the Workflows section of the live app)
- [ ] A runbook exists for: deploying a new version, rolling back, restoring from backup, rotating credentials

**Data export / migration:**
- [ ] A full SQL dump of the Supabase database is exportable at any time (see Section 4.3)
- [ ] The data model is compatible with a migration to an MNIT-managed PostgreSQL instance if DHS decides to move off Supabase
- [ ] No Supabase-specific proprietary features are used in ways that would make migration difficult (avoid vendor lock-in in Edge Functions)

### 5.2 Data Model (Tables to Be Created in Supabase)

These tables correspond to the current `public/data.js` data structure and should be created in Supabase as the app moves from prototype to production:

| Table | Primary Key | Key Columns | Notes |
|-------|------------|------------|-------|
| `roles` | `id` (TEXT, e.g. ROLE-001) | name, type, purpose, responsibilities, active | From existing data |
| `documents` | `id` (TEXT, e.g. DOC-001) | title, batch, authority_type, authority_rank, status, owner | From existing data |
| `workflows` | `id` (TEXT, e.g. WF-001) | name, description, owner, stages (JSONB), status | From existing data |
| `templates` | `id` (TEXT, e.g. TMP-001) | name, type, linked_workflows, owner, version, status | From existing data |
| `kpis` | `id` (TEXT, e.g. KPI-001) | name, dashboard_group, target, current_value, trend | From existing data |
| `learning_assets` | `id` (TEXT, e.g. LA-001) | title, type, audience, source_docs, required_or_optional | From existing data |
| `actions` | `id` (TEXT, e.g. ACT-001) | title, owner, status, priority, due_date | From existing data |
| `risks` | `id` (TEXT, e.g. RISK-001) | title, severity, likelihood, owner, mitigation_plan, status | From existing data |
| `workflow_runs` | `id` (TEXT, e.g. RUN-001) | workflow_id, current_stage, status, assigned_to, start_date | From existing data |
| `relationships` | `id` (TEXT, e.g. REL-001) | from_id, from_type, relationship_type, to_id, to_type | From existing data |
| `users` | `id` (UUID, Supabase auth) | email, display_name, role_id, active | Supabase auth table extension |
| `audit_log` | `id` (UUID) | user_id, action, table_name, record_id, timestamp | Required for MGDPA compliance |

### 5.3 Gary's Evolving Role

As the system matures, the role of the Equity and Inclusion Operations Consultant shifts:

| Phase | System Maturity | Gary's Focus |
|-------|----------------|-------------|
| Now (prototype) | Lovable-hosted shell, mock data in JS | Building and proving the concept |
| Near-term (6–12 months) | Cloud-connected, real data, staff auth | Operating, iterating, training users |
| Medium-term (12–24 months) | Full production, MNIT review underway | Consulting on equity content, not IT operations |
| Long-term | DSD/MNIT owns the platform | Purely equity program work; technical ops handed off |

The system is designed to make this transition clean: all code is in GitHub, all data is in a standard PostgreSQL database (Supabase), and there is no proprietary vendor lock-in that would prevent MNIT from taking over operations.

---

## Appendix A: Immediate Action Checklist

These are the tasks that should happen in the next 30 days before any DSD staff are given access:

- [ ] **Add a backup admin** to Lovable, Supabase, and GitHub — eliminates RISK-002
- [ ] **Confirm with DHS Information Security** that Supabase (AWS US-East-1) is acceptable for internal sensitive data
- [ ] **Submit an MNIT ticket** to initiate discussion about Azure AD app registration for auth
- [ ] **Enable RLS** on all Supabase tables (can be done now, even with mock data, to build the pattern)
- [ ] **Set Lovable environment variables** for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] **Install `@supabase/supabase-js`** in the React app and wire up a basic connection test
- [ ] **Connect a custom domain** (`equity.dsd.dhs.mn.gov` or similar) via MNIT DNS once security review is underway
- [ ] **Upgrade Supabase to Pro** (or at minimum enable 30-day PITR) before going live with real staff data
- [ ] **Export current `data.js`** to Supabase tables as the initial seed data load
- [ ] **Update this document** after each completed action

---

## Appendix B: Key Links

| Resource | URL |
|----------|-----|
| Live app | https://equity-layout-shell.lovable.app |
| Supabase dashboard | https://app.supabase.com/project/pmwqakhmcudwokupzsfj |
| GitHub repository | https://github.com/Gary-design63/One-DSD-Equity-Program |
| Lovable project | https://lovable.dev/projects/ (log in to find project) |
| Supabase docs | https://supabase.com/docs |
| Vite env variable docs | https://vitejs.dev/guide/env-and-mode |
| Azure AD app registration | https://portal.azure.com → Azure Active Directory → App registrations |
| ADA Title II compliance deadline | April 24, 2026 |
| WCAG 2.1 AA standard | https://www.w3.org/TR/WCAG21/ |
