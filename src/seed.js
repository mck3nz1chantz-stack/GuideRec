/** Operator setups. Add a plugin here only when the operator owns it. The guide is shared habits, not a per-setup checklist. */

export const MODE_IDS = ["record", "create", "mix", "master"];

/** Screen order. Stored ids stay record, create, mix, master. */
export const MODE_ORDER = ["record", "create", "mix", "master"];

export const MODES = [
  { id: "record", label: "Record" },
  { id: "create", label: "Create" },
  { id: "mix", label: "Mix" },
  { id: "master", label: "Master" },
];

export const GROUPS = [
  { id: "waves", label: "Waves" },
  { id: "izotope", label: "iZotope" },
  { id: "stock", label: "Stock Logic" },
  { id: "other", label: "Other" },
];

export const SEEDED_HOSTS = ["Logic Pro", "Bandlab"];

export const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const SCALES = [
  { id: "major", label: "Major", intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: "natural-minor", label: "Natural minor", intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: "major-pentatonic", label: "Major pentatonic", intervals: [0, 2, 4, 7, 9] },
  { id: "minor-pentatonic", label: "Minor pentatonic", intervals: [0, 3, 5, 7, 10] },
];

export function scaleNotes(key, scaleId) {
  const root = KEYS.indexOf(key);
  const scale = SCALES.find((item) => item.id === scaleId);
  if (root < 0 || !scale) return [];
  return scale.intervals.map((interval) => KEYS[(root + interval) % 12]);
}

/** One piano diagram, C to C, like a small controller. Labels are drawn in the page. */
export const KEYBOARD = {
  whiteWidth: 80,
  whiteHeight: 280,
  blackWidth: 48,
  blackHeight: 168,
  octaves: 2,
  whiteCount: 15,
};

const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];
const BLACK_CENTER = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 };

export function keyboardLayout(key, scaleId) {
  if (!KEYS.includes(key)) return null;
  const marked = new Set(scaleNotes(key, scaleId));
  const { whiteWidth, blackWidth, whiteHeight, octaves, whiteCount } = KEYBOARD;
  const placed = [];
  const count = octaves * 12 + 1;
  for (let step = 0; step < count; step += 1) {
    const pc = step % 12;
    const octave = Math.floor(step / 12);
    const black = Object.prototype.hasOwnProperty.call(BLACK_CENTER, pc);
    const left = black
      ? (octave * 7 + BLACK_CENTER[pc]) * whiteWidth - blackWidth / 2
      : (octave * 7 + WHITE_PC.indexOf(pc)) * whiteWidth;
    placed.push({
      note: KEYS[pc],
      black,
      inScale: marked.has(KEYS[pc]),
      left,
      width: black ? blackWidth : whiteWidth,
    });
  }
  const imageWidth = whiteCount * whiteWidth;
  return {
    imageWidth,
    imageHeight: whiteHeight,
    windowLeft: 0,
    windowWidth: imageWidth,
    imageX: 0,
    imageW: 1,
    blackSpan: KEYBOARD.blackHeight / whiteHeight,
    keys: placed.map((item) => ({
      note: item.note,
      black: item.black,
      inScale: item.inScale,
      x: item.left / imageWidth,
      w: item.width / imageWidth,
    })),
  };
}

export const MIX_FOCUS = [
  {
    id: "vocal",
    label: "Vocal",
    text: "Clean noise, breaths, and mud before tone. Set the level before effects. Do not stack vocal suites.",
  },
  {
    id: "beat",
    label: "Beat",
    text: "Balance drums and bass first, then the rest of the music. No limiter while the faders still move.",
  },
  {
    id: "both",
    label: "Both",
    text: "Beat balance first, then vocal level against that beat, then one shared delay and one shared reverb. Do not master yet.",
  },
];

/** One walkthrough for every setup. Plugin names never belong in these lines. */
export const HABITS = [
  {
    id: "rec-mic",
    mode: "record",
    order: 1,
    title: "Mic",
    lines: ["A few inches off the mic, slightly off-axis.", "Pop filter if you have one."],
  },
  {
    id: "rec-level",
    mode: "record",
    order: 2,
    title: "Level",
    lines: [
      "Set the gain so the take has headroom and does not clip.",
      "Start quiet, then turn up.",
    ],
  },
  {
    id: "rec-dry",
    mode: "record",
    order: 3,
    title: "Dry",
    lines: ["Record dry.", "Headphone reverb is not printed. Mix plugins are not printed."],
  },
  {
    id: "cre-key",
    mode: "create",
    order: 1,
    title: "Key and scale",
    kind: "scale",
    lines: ["Two octaves, C to C."],
  },
  {
    id: "cre-form",
    mode: "create",
    order: 2,
    title: "Arrangement",
    lines: ["Intro, verse, chorus, and out.", "Do not write the song here. Do not arrange with plugins."],
  },
  {
    id: "cre-genre",
    mode: "create",
    order: 3,
    title: "Genre",
    kind: "genre",
    lines: ["Genre decides density. Plugins do not decide the song."],
  },
  {
    id: "mix-path",
    mode: "mix",
    order: 1,
    title: "Vocal, beat, or both",
    kind: "mix-choice",
  },
  {
    id: "mix-first",
    mode: "mix",
    order: 2,
    title: "First moves",
    kind: "mix-moves",
  },
  {
    id: "mas-finish",
    mode: "master",
    order: 1,
    title: "Finish the mix",
    lines: [
      "Finish the mix. Bounce with headphone correction off. Leave headroom.",
      "Master after the mix, not inside it.",
    ],
  },
  {
    id: "mas-loud",
    mode: "master",
    order: 2,
    title: "If it pumps or lisps",
    lines: [
      "If the low end pumps or the vocal lisps, turn the loudness down.",
      "Do not chase it with another de-esser on the master.",
    ],
  },
];

export function habitsFor(mode) {
  return HABITS.filter((habit) => habit.mode === mode)
    .slice()
    .sort((a, b) => a.order - b.order);
}

const HOST_CHAIN = { record: 0, create: 0, mix: 0, master: 0 };

function piece(partial) {
  return {
    owned: true,
    doNotInvent: false,
    modes: [],
    chain: {},
    note: "",
    vendor: "",
    group: "",
    ...partial,
  };
}

export function seedStack() {
  return {
    id: "stk-mkz-logic-home",
    name: "Home",
    daw: piece({
      id: "daw-logic",
      kind: "daw",
      name: "Logic Pro",
      modes: [...MODE_IDS],
      chain: HOST_CHAIN,
      note: "Host for every mode.",
    }),
    hardware: [
      piece({
        id: "hw-volt",
        kind: "hardware",
        name: "UA Volt 2",
        modes: ["record"],
        chain: { record: 1 },
        note: "Mute, then 48V, Vintage off. Peaks −12 to −8 dBFS.",
      }),
      piece({
        id: "hw-ml1",
        kind: "hardware",
        name: "Slate ML-1 + VMS",
        modes: ["record", "mix"],
        chain: { record: 2, mix: 1 },
        note: "Record: insert 1, source ML-1. Mix: first on the lead.",
      }),
    ],
    monitor: piece({
      id: "mon-vsx",
      kind: "monitor",
      name: "Slate VSX",
      modes: ["mix"],
      chain: { mix: 90 },
      note: "Last on Stereo Out while you listen. Never bounce or print.",
    }),
    plugins: [
      piece({
        id: "iz-rx",
        kind: "plugin",
        group: "izotope",
        vendor: "iZotope",
        name: "RX",
        modes: ["mix"],
        chain: { mix: 4 },
        note: "Lead insert, with Clarity Vx.",
      }),
      piece({
        id: "iz-ozone",
        kind: "plugin",
        group: "izotope",
        vendor: "iZotope",
        name: "Ozone 10 Standard",
        modes: ["master"],
        chain: { master: 1 },
        note: "New session only. Off the mix while faders still move.",
      }),
      piece({
        id: "iz-nectar",
        kind: "plugin",
        group: "izotope",
        vendor: "iZotope",
        name: "Nectar 4",
        modes: ["create"],
        chain: { create: 1 },
        note: "Optional sketch. Not the final vocal chain.",
      }),
      piece({
        id: "wv-cla76",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "CLA-76",
        modes: ["mix"],
        chain: { mix: 8 },
      }),
      piece({
        id: "wv-manny-verb",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "Manny Reverb",
        modes: ["mix"],
        chain: { mix: 12 },
        note: "Send B.",
      }),
      piece({
        id: "wv-manny-delay",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "Manny Delay",
        modes: ["mix"],
        chain: { mix: 11 },
        note: "Send A.",
      }),
      piece({
        id: "wv-saturator",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "Abbey Road Saturator",
        modes: ["mix"],
        chain: { mix: 10 },
        note: "Lead insert, and 5–15% on the mix bus.",
      }),
      piece({
        id: "wv-f6",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "F6",
        modes: ["mix"],
        chain: { mix: 7 },
      }),
      piece({
        id: "wv-phatter",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "OneKnob Phatter",
        note: "Owned. No step in this rig.",
      }),
      piece({
        id: "wv-pumper",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "OneKnob Pumper",
        note: "Owned. No step in this rig.",
      }),
      piece({
        id: "wv-rider",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "Vocal Rider",
        modes: ["mix"],
        chain: { mix: 6 },
      }),
      piece({
        id: "wv-clarity",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "Clarity Vx",
        modes: ["mix"],
        chain: { mix: 3 },
      }),
      piece({
        id: "wv-brauer",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "Brauer Motion",
        note: "Owned. No step in this rig.",
      }),
      piece({
        id: "wv-cla-fx",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "CLA Effects",
        note: "Owned. No step in this rig.",
      }),
      piece({
        id: "wv-cla-vox",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "CLA Vocals",
        note: "Owned. Do not stack this on the lead insert.",
      }),
      piece({
        id: "wv-tune",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "Waves Tune",
        modes: ["mix"],
        chain: { mix: 2 },
      }),
      piece({
        id: "wv-sibilance",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "Sibilance",
        modes: ["mix"],
        chain: { mix: 9 },
      }),
      piece({
        id: "wv-studiorack",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "StudioRack",
        note: "Owned host rack. Not a processing step.",
      }),
      piece({
        id: "wv-submarine",
        kind: "plugin",
        group: "waves",
        vendor: "Waves",
        name: "Submarine",
        note: "Owned. No step in this rig.",
      }),
      piece({
        id: "st-eq",
        kind: "plugin",
        group: "stock",
        vendor: "Logic",
        name: "Channel EQ",
        modes: ["mix"],
        chain: { mix: 5 },
        note: "Lead cuts and air EQ. High-pass on the mix bus.",
      }),
      piece({
        id: "st-comp",
        kind: "plugin",
        group: "stock",
        vendor: "Logic",
        name: "Compressor (Vintage FET/VCA/Platinum)",
        modes: ["mix"],
        chain: { mix: 15 },
        note: "Mix bus: Logic VCA, 1–3 dB. Not a limiter.",
      }),
      piece({
        id: "st-deess",
        kind: "plugin",
        group: "stock",
        vendor: "Logic",
        name: "DeEsser",
        note: "Owned. The lead uses Sibilance.",
      }),
      piece({
        id: "st-pitch",
        kind: "plugin",
        group: "stock",
        vendor: "Logic",
        name: "Pitch Correction",
        note: "Owned. The lead uses Waves Tune.",
      }),
      piece({
        id: "st-tape",
        kind: "plugin",
        group: "stock",
        vendor: "Logic",
        name: "Tape Delay",
        note: "Owned. Send A is Manny Delay.",
      }),
      piece({
        id: "st-chroma",
        kind: "plugin",
        group: "stock",
        vendor: "Logic",
        name: "ChromaVerb",
        modes: ["mix"],
        chain: { mix: 13 },
        note: "Send C.",
      }),
      piece({
        id: "st-exciter",
        kind: "plugin",
        group: "stock",
        vendor: "Logic",
        name: "Exciter",
        note: "Owned. No step in this rig.",
      }),
      piece({
        id: "st-direction",
        kind: "plugin",
        group: "stock",
        vendor: "Logic",
        name: "Direction Mixer",
        note: "Owned. No step in this rig.",
      }),
      piece({
        id: "st-gate",
        kind: "plugin",
        group: "stock",
        vendor: "Logic",
        name: "Noise Gate",
        note: "Owned. No step in this rig.",
      }),
      piece({
        id: "st-limiter",
        kind: "plugin",
        group: "stock",
        vendor: "Logic",
        name: "Adaptive Limiter",
        note: "Owned. No limiter while mixing. Master uses the Ozone Maximizer.",
      }),
      piece({
        id: "ot-transit",
        kind: "plugin",
        group: "other",
        vendor: "Baby Audio",
        name: "Transit",
        modes: ["mix"],
        chain: { mix: 14 },
        note: "Send D. Moments only.",
      }),
    ],
    steps: [],
  };
}

export function cloneSetup(source, id, name) {
  const copy = structuredClone(source);
  copy.id = id;
  copy.name = name;
  if (copy.daw) copy.daw = { ...copy.daw, id: `${id}-daw` };
  if (copy.monitor) copy.monitor = { ...copy.monitor, id: `${id}-mon` };
  copy.hardware = (copy.hardware || []).map((item, index) => ({ ...item, id: `${id}-hw-${index}` }));
  copy.plugins = (copy.plugins || []).map((item, index) => ({ ...item, id: `${id}-pl-${index}` }));
  copy.steps = (copy.steps || []).map((step) => ({ ...step }));
  return copy;
}

export function mobileSetup() {
  return {
    id: "stk-mobile-bandlab",
    name: "Mobile (Bandlab)",
    daw: piece({
      id: "daw-mobile",
      kind: "daw",
      name: "Bandlab",
      modes: [...MODE_IDS],
      note: "",
    }),
    hardware: [],
    monitor: piece({
      id: "mon-mobile",
      kind: "monitor",
      name: "",
      modes: [],
      note: "",
    }),
    plugins: [],
    steps: [],
  };
}
