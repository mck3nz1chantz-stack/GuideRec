# AppSpec — GuideRec

**Path:** studio-scratch · AppHub family studio · **Project:** `~/ChantzMedia/ChantzMediaProjects/GuideRec`  
**Folder:** `GuideRec` · **Product name:** GuideRec  
**Not:** client MediaLaunch · SiteScaffold · PlantForge · StallStart · a new launcher desk

## Goal

A local Best Habits walkthrough for one recording setup at a time. The guide is the same generic music practice for every setup. Plugins the operator types are inventory. They do not change the guide.

## Acceptance

- User-facing name is GuideRec in the document title, the header, `Open GuideRec.command`, and this project’s README. The folder on disk is `GuideRec`.
- Vite serves `127.0.0.1:5183` only.
- The first view is the host and the setups. Seeded hosts are Logic Pro and Bandlab. A new host is a name the operator types. There is no DAW catalog.
- New or Existing comes next. Existing opens a saved setup on Best Habits. New asks for a setup name, then optional plugin names one at a time, then Next opens Best Habits.
- Add, select, and rename stay on the setups screen. Delete asks for a second click and stays on Gear, off the walkthrough.
- Home (`stk-mkz-logic-home`) keeps the operator’s plugin list. Home 2 is that list duplicated, with its own session. Mobile (Bandlab) keeps an empty plugin list and the host Bandlab. Logic plugin names are not copied onto Mobile.
- Best Habits is one shared walkthrough. Back, Next, and a count such as `2 of 3`. The same sentences for every setup. No Newbie/Advanced switch. No plugin wall. No per-setup step editor on the main path.
- Screen labels: Record, Create, Mix, Master. Stored mode ids stay `record`, `create`, `mix`, `master`.
- Record covers mic distance, gain with headroom, and a dry take.
- Create has key and scale dropdowns, one shared piano image, and the note names of that scale in that key. The piano is two octaves, C to C, like a controller. C stays on the left. Changing the key or the scale moves the marks. Notes outside the scale stay visible. The note line still spells from the root: C Major is C D E F G A B, and A Minor pentatonic is A C D E G. The choice survives reload. The keys do not play. No MIDI and no sound.
- Mix asks Vocal, Beat, or Both, stores the choice on the session, then shows that path’s first moves.
- Master is finish the mix, then turn the loudness down if the low end pumps or the vocal lisps.
- Habit text does not name Ozone, Nectar, Waves, VMS, Volt, VSX, or CLA. Those names may remain in Home’s inventory.
- Gear is a quiet inventory screen, not the guide. Changing screens does not delete a plugin.
- Phone and desktop. No horizontal scroll. Tap targets at least 44px. Buttons and fields have visible labels and a focus ring. Habit text does not cover the footer.
- Footer: `© {year} ChantzMedia. All rights reserved.` then linked `Created By ChantzMedia` → https://chantzmedia.com
- Storage key is `chantzmedia.guiderec.v1`. If it is empty and an older browser save exists, copy that data forward once. New files use schema id `GuideRec.v1`. An older `StackRig.v1` export still opens.
- `npm test` and `npm run build` exit 0.

## Invariants

- The walkthrough is shared data. A setup does not own a second checklist.
- Switching process, setup, or screen never deletes a plugin or another setup’s key, scale, genre, or mix choice.
- Seed names match the operator list. Do not add plugins, mics, or a Bandlab chain.
- No accounts, cloud, DAW control, plugin scanning, marketplace, or AI mix advice.
- App code stays under this project. Do not enroll MODULE_ROUTER, ACTIVATION_PROMPTS, or a new desk in this slice.
- User-entered and imported strings render as text.
- New files use schema id `GuideRec.v1`. An older `StackRig.v1` export still opens.

## Security

- No secrets, accounts, payments, or analytics.
- Dev server binds `127.0.0.1` only. No LAN host.
- Persistence is localStorage on this browser profile. Import accepts JSON text, rejects other schemas, and does not eval it.
- No third-party scripts or CDN fonts.

## Non-goals

- A second checklist per setup, a Newbie/Advanced switch, or a plugin wall on the guide.
- A catalog of DAWs, or genres as a required product list.
- Sound, MIDI, or a separate piano picture for every key and scale.
- Marketplace, social, plugin auto-detect, DAW control, accounts, payments.
- A Bandlab plugin chain, or any plugin the operator has not added.
- VSX room automation and AI mix advice.
- A launcher product family, skill, or router entry (operator enrolls later).
- Client Hub, SiteScaffold, MediaLaunch, or a production deploy.
