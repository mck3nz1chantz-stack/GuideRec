<!-- GrokBuild handoff — generated 2026-09-23. Agent enriched for GuiPass. -->
<!-- Regenerate: node ~/.grok/skills/grokbuild-handoff/scripts/generate-handoff.mjs -->

# HANDOFF PROMPT — GuideRec

**Copy everything below the line into a new chat.**

---

You are operating in ChantzMedia GrokBuild for GuideRec. This is a first-party studio tool, not a client site. This session is a **GuiPass** on the product UI.

Load, do not rewrite: `GrokBuild/GROKBUILD_CORE.md` · `BLOAT_PREVENTION.md` · `docs/final/ops/STUDIO_SCRATCH.md` · `PERMISSIONS.md` · `skills/gui-desk/SKILL.md` · `skills/gui-desk/references/failure-taxonomy.md`. Those paths are under `~/ChantzMedia/ChantzMediaLauncher/`. This project has no `GrokBuild/` folder of its own.

Read `VERSION.txt` before you trust a launcher version. Live launcher is 1.4.2 at `~/ChantzMedia/ChantzMediaLauncher`. Do not use `~/Desktop/ChantzMediaLauncher`. Do not modify the launcher. Do not add a desk. Do not enroll AppHub, `MODULE_ROUTER`, or `ACTIVATION_PROMPTS`. Do not run MediaLaunch or SiteScaffold. Do not run `chantz init`. No accounts, cloud, plugin scan, DAW control, or AI mix advice.

## Deploy posture

Local only. Loopback http://127.0.0.1:5183. No preview or production deploy. No AppHub, MODULE_ROUTER, or ACTIVATION_PROMPTS enrollment unless the operator asks.

No deploy. The project is not a git repo. Do not run `git init`.

## Locked decisions (do not re-do Phase 1/2 unless user explicitly reopens)

Folder stays StackRig. Product name stays GuideRec. Local only at 127.0.0.1:5183. No launcher edits, no AppHub, no new desk. Best Habits is one shared walkthrough for every setup. The operator rejected per-setup checklists and the Newbie/Advanced split. Plugin names stay inventory. They do not drive the guide. Do not invent plugins, mics, or a Bandlab chain.

The Create piano is one image, two octaves, C to C. C stays on the left. Changing Key or Scale moves the marks. The note line still spells from the root. C Major is C D E F G A B. A Minor pentatonic is A C D E G. The keys do not play. No MIDI and no sound.

## Tech stack

Vite 7 + vanilla JS. No React. Package 0.3.0. Data in localStorage `chantzmedia.guiderec.v1` (one-time copy from `chantzmedia.stackrig.v1`). JSON import/export schema id StackRig.v1. Key, scale, and genre live on the setup. Mix focus lives on the session. Bind 127.0.0.1:5183 strictPort. Files: `src/seed.js`, `src/store.js`, `src/main.js`, `src/styles.css`. Piano image: `public/keyboard-octave.png`.

## Progress

| Slice | Name | Status | Notes |
|-------|------|--------|-------|
| v0.1 | StackRig local rig checklist | done | Seed MKZ Logic Home, four modes, checks persist, rig editor, JSON import/export. npm test 8 pass. chantz verify pass on npm run build. |
| focus | GuideRec focus pass | done | GuideRec name, plain step titles, Home / Home 2 / Mobile (Bandlab), newbie and advanced on the same steps. npm test 14 pass. Browser-checked desktop and 390. Operator then asked to drop per-setup checklists. |
| habits | Best Habits walkthrough | done | Shared Record, Create, Mix, and Master screens. Key and scale note layout. Mix focus Vocal, Beat, or Both. npm test 14 pass. Browser-checked at 1280 and 390. |
| keyboard | Create keyboard overlay | done | Two octaves, C to C, one image. Marks from scaleNotes(). C stays on the left. No sound, no MIDI. Browser-checked at 1280 and 390. npm test 15 pass. chantz verify pass. |
| guipass | GuiPass on the GuideRec product UI | next | Audit Setups, Best Habits, Gear, and Export in the app. Not Console, not Arch Map, not a new launcher desk. |

**Current slice:** Create keyboard overlay (shipped)
**Next slice:** GuiPass on the GuideRec product UI

## Git snapshot (2026-09-23)

This project is not a git repo. Do not run `git init`. There is no branch and no commit history.

## Critical notes (gotchas)

- Live launcher is 1.4.2 at ~/ChantzMedia/ChantzMediaLauncher. Read VERSION.txt. Do not use ~/Desktop/ChantzMediaLauncher.
- Do not modify the launcher. Do not enroll a product family. Do not run MediaLaunch or SiteScaffold.
- Best Habits is generic music practice. Do not branch the guide on which plugins a setup owns.
- Home still stores the operator's real Logic gear in seed data. Keep that inventory. Do not turn those names into required steps.
- Mobile (Bandlab) stays an empty-gear setup with host Bandlab. Do not copy the Logic plugin list into it.
- Storage key is chantzmedia.guiderec.v1. Keep it. Do not add a third key.
- Stored mode id for the creative process stays create. Screen word is Create.
- Create key and scale already persist on the setup. scaleNotes() in src/seed.js is the spelling source. C Major is C D E F G A B. A Minor pentatonic is A C D E G. Spell with C C# D D# E F F# G G# A A# B only.
- Create shows one piano image, two octaves from C to C. The selected key and scale move the marks. The note line still spells from the root. Still no MIDI and no sound. The keys are not buttons.
- GuiPass target is this app at http://127.0.0.1:5183/. Skip launcher-only checks: registry drift, Map versus Console, and desk openers. Do not restyle GuideRec onto launcher chrome tokens.
- Two-click delete is intentional. Mix Next stays disabled until Vocal, Beat, or Both is chosen. "Saved on this Mac." must not show when the browser blocked storage.

## Open issues / blockers

- No filed GUI defects yet. This chat runs the pass and writes what it finds.

## Key paths

- /Users/kenzi/ChantzMedia/ChantzMediaProjects/StackRig
- src/seed.js
- src/store.js
- src/main.js
- src/styles.css
- public/keyboard-octave.png
- docs/drafts/app-spec.md
- build-state.json
- HANDOFF_STATE.json
- /Users/kenzi/ChantzMedia/ChantzMediaLauncher/VERSION.txt
- /Users/kenzi/ChantzMedia/ChantzMediaLauncher/GrokBuild/GROKBUILD_CORE.md
- /Users/kenzi/ChantzMedia/ChantzMediaLauncher/docs/final/ops/STUDIO_SCRATCH.md
- /Users/kenzi/ChantzMedia/ChantzMediaLauncher/skills/gui-desk/SKILL.md

## Local dev

```bash
cd ~/ChantzMedia/ChantzMediaProjects/StackRig
npm test
npm run dev
```

App: http://127.0.0.1:5183/ (`Open StackRig.command` or `npm run dev`). State file: `HANDOFF_STATE.json`.

## This slice — GuiPass

Audit the GuideRec screens a person actually uses. Write the report in this project at `docs/drafts/gui-report.md`. Use the gui-desk report table. Sign off GUI-CLEARED, GUI-CLEARED-WITH-NOTES, CONDITIONAL, or BLOCKED.

### Surfaces

- Setups: host Logic Pro and Bandlab, New and Existing, open Home, Home 2, and Mobile (Bandlab).
- Best Habits: Record, Create, Mix, Master. On Create, switch Key and Scale, including C Major and A Minor pentatonic, then reload.
- Gear: host, plugin add and remove, two-click delete.
- Export: download and import controls. Footer link.
- Phone and desktop, about 390 and about 1280. No horizontal scroll. Real controls at least 44px. Labels and a focus ring. The piano does not cover the footer.

### Use these checks

- Dead controls: a button or link that does nothing or goes to the wrong place.
- False saved state: the status says saved when storage failed.
- Keyboard and focus: tab order, the screen tabs, selects, and buttons. The piano is a picture with an accessible name. It is not a set of keys that play.
- Missing actions: something the screen claims that the operator cannot do.
- Slop: decorative noise that hides the habit. Do not import launcher `--cm-*` tokens. Do not restyle the app.

### Leave alone

Registry drift, Architecture Map, Interface Console, and desk openers. Do not run `chantz gui` against the launcher. Do not add a desk-prompts row.

### Fixes

Fix a defect when you can show it in the browser: a dead control, a false saved state, a missing name or focus ring, a keyboard trap, page-level horizontal scroll, a real control under 44px, or the piano playing sound. Leave locked copy, seed gear, storage keys, and the C-to-C piano as they are.

After any code change: `npm test` and `npm run build` exit 0. Re-check the changed screen at about 1280 and about 390. Then `chantz verify run . --preset=auto --goal="GuideRec GuiPass" --apply` and `chantz verify require .`. Update `build-state.json` and `HANDOFF_STATE.json` with the sign-off.

Begin the GuiPass.

---

**END OF HANDOFF PROMPT**
