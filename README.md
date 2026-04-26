# One DSD Equity Program Application

This repository is the deployment target for the One DSD Equity Program application.

Planned cloud path:

- GitHub for source control and deployment workflow
- Supabase for PostgreSQL, vector search, private file storage, and authentication configuration
- Azure Container Apps for the API and web containers
- Cloudflare Workers for HTTPS, edge routing, and public entry control

## Current build status

The scaffold has been runtime-fixed and hardened for cloud deployment. The local container scaffold remains useful for packaging and testing, but the intended owner experience is cloud deployment through GitHub Actions, not manual local command-line operation.

## Included deployment controls

- CI workflow
- Azure deployment workflow
- Azure Container Apps deployment manifests
- Supabase storage setup SQL
- Cloudflare Worker routing scaffold
- Production hardening control plan
- Environment variable and secret map

## Production readiness boundary

The repository can hold the deployment code and workflows. Supabase, Azure, and Cloudflare still require tenant-owned secret values and account-level access. Those values should never be committed to this repository.

## Next operational step

Populate the required repository and Cloudflare secrets, then run the deployment workflow. The deployment workflow builds the API and web containers and deploys them to Azure Container Apps.