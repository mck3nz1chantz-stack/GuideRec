# GUI Desk Report — GuideRec product UI

**Mode:** pass  
**Date:** 2026-09-23  
**Surfaces in scope:** Setups · Best Habits (Record, Create, Mix, Master) · Gear · Export · footer link  
**Peer smoke:** interfaces: skipped (product UI, not launcher) | graph: skipped | eval: skipped  
**CLI tiers:** T0 check: skipped | T1 outcomes: skipped | a11y: skipped | extract: skipped  
**Summary:** The screens a person uses are wired, storage failure is not shown as saved, and the piano is a named picture. The skip link was 41px tall and is now 44px.  
**Sign-off:** GUI-CLEARED  
Evidence: browser pass at http://127.0.0.1:5183/ in an isolated context, about 1280 and about 390. `chantz gui` was not run. This slice skips registry drift, Architecture Map, Interface Console, and desk openers.

---

## Findings

| Sev | ID | Agent | Defect | Evidence | Propose | Status |
|-----|-----|-------|--------|----------|---------|--------|
| P2 | GUI-AK-003 | a11y-keyboard | Skip to content measured 41px tall (135×41) at 390 and 1280. Other buttons, selects, inputs, and the footer link were at least 44px. | Isolated Chrome, `http://127.0.0.1:5183/`, `.skip` box before the CSS change. | `min-height: 44px` on `.skip`. | fixed |

No P0 or P1. Dead controls, false saved state, missing names, keyboard traps, page-level horizontal scroll, and piano sound were not found.

---

## Sensors / Outcomes / GUI-SL

| Check | Result | Notes |
|-------|--------|-------|
| `chantz gui check` (T0) | skipped | Operator slice: do not run `chantz gui` against the launcher. |
| `chantz gui outcomes` (T1) | skipped | Same. |
| `chantz gui a11y` | skipped | Product check was in the browser, not pa11y on :8768. |
| `chantz gui extract` | skipped | Do not restyle onto launcher chrome. |
| Chrome allowlist | n/a | GuideRec keeps its own colors. No `--cm-*` import. |
| GUI-SL findings | none | Habit text stays in front. Piano marks show the scale. Focus ring is 3px on `:focus-visible`. |

---

## Surface matrix (product)

| Surface | URL / path | Status | Notes |
|---------|------------|--------|-------|
| Setups | http://127.0.0.1:5183/ | pass | Logic Pro and Bandlab, New and Existing, Open on Home, Home 2, and Mobile (Bandlab). |
| Best Habits | same, Best Habits tab | pass | Record, Create, Mix, Master. Mix Next stays disabled until Vocal, Beat, or Both. |
| Create piano | Key and scale step | pass | One image, role img, name includes the scale. C Major spells C D E F G A B. A Minor pentatonic spells A C D E G and survives reload. Marks move. First white key stays C. No key buttons and no sound. Does not cover the footer at 1280 or 390. |
| Gear | Gear tab | pass | Host field, add plugin, two-click Remove (Remove, then Remove now). |
| Export | Export tab | pass | Download this setup, Download all setups, Import JSON, two-click Reset this browser. |
| Footer | page foot | pass | Created By ChantzMedia opens https://chantzmedia.com in a new tab. |
| Saved status | `#status` | pass | Default "Saved on this Mac." After `localStorage.setItem` throws: "Browser blocked storage. Export a copy before you close this tab." |

---

## Applied (fix only)

| Attempt | Change | Verify | Result |
|---------|--------|--------|--------|
| 1 | `.skip` min-height 44px in `src/styles.css` | Reload at 390: skip box 135×44. No control under 44px. No horizontal scroll. Piano clear of the footer. Same at 1280. Tab shows a 3px focus ring on the skip link and on Best Habits. `npm test` 15 pass. `npm run build` exit 0. `chantz verify require` PASS. | fixed |

---

## Residual / next

- Launcher Console, Architecture Map, registry, and desk openers stay out of this pass.
- Locked copy, seed gear, storage keys, and the C-to-C piano were not changed.

## Stack notes

- S0 / L0: local operator tool. No accounts, secrets, or deploy.
- INTERFACE_ORCHESTRATOR: not in scope.
- Peers (graph / eval / interfaces / consistency): not run. No deletes.
