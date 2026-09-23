# GuideRec

Local Best Habits walkthrough for one setup at a time. The same generic guide for every host. Plugins you type stay inventory.

The folder is still `StackRig`.

Code lives here: `~/ChantzMedia/ChantzMediaProjects/StackRig`  
Launcher used: **1.4.2** at `~/ChantzMedia/ChantzMediaLauncher` (`VERSION.txt`). Not the Desktop copy.  
Open: `Open StackRig.command` or `npm run dev`  
App: http://127.0.0.1:5183/

Shipped setups: **Home**, **Home 2**, and **Mobile (Bandlab)**. Home keeps the MKZ Logic Home gear (`stk-mkz-logic-home`). Mobile starts with empty gear.

Data stays in this browser (`localStorage` key `chantzmedia.guiderec.v1`) plus JSON you export. If that key is empty and `chantzmedia.stackrig.v1` is present, it is copied forward once. No account, no cloud, no plugin scan. The dev server binds loopback only.

## Launcher (read-only)

Source of truth: `/Users/kenzi/ChantzMedia/ChantzMediaLauncher`

Do not modify the launcher unless you say: `I give permission to modify ChantzMediaLauncher`

This slice does not enroll a product family, router, or activation phrase.

## Build state

GrokBuild writes handoff notes in `build-state.json`.
