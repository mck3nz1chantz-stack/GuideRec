import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { HABITS, KEYBOARD, KEYS, MIX_FOCUS, MODES, SCALES, habitsFor, keyboardLayout, scaleNotes } from "../src/seed.js";
import {
  LEGACY_KEY,
  STORAGE_KEY,
  activeSession,
  activeStack,
  addPlugin,
  applyImport,
  blankStack,
  createStack,
  duplicateStack,
  exportLibrary,
  exportRig,
  loadState,
  parseRig,
  piecesForBoard,
  seedState,
  setActiveStack,
  setGenre,
  setKeyScale,
  setMixFocus,
  setMode,
  tone,
  updatePlugin,
} from "../src/store.js";

const PLUGIN_NAMES = [
  "RX",
  "Ozone 10 Standard",
  "Nectar 4",
  "CLA-76",
  "Manny Reverb",
  "Manny Delay",
  "Abbey Road Saturator",
  "F6",
  "OneKnob Phatter",
  "OneKnob Pumper",
  "Vocal Rider",
  "Clarity Vx",
  "Brauer Motion",
  "CLA Effects",
  "CLA Vocals",
  "Waves Tune",
  "Sibilance",
  "StudioRack",
  "Submarine",
  "Channel EQ",
  "Compressor (Vintage FET/VCA/Platinum)",
  "DeEsser",
  "Pitch Correction",
  "Tape Delay",
  "ChromaVerb",
  "Exciter",
  "Direction Mixer",
  "Noise Gate",
  "Adaptive Limiter",
  "Transit",
];

const FORBIDDEN = ["FabFilter", "Soothe", "Valhalla", "Serum", "Pro-Q", "Auto-Tune", "Soundtoys", "Ozone 11"];

const HABIT_BANNED = ["Ozone", "Nectar", "Waves", "VMS", "Volt", "VSX", "CLA", "FabFilter", "ML-1"];

function memory() {
  const box = new Map();
  return {
    getItem: (key) => (box.has(key) ? box.get(key) : null),
    setItem: (key, value) => box.set(key, String(value)),
  };
}

test("seed rig is the operator list and nothing else", () => {
  const state = seedState();
  const stack = state.stacks[0];
  assert.equal(stack.name, "Home");
  assert.equal(stack.id, "stk-mkz-logic-home");
  assert.equal(stack.daw.name, "Logic Pro");
  assert.deepEqual(stack.daw.modes, ["record", "create", "mix", "master"]);
  assert.deepEqual(
    stack.hardware.map((item) => item.name),
    ["UA Volt 2", "Slate ML-1 + VMS"],
  );
  assert.equal(stack.monitor.name, "Slate VSX");
  assert.deepEqual(stack.monitor.modes, ["mix"]);
  assert.deepEqual(stack.plugins.map((item) => item.name), PLUGIN_NAMES);
  assert.equal(new Set(PLUGIN_NAMES).size, 30);
  const blob = JSON.stringify(stack);
  for (const word of FORBIDDEN) assert.equal(blob.includes(word), false);
});

test("mode membership follows the saved gear", () => {
  const stack = seedState().stacks[0];
  const modes = Object.fromEntries(stack.plugins.map((item) => [item.name, item.modes.join(",")]));
  assert.equal(modes["Ozone 10 Standard"], "master");
  assert.equal(modes["Nectar 4"], "create");
  assert.equal(modes.Transit, "mix");
  assert.equal(modes["CLA-76"], "mix");
  assert.equal(modes.RX, "mix");
  assert.equal(modes["CLA Vocals"], "");
  assert.equal(modes["Adaptive Limiter"], "");
  assert.deepEqual(
    stack.hardware.find((item) => item.name === "UA Volt 2").modes,
    ["record"],
  );
  assert.deepEqual(
    stack.hardware.find((item) => item.name === "Slate ML-1 + VMS").modes,
    ["record", "mix"],
  );
});

test("mix chain keeps VSX last and leaves other modes dim", () => {
  const stack = seedState().stacks[0];
  const on = piecesForBoard(stack, "mix")
    .filter((item) => tone(item, "mix") === "on")
    .map((item) => item.name);
  assert.equal(on[0], "Logic Pro");
  assert.equal(on.at(-1), "Slate VSX");
  assert.ok(on.indexOf("Waves Tune") < on.indexOf("CLA-76"));
  assert.equal(on.includes("Ozone 10 Standard"), false);
  assert.equal(on.includes("Nectar 4"), false);
  assert.equal(on.includes("CLA Vocals"), false);
  assert.equal(on.includes("Adaptive Limiter"), false);
  const ozone = stack.plugins.find((item) => item.name === "Ozone 10 Standard");
  assert.equal(tone(ozone, "mix"), "dim");
  assert.equal(tone(ozone, "master"), "on");
});

test("shared habits and scale notes stay generic", () => {
  assert.deepEqual(MODES.map((mode) => mode.id), ["record", "create", "mix", "master"]);
  assert.equal(MODES.find((mode) => mode.id === "create").label, "Create");
  assert.equal(MODES.some((mode) => mode.label === "Ideas"), false);
  assert.deepEqual(
    habitsFor("record").map((habit) => habit.title),
    ["Mic", "Level", "Dry"],
  );
  assert.deepEqual(
    habitsFor("create").map((habit) => habit.title),
    ["Key and scale", "Arrangement", "Genre"],
  );
  assert.deepEqual(
    habitsFor("mix").map((habit) => habit.title),
    ["Vocal, beat, or both", "Gain", "EQ", "Compress", "Saturate", "Second compressor", "Effects", "Headroom"],
  );
  assert.deepEqual(
    habitsFor("master").map((habit) => habit.title),
    ["Finish the mix", "Limiter", "If it pumps or lisps"],
  );
  assert.equal(new Set(HABITS.map((habit) => habit.id)).size, HABITS.length);
  assert.match(habitsFor("record")[0].lines.join(" "), /few inches off the mic, slightly off-axis/);
  assert.equal(
    habitsFor("record").find((habit) => habit.id === "rec-dry").lines.join(" "),
    "Record dry. Headphone reverb is not printed. Mix plugins are not printed.",
  );
  assert.match(
    habitsFor("create").find((habit) => habit.id === "cre-form").lines.join(" "),
    /Intro, verse, chorus, and out/,
  );
  assert.match(habitsFor("record").find((habit) => habit.id === "rec-level").lines.join(" "), /-12 to -6 dBFS/);
  assert.match(habitsFor("record").find((habit) => habit.id === "rec-level").lines.join(" "), /-18 dBFS/);
  assert.match(habitsFor("mix").find((habit) => habit.id === "mix-head").lines.join(" "), /around -6 dBFS/);
  assert.match(habitsFor("mix").find((habit) => habit.id === "mix-fx").lines.join(" "), /One shared delay and one shared reverb/);
  assert.match(habitsFor("master").find((habit) => habit.id === "mas-limit").lines.join(" "), /-14 LUFS/);
  assert.match(habitsFor("master").at(-1).lines.join(" "), /turn the limiter down/);
  assert.match(MIX_FOCUS.find((item) => item.id === "both").text, /shared delay and reverb/);
  assert.match(MIX_FOCUS.find((item) => item.id === "vocal").text, /Do not stack vocal suites/);
  assert.match(MIX_FOCUS.find((item) => item.id === "beat").text, /drums and bass first/);
  const blob = `${JSON.stringify(HABITS)} ${JSON.stringify(MIX_FOCUS)} ${JSON.stringify(MODES)}`;
  for (const word of HABIT_BANNED) assert.equal(blob.includes(word), false, word);
  for (const name of PLUGIN_NAMES) assert.equal(blob.includes(name), false, name);
  assert.deepEqual(scaleNotes("C", "major"), ["C", "D", "E", "F", "G", "A", "B"]);
  assert.deepEqual(scaleNotes("A", "minor-pentatonic"), ["A", "C", "D", "E", "G"]);
  assert.deepEqual(scaleNotes("D#", "major-pentatonic"), ["D#", "F", "G", "A#", "C"]);
  assert.deepEqual(scaleNotes("F#", "natural-minor"), ["F#", "G#", "A", "B", "C#", "D", "E"]);
  for (const key of KEYS) {
    for (const scale of SCALES) {
      const notes = scaleNotes(key, scale.id);
      assert.equal(notes.length, scale.intervals.length);
      for (const note of notes) assert.ok(KEYS.includes(note), note);
    }
  }
});

test("the piano starts on C for two octaves and marks the scale", () => {
  const png = readFileSync(new URL("../public/keyboard-octave.png", import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(KEYBOARD.whiteCount, KEYBOARD.octaves * 7 + 1);
  assert.equal(png.readUInt32BE(16), KEYBOARD.whiteCount * KEYBOARD.whiteWidth);
  assert.equal(png.readUInt32BE(20), KEYBOARD.whiteHeight);
  const major = keyboardLayout("C", "major");
  assert.equal(major.keys.length, 25);
  assert.equal(major.keys[0].note, "C");
  assert.equal(major.keys.at(-1).note, "C");
  assert.equal(major.imageX, 0);
  assert.deepEqual(
    major.keys.filter((item) => item.inScale).map((item) => item.note),
    ["C", "D", "E", "F", "G", "A", "B", "C", "D", "E", "F", "G", "A", "B", "C"],
  );
  assert.equal(major.keys.some((item) => item.black && item.inScale), false);
  const minor = keyboardLayout("A", "minor-pentatonic");
  assert.equal(minor.keys[0].note, "C");
  assert.deepEqual(
    minor.keys.filter((item) => item.inScale).map((item) => item.note),
    ["C", "D", "E", "G", "A", "C", "D", "E", "G", "A", "C"],
  );
  assert.deepEqual(scaleNotes("A", "minor-pentatonic"), ["A", "C", "D", "E", "G"]);
  for (const key of KEYS) {
    for (const scale of SCALES) {
      const layout = keyboardLayout(key, scale.id);
      const pcs = new Set(scaleNotes(key, scale.id));
      assert.equal(layout.keys[0].note, "C");
      assert.equal(layout.keys.at(-1).note, "C");
      assert.equal(layout.keys.length, KEYBOARD.octaves * 12 + 1);
      for (const item of layout.keys) {
        assert.equal(item.inScale, pcs.has(item.note));
        assert.equal(item.black, item.note.includes("#"));
        assert.ok(item.x >= 0 && item.x + item.w <= 1.0001, item.note);
      }
      assert.equal(layout.windowLeft, 0);
      assert.equal(layout.windowWidth, layout.imageWidth);
    }
  }
});

test("key, scale, and mix focus survive a reload", () => {
  let state = setKeyScale(setGenre(seedState(), "ballad"), "F#", "natural-minor");
  state = setMixFocus(state, "beat");
  state = setMode(state, "record");
  assert.equal(activeSession(state).mixFocus, "beat");
  assert.equal(activeStack(state).plugins.length, 30);
  const store = memory();
  store.setItem(STORAGE_KEY, JSON.stringify(state));
  const loaded = loadState(store);
  const home = loaded.stacks[0];
  assert.equal(home.key, "F#");
  assert.equal(home.scale, "natural-minor");
  assert.equal(home.genre, "ballad");
  assert.deepEqual(scaleNotes(home.key, home.scale), ["F#", "G#", "A", "B", "C#", "D", "E"]);
  assert.equal(activeSession(loaded).mixFocus, "beat");
  assert.equal(home.plugins.length, 30);
  loaded.sessions[0].mixFocus = "nope";
  loaded.stacks[0].key = "H";
  loaded.stacks[0].scale = "dorian";
  store.setItem(STORAGE_KEY, JSON.stringify(loaded));
  const cleaned = loadState(store);
  assert.equal(cleaned.stacks[0].key, "C");
  assert.equal(cleaned.stacks[0].scale, "major");
  assert.equal(activeSession(cleaned).mixFocus, "");
  assert.equal(cleaned.stacks[0].plugins.length, 30);
});

test("import merges a rig and rejects other files", () => {
  let state = createStack(seedState(), "Client vocal session");
  const otherId = state.activeStackId;
  const renamed = structuredClone(exportRig(seedState(), () => "2026-09-22T00:00:00.000Z"));
  assert.equal(renamed.schema, "GuideRec.v1");
  const older = structuredClone(renamed);
  older.schema = "StackRig.v1";
  assert.equal(parseRig(JSON.stringify(older)).kind, "rig");
  renamed.stack.name = "MKZ Logic Home renamed";
  renamed.stack.plugins.push({
    id: "pl-trap",
    name: "<script>alert(1)</script>",
    group: "other",
    doNotInvent: true,
  });
  const applied = applyImport(state, parseRig(JSON.stringify(renamed)));
  assert.equal(applied.error, "");
  const home = applied.state.stacks.find((stack) => stack.id === "stk-mkz-logic-home");
  assert.equal(home.name, "MKZ Logic Home renamed");
  assert.equal(home.plugins.at(-1).name, "<script>alert(1)</script>");
  assert.equal(home.plugins.at(-1).doNotInvent, true);
  assert.equal(tone(home.plugins.at(-1), "mix"), "block");
  assert.ok(applied.state.stacks.some((stack) => stack.id === otherId));
  assert.match(parseRig("nope").error, /JSON/);
  assert.ok(parseRig(JSON.stringify({ schema: "nope" })).error);
});

test("library roundtrip and do-not-invent flag", () => {
  let state = seedState();
  const nectar = state.stacks[0].plugins.find((item) => item.name === "Nectar 4");
  state = updatePlugin(state, nectar.id, { doNotInvent: true });
  const flagged = state.stacks[0].plugins.find((item) => item.id === nectar.id);
  assert.equal(flagged.owned, false);
  assert.deepEqual(flagged.modes, []);
  state = addPlugin(state, { name: "Soothe", group: "other", doNotInvent: true });
  assert.equal(seedState().stacks[0].plugins.some((item) => item.name === "Soothe"), false);
  const file = exportLibrary(state, () => "2026-09-22T00:00:00.000Z");
  const back = applyImport(seedState(), parseRig(JSON.stringify(file)));
  assert.equal(back.state.stacks[0].plugins.some((item) => item.name === "Soothe"), true);
});

test("blank names do nothing and a new setup invents no gear", () => {
  const seeded = seedState();
  assert.equal(createStack(seeded, "   "), seeded);
  const blank = blankStack("Phone sketch");
  assert.equal(blank.daw.name, "");
  assert.equal(blank.monitor.name, "");
  assert.equal(blank.plugins.length, 0);
  assert.equal(blank.steps.length, 0);
  assert.equal(piecesForBoard(blank, "mix").length, 0);
  const copy = duplicateStack(seeded, seeded.activeStackId);
  assert.notEqual(copy.activeStackId, seeded.activeStackId);
  assert.equal(copy.stacks.length, seeded.stacks.length + 1);
  assert.equal(copy.stacks.at(-1).plugins.length, 30);
  assert.ok(activeSession(copy));
  assert.deepEqual(activeSession(copy).checkedStepIds, []);
  assert.equal(activeSession(copy).mixFocus, "");
});

test("ships Home, Home 2, and Mobile without Logic plugins on mobile", () => {
  const state = seedState();
  assert.deepEqual(
    state.stacks.map((stack) => stack.name),
    ["Home", "Home 2", "Mobile (Bandlab)"],
  );
  const home = state.stacks[0];
  const home2 = state.stacks[1];
  const mobile = state.stacks[2];
  assert.equal(home2.id, "stk-home-2");
  assert.deepEqual(
    home2.plugins.map((item) => item.name),
    home.plugins.map((item) => item.name),
  );
  assert.notEqual(home2.plugins[0].id, home.plugins[0].id);
  assert.equal(home2.plugins.length, 30);
  const homeSession = state.sessions.find((session) => session.stackId === home.id);
  const home2Session = state.sessions.find((session) => session.stackId === home2.id);
  assert.notEqual(home2Session.id, homeSession.id);
  assert.deepEqual(home2Session.checkedStepIds, []);
  assert.equal(home2Session.mixFocus, "");
  assert.equal(mobile.plugins.length, 0);
  assert.equal(mobile.hardware.length, 0);
  assert.equal(mobile.daw.name, "Bandlab");
  assert.equal(mobile.monitor.name, "");
  assert.equal(mobile.steps.length, 0);
  assert.equal(home.steps.length, 0);
  const blob = JSON.stringify(mobile);
  for (const name of PLUGIN_NAMES) assert.equal(blob.includes(name), false, name);
  for (const word of ["Logic Pro", "UA Volt", "Slate", "VSX", "Ozone", "Nectar", "Waves", "VMS"]) {
    assert.equal(blob.includes(word), false, word);
  }
  assert.equal(habitsFor("record")[0].title, "Mic");
  assert.equal(habitsFor("record").length, 3);
});

test("key and plugins stay on the setup that owns them", () => {
  let state = setKeyScale(seedState(), "A", "minor-pentatonic");
  state = setGenre(state, "soul");
  state = setMixFocus(state, "both");
  const home = () => state.stacks.find((stack) => stack.id === "stk-mkz-logic-home");
  const home2 = () => state.stacks.find((stack) => stack.id === "stk-home-2");
  assert.equal(home().plugins.length, 30);
  assert.equal(home().key, "A");
  assert.equal(home().scale, "minor-pentatonic");
  assert.equal(home().genre, "soul");
  assert.deepEqual(scaleNotes(home().key, home().scale), ["A", "C", "D", "E", "G"]);
  assert.equal(home2().key, "C");
  assert.equal(home2().scale, "major");
  assert.equal(home2().genre, "");
  assert.equal(home2().plugins.length, 30);
  assert.equal(activeSession(state).mixFocus, "both");
  state = setMode(state, "master");
  assert.equal(activeSession(state).mixFocus, "both");
  assert.equal(activeStack(state).plugins.length, 30);
  state = setActiveStack(state, "stk-mobile-bandlab");
  assert.equal(activeStack(state).plugins.length, 0);
  assert.equal(activeSession(state).mixFocus, "");
  state = setActiveStack(state, "stk-mkz-logic-home");
  assert.equal(activeSession(state).mixFocus, "both");
  assert.equal(activeStack(state).key, "A");
  assert.equal(activeStack(state).plugins.length, 30);
});

test("legacy storage copies forward once", () => {
  const store = memory();
  store.setItem(STORAGE_KEY, "  ");
  store.setItem(
    LEGACY_KEY,
    JSON.stringify({
      schema: "StackRig.v1",
      stacks: [
        {
          id: "stk-mkz-logic-home",
          name: "MKZ Logic Home",
          daw: { id: "daw-logic", name: "Logic Pro", kind: "daw", modes: ["record", "create", "mix", "master"] },
          monitor: { id: "mon-vsx", name: "Slate VSX", kind: "monitor", modes: ["mix"] },
          hardware: [{ id: "hw-volt", name: "UA Volt 2", kind: "hardware", modes: ["record"] }],
          plugins: [{ id: "iz-ozone", name: "Ozone 10 Standard", group: "izotope", vendor: "iZotope", modes: ["master"] }],
        },
      ],
      sessions: [
        {
          id: "ses-untitled",
          name: "Take 1",
          stackId: "stk-mkz-logic-home",
          mode: "record",
          checkedStepIds: ["rec-room", "missing-step"],
          notes: "keep me",
        },
      ],
      activeStackId: "stk-mkz-logic-home",
      activeSessionId: "ses-untitled",
      view: "board",
    }),
  );
  const first = loadState(store);
  assert.equal(first.stacks.find((stack) => stack.id === "stk-mkz-logic-home").name, "Home");
  assert.equal(activeSession(first).notes, "keep me");
  assert.equal(activeSession(first).mixFocus, "");
  assert.equal(first.stacks.find((stack) => stack.id === "stk-home-2").plugins.length, 1);
  assert.deepEqual(first.sessions.find((session) => session.stackId === "stk-home-2").checkedStepIds, []);
  const mobile = first.stacks.find((stack) => stack.name === "Mobile (Bandlab)");
  assert.equal(mobile.plugins.length, 0);
  assert.equal(mobile.hardware.length, 0);
  assert.equal(mobile.daw.name, "Bandlab");
  assert.ok(store.getItem(STORAGE_KEY).trim());
  assert.ok(store.getItem(LEGACY_KEY));
  store.setItem(
    LEGACY_KEY,
    JSON.stringify({
      schema: "StackRig.v1",
      stacks: [{ id: "stk-other", name: "Ignore", daw: { name: "Nope" } }],
      sessions: [],
    }),
  );
  const second = loadState(store);
  assert.equal(second.stacks.some((stack) => stack.name === "Ignore"), false);
  assert.equal(activeSession(second).notes, "keep me");
});

test("a saved guide is not replaced by the old key", () => {
  const store = memory();
  const saved = seedState();
  saved.stacks[0].name = "Kept";
  saved.stacks[0].key = "A";
  saved.stacks[0].scale = "minor-pentatonic";
  store.setItem(STORAGE_KEY, JSON.stringify(saved));
  store.setItem(
    LEGACY_KEY,
    JSON.stringify({
      schema: "StackRig.v1",
      stacks: [{ id: "stk-mkz-logic-home", name: "MKZ Logic Home", daw: { name: "Logic Pro" } }],
      sessions: [],
    }),
  );
  const loaded = loadState(store);
  assert.equal(loaded.stacks[0].name, "Kept");
  assert.equal(loaded.stacks[0].key, "A");
  assert.equal(loaded.stacks[0].scale, "minor-pentatonic");
});

test("an older rig file keeps its gear and skips the plugin checklist", () => {
  const file = exportRig(seedState(), () => "2026-09-22T00:00:00.000Z");
  delete file.stack.steps;
  const applied = applyImport(seedState(), parseRig(JSON.stringify(file)));
  const home = applied.state.stacks.find((stack) => stack.id === "stk-mkz-logic-home");
  assert.equal(home.steps.length, 0);
  assert.equal(home.plugins.length, 30);
  assert.equal(home.plugins.some((item) => item.name === "CLA-76"), true);
  assert.equal(home.plugins.some((item) => item.name === "Ozone 10 Standard"), true);
  const mobile = applied.state.stacks.find((stack) => stack.id === "stk-mobile-bandlab");
  assert.equal(mobile.plugins.length, 0);
  const blob = JSON.stringify(mobile);
  assert.equal(blob.includes("CLA-76"), false);
  assert.equal(blob.includes("Ozone"), false);
  assert.equal(blob.includes("Logic Pro"), false);
});

test("a new setup stores inventory and does not change the habit text", () => {
  let state = createStack(seedState(), "Booth", "Logic Pro");
  state = addPlugin(state, { name: "Room Tone", group: "other" });
  const stack = activeStack(state);
  assert.equal(stack.name, "Booth");
  assert.equal(stack.daw.name, "Logic Pro");
  assert.deepEqual(
    stack.plugins.map((item) => item.name),
    ["Room Tone"],
  );
  assert.equal(stack.steps.length, 0);
  assert.equal(stack.key, "C");
  assert.equal(stack.scale, "major");
  const habits = JSON.stringify(HABITS);
  assert.equal(habits.includes("Room Tone"), false);
  assert.equal(habitsFor("record")[0].lines.join(" ").includes("Room Tone"), false);
  assert.equal(habitsFor("record")[0].title, "Mic");
  const home = state.stacks.find((item) => item.id === "stk-mkz-logic-home");
  assert.equal(home.plugins.length, 30);
  const mobile = state.stacks.find((item) => item.name === "Mobile (Bandlab)");
  assert.equal(mobile.plugins.length, 0);
  assert.equal(JSON.stringify(mobile).includes("Room Tone"), false);
  assert.equal(JSON.stringify(mobile).includes("CLA-76"), false);
  state = setMode(state, "create");
  assert.equal(activeStack(state).plugins.length, 1);
  assert.deepEqual(scaleNotes("C", "major"), ["C", "D", "E", "F", "G", "A", "B"]);
});
