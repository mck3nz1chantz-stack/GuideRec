# ChantzMedia Project

**Project:** GuideRec

This workspace is a **ChantzMedia project**. When you see this file (or the user says `ChantzMedia`), operate as the ChantzMedia project hub.

## Key reference

**There is no project or launcher root `AGENTS.md`.** This file (`CHANTZMEDIA.md`) is the project hub. Launcher SSOT is modular under `$LAUNCHER` — start at `$LAUNCHER/LAUNCHER_INDEX.md` (thin map) · `$LAUNCHER/PATHS.md` (paths/commands).

**Paths, folder layout, and canonical commands:** `$LAUNCHER/PATHS.md` (launcher read-only). Live launcher for this project: **1.4.2** at `~/ChantzMedia/ChantzMediaLauncher` (`VERSION.txt`). Not `~/Desktop/ChantzMediaLauncher`.

## Launcher (read-only by default)

Load rules, templates, skills, and guardrails from `$LAUNCHER` — see `PATHS.md` § Roots · index: `LAUNCHER_INDEX.md`. **Do not modify the launcher** unless a grant in `PERMISSIONS.md` applies (standing high-confidence bounded auto-execute **or** session phrase — targets the **launcher directory**, not an `AGENTS.md` file).

## Modules

Route every task to one primary module. GrokLaw audits and can block — it does not execute work.

| Module | Role | Entry |
|--------|------|-------|
| **GrokBuild** | Coding, technical work, basic compliance (VSCode identity/hard stops: `$LAUNCHER/GrokBuild/GROKBUILD_CORE.md`) | `GrokBuild/GROKBUILD_CORE.md` |
| **GrokDocs** | Document generation from build state | `GrokDocs/GROKDOCS_CORE.md` |
| **Document Design** | Contract-quality polish, manifests, local PDF + fillable Client Form | `skills/grokbuild-document-design/SKILL.md` |
| **Document Deployment** | Local PDF package (not web deploy) — same skill | `DOCUMENT_DEPLOYMENT_ROUTER.md` |
| **vite-dev-guard** | Vite dev-server diagnostics | `skills/vite-dev-guard/SKILL.md` |
| **site-perf-guard** | Site performance & basic SEO audit | `skills/site-perf-guard/SKILL.md` |
| **site-analysis** | URL rebuild G1 analysis (after G0) | `skills/site-analysis/SKILL.md` |
| **marketing-strategist** | Conversion, CTAs, funnel · `mktg` · `/mktg` | `skills/marketing-strategist/SKILL.md` |
| **market-gap-scout** | Local niches / what to build · `MarketGap` | `skills/market-gap-scout/SKILL.md` |
| **stallstart** | Field activation product · `StallStart` · `FieldLaunch` | `skills/stallstart/SKILL.md` · `products/stallstart/` |
| **advertising-creative** | Ad concepts / Imagine · `ads` · `/ads` | `skills/advertising-creative/SKILL.md` |
| **Discoverability** | SEO + AiEo on public pages (same slice) | `skills/seo/` + `skills/aieo/` |
| **asset-pipeline** | Creatives → `docs/assets` · `assets` | `skills/asset-pipeline/SKILL.md` |
| **deploy** | Opt-in web host only · `AddDeploy` | `skills/deploy/SKILL.md` |
| **GrokLaw** | Pre-build consult, doc review, compliance gates | `GrokLaw/GROKLAW_CORE.md` |
| **GrokLawPrep** | Organize materials for Michigan attorney review (not legal advice) | `GrokLawPrep/README.md` · `GrokLawPrep/activation.md` |

**Client documents:** Premium handoff aesthetic is the default — SSOT: `$LAUNCHER/skills/grokbuild-document-design/SKILL.md` § Client Document Design Standards (do not restate the full checklist here).

Pipeline order: `PATHS.md` § Pipeline order · routing: `MODULE_ROUTER.md` · gates: `WORKFLOW.md`.

## Project standards

- **GrokLaw registry** — see `PATHS.md` § GrokLaw filing
- **Build handoff** — GrokBuild updates `build-state.json` before GrokDocs runs
- **Client-care features** — if a feature needs client setup/sync/link, register `clientCareFeatures[]` and ship a package how-to (`templates/client-handoff/client-care-features.md`)
- **Media job stages** — `build-state.json` → `mediaJob` (`intake→…→deliver`); CLI + rules: `$LAUNCHER/PATHS.md` § Media job · `$LAUNCHER/WORKFLOW.md` § Media job · shorthand `MediaLaunch`
- **Website SiteScaffold gate** — no freestyle IA; `chantz scaffold . --apply` then SiteBuild; tier limits: `scope-matrix.v1.json`
- **Session context limiter** — start with `chantz focus . --from-stage --apply` + `chantz context .`; obey `$PROJECT/docs/session/focus.md` BLOCK list; living openers: `$LAUNCHER/docs/final/ops/CONTEXT_COMMAND_GUIDE.md` · Desktop **Operator Context Hub**
- **PlantForge / StallStart** — separate job kinds; do **not** force through website MediaLaunch / SiteProfile
- **GrowthLoop / assets / session** — post-launch `GrowthLoop`; creatives `skills/asset-pipeline/`; context pack `docs/session/latest.md` (`PATHS.md` § GrowthLoop · Phase summary)
- **Discoverability** — every public page slice: **SEO + AiEo** (`skills/seo` + `skills/aieo`) — phrase `Discoverability`
- **Client Hub intake** — `docs/client-hub/facts.v1.json`; seed brief via `intake-seed.js` (`PATHS.md` § Intake seed) · tool: `$LAUNCHER/ClientIntakeForge/`
- **Document design** — polished deliverables go to `docs/final/` with format manifest
- **Document Deployment** — local PDF package after GrokLaw PASS when enrolled: `DOCUMENT_DEPLOYMENT_ROUTER.md` · `PATHS.md` § Document Deployment
- **Web deployment (opt-in only)** — not default; `PATHS.md` § Opt-in web deployment (`add-deployment.js`, always `npx wrangler`)
- **Agentic engineering** — every build slice: SPEC → small diff → VERIFY → REVIEW · SSOT `$LAUNCHER/docs/final/ops/AGENTIC_ENGINEERING.md` · outcomes `chantz eval outcomes`
- **Operator wiki** — compounding lessons: `$LAUNCHER/docs/wiki/` · `chantz wiki query "…"` (not a second rulebook)
- **Slice verify** — before claiming a build slice done: `chantz verify run . --preset=auto --goal="…" --apply` · SSOT `$LAUNCHER/docs/final/ops/SLICE_VERIFY.md`
- **Anti-bloat** — rules live in one place: `$LAUNCHER/BLOAT_PREVENTION.md`
- **Site footer (product UI)** — every public/client website must end with `{BusinessName} All Rights Reserved` and, at the very bottom, **`Created By ChantzMedia` linked to `https://chantzmedia.com`** (`target="_blank"` `rel="noopener noreferrer"`) — SSOT: `$LAUNCHER/GrokBuild/GROKBUILD_CORE.md` § Site footer
- **First-party agency site** — `ChantzMediaWebsite` / chantzmedia.com: **production always approved** (indexable). Client demos keep noindex until that client approves go-live.

## Activation

Minimal trigger — any of these is enough:

```
ChantzMedia
```

Or open this project and start talking naturally. Grok infers the module from the request. For explicit module focus, the user can say `build`, `docs`, `law`, or use shorthand flows (`MediaLaunch`, `Discoverability`, `aieo`, `GrowthLoop`, `DocPipeline`, `DocFinish`, `BuildLaw`, `URLCheck`, `vite-guard`, `site-perf-guard`, `mktg`, `MarketGap`, `StallStart`, `ads`, `GrowthDev`, `GrowthLaunch`, `FullSlice`, `IntakeSeed`, `assets`, `PhaseSummary`) from `ACTIVATION_PROMPTS.md`. Dual growth collab: `$LAUNCHER/skills/marketing-strategist/references/dual-agent-collab.md`. StallStart product: `$LAUNCHER/products/stallstart/`.

## Workspace

Project folder layout: see `PATHS.md` § Project workspace layout