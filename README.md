# GuideRec

GuideRec is a local practice guide for recording. You pick the setup you are using, then walk through Record, Create, Mix, and Master one step at a time. The steps are the same for every setup. They are habits, not a mix recipe and not a plugin manual.

## What you do

1. Choose the host. The shipped choices are Logic Pro and Bandlab. You can type another host name.
2. Open a saved setup, or make a new one. A new setup needs a name. Plugin names are optional.
3. Follow Best Habits.
   - **Record** covers mic distance, gain with headroom, and a dry take.
   - **Create** shows the notes in the key and scale you pick. The piano is two octaves, C to C. Marks move when you change key or scale. The keys do not play.
   - **Mix** asks whether you are working on the vocal, the beat, or both, then shows the first moves for that choice.
   - **Master** is about finishing the mix before you chase loudness.
4. Gear is only a list of what that setup owns. Adding or removing a plugin does not change the guide.
5. Export downloads that setup, or every setup, as a JSON file you keep next to the session. Import puts a file back on this Mac.

Three setups ship with the app: **Home**, **Home 2**, and **Mobile (Bandlab)**. Home keeps one Logic inventory. Home 2 is a second copy of that list. Mobile starts with no plugins.

## On this Mac

On this Mac, local development stays at http://127.0.0.1:5183/. The phone link is https://guiderec.pages.dev/. There is no account. What you change is saved in that browser, on that device.

Open it with `Open GuideRec.command`, or from the project folder:

```bash
npm install
npm run dev
```

The app lives in `ChantzMediaProjects/GuideRec`. New exports use the id `GuideRec.v1`. An export saved under the earlier name still opens. The browser key is `chantzmedia.guiderec.v1`.
