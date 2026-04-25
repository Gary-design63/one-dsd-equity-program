# One DSD Equity Program

**Minnesota Department of Human Services — Disability Services Division**
Equity and Inclusion Operations Platform

---

## Live Application

**Production URL:** https://equity-layout-shell.lovable.app

DSD staff access the app at the URL above. The application is deployed automatically from the `main` branch via Lovable whenever code is pushed.

---

## What This Is

The One DSD Equity Program platform is the operational hub for DSD's equity work. It provides:

- **Dashboard** — KPI monitoring, active workflow runs, program actions, and risk register
- **Knowledge Base** — Governing documents, equity tools, and program references organized by authority level
- **Workflows** — Guided processes for equity scans, full analyses, accessibility reviews, and community engagement
- **Templates** — Operational forms and worksheets for all program workflows
- **Metrics** — Key performance indicators with trend tracking
- **Learning** — Equity educational resources and staff development assets
- **Assistant** — AI-assisted equity guidance (in development)
- **Roles** — Role governance and decision authority documentation (admin only)
- **Actions** — Program action item tracker (admin only)
- **Risks** — Program risk register (admin only)

---

## Cloud Architecture

The system is a **static SPA (Single Page Application)** with **cloud-native server-side services**. There is no traditional Node.js/Express backend server. Server-side logic runs as **Supabase Edge Functions** (Deno-based serverless functions).

```
┌──────────────┐       ┌─────────────────────────────┐
│  React SPA   │──────►│  Supabase                   │
│  (Vite/TS)   │       │  ├─ PostgreSQL (database)    │
│              │       │  ├─ Auth (Entra ID OAuth)    │
│  Hosted on:  │       │  ├─ Storage (file uploads)   │
│  - Lovable   │       │  └─ Edge Functions:          │
│  - Azure SWA │       │     ├─ validate-token        │
│  - Netlify   │       │     ├─ blob-storage          │
│  - Vercel    │       │     └─ export-pdf            │
└──────────────┘       └─────────────────────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ Azure AD /  │
                       │ Entra ID    │
                       │ (SSO auth)  │
                       └─────────────┘
```

| Layer | Platform | Details |
|-------|----------|---------|
| Frontend | Lovable (primary) / Azure Static Web Apps (MNIT) | React/Vite/TypeScript SPA |
| Database & Auth | Supabase | `pmwqakhmcudwokupzsfj.supabase.co` — PostgreSQL + Auth + Storage |
| Server-side Logic | Supabase Edge Functions | Token validation, file storage, PDF export |
| Identity | Microsoft Entra ID (Azure AD) | SSO via Supabase OAuth integration |
| Source code | GitHub | `Gary-design63/One-DSD-Equity-Program` |

**Why no traditional backend?** This architecture is intentional:
- **Security**: API keys (Anthropic, Supabase service role) live in Edge Function secrets, never in the browser
- **Compliance**: Server-side token validation ensures Entra ID JWTs are verified against Azure AD JWKS
- **Scalability**: Edge Functions scale automatically with zero server management
- **Portability**: The SPA deploys to any static host; server logic lives in Supabase

For full architecture details, access controls, data residency, backup procedures, and handoff planning, see **[CLOUD-ARCHITECTURE.md](./CLOUD-ARCHITECTURE.md)**.

---

## Technology Stack

- **React 18** with TypeScript
- **Vite** build tool
- **Tailwind CSS** + shadcn/ui component library
- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)
- **Microsoft Entra ID** (Azure AD) for authentication
- **Lovable** (primary hosting) / **Azure Static Web Apps** (MNIT-preferred hosting)
- **Lucide React** icons

---

## Development

### Prerequisites
- Node.js 18+ and npm
- Access to the Supabase project (contact Gary Bellows)
- Environment variables configured (see below)

### Environment Variables

Create a `.env.local` file at the project root (this file is gitignored — never commit secrets):

```bash
# Required
VITE_SUPABASE_URL=https://pmwqakhmcudwokupzsfj.supabase.co
VITE_SUPABASE_ANON_KEY=<get from Supabase dashboard — anon/public key only>

# Required for AI features
VITE_ANTHROPIC_API_KEY=<get from console.anthropic.com>

# Optional — for Entra ID auth (localhost auto-grants admin without these)
VITE_AZURE_CLIENT_ID=<from Azure AD app registration>
VITE_AZURE_TENANT_ID=<DHS Azure AD tenant ID>
```

See `.env.example` for the full list with descriptions.

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
# Note: localhost auto-grants admin access — no Azure AD login required
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Deploying

**Primary (Lovable):** Push to `main`. Lovable auto-builds and deploys within ~60 seconds.

**Azure Static Web Apps (MNIT-preferred):**
1. Create an Azure Static Web App resource in Azure Portal
2. Add `AZURE_STATIC_WEB_APPS_API_TOKEN` as a GitHub repository secret
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Azure Portal > Configuration
4. Pushes to `main` trigger `.github/workflows/azure-swa-deploy.yml` automatically

Do not push secrets, `.env` files, or service role keys to GitHub.

### Supabase Edge Functions

Server-side functions live in `supabase/functions/`. Deploy them with:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to the project
supabase link --project-ref pmwqakhmcudwokupzsfj

# Set secrets (these are NOT browser-accessible)
supabase secrets set AZURE_TENANT_ID=<value>
supabase secrets set AZURE_CLIENT_ID=<value>
supabase secrets set AZURE_CLIENT_SECRET=<value>

# Deploy all functions
supabase functions deploy validate-token
supabase functions deploy blob-storage
supabase functions deploy export-pdf
```

---

## Azure Resources Required

Before going to production, the following Azure/MNIT resources must be provisioned:

| Resource | How to Get | Used For |
|----------|-----------|----------|
| Azure AD App Registration | MNIT ticket → Azure AD → App registrations | Entra ID SSO login |
| Azure Static Web App | Azure Portal → Create Static Web App | MNIT-preferred hosting (alternative to Lovable) |
| Azure Blob Storage (optional) | Azure Portal → Create Storage Account | File storage (Supabase Storage works without this) |

---

## Contributing

For questions about the equity program itself, contact:
**Gary Bellows** — gary.bellows@state.mn.us
Equity and Inclusion Operations Consultant, Disability Services Division
