import { h } from "./dom.js";
import {
  KEYBOARD,
  KEYS,
  MIX_FOCUS,
  MODE_ORDER,
  MODES,
  SCALES,
  SEEDED_HOSTS,
  GENRE_GUIDES,
  SHARED_LEVELS,
  guideForGenre,
  habitsFor,
  keyboardLayout,
  scaleNotes,
} from "./seed.js";
import {
  activeSession,
  activeStack,
  addPlugin,
  applyImport,
  cleanName,
  createSession,
  createStack,
  deleteStack,
  duplicateStack,
  exportLibrary,
  exportRig,
  loadState,
  parseRig,
  removePlugin,
  renameStack,
  saveState,
  seedState,
  setActiveStack,
  setGenre,
  setHost,
  setKeyScale,
  setMixAt,
  setMixDone,
  setMixFocus,
  setMode,
  setView,
} from "./store.js";
import "./styles.css";

const VIEWS = [
  ["home", "Setups"],
  ["board", "Best Habits"],
  ["rig", "Gear"],
  ["file", "Export"],
];

const CHANTZMEDIA_URL = "https://chantzmedia.com";

let state = loadState();
let flash = "";
let storageError = false;
let focusAfter = "";
let mixCard = "beat";
let keyboardOpen = false;
let hostName = "Logic Pro";
let hostDraft = "";
let gate = "";
let draftSetupName = "";
let draftNames = [];
const armed = new Set();
const cursor = new Map();

function orderedModes() {
  return MODE_ORDER.map((id) => MODES.find((mode) => mode.id === id)).filter(Boolean);
}

function modeById(id) {
  return MODES.find((mode) => mode.id === id) || MODES[0];
}

function commit(next, message, focusId) {
  state = next;
  if (message) flash = message;
  const saved = saveState(state);
  storageError = !saved.ok;
  focusAfter = focusId || "";
  render();
}

function remember(next) {
  state = next;
  const saved = saveState(state);
  storageError = !saved.ok;
  const status = document.getElementById("status");
  if (status && storageError) {
    status.textContent = "Browser blocked storage. Export a copy before you close this tab.";
  }
}

function statusText() {
  if (storageError) return "Browser blocked storage. Export a copy before you close this tab.";
  if (flash) return flash;
  return "Saved on this device.";
}

function cursorKey(sessionId, mode, focus) {
  if (mode === "mix" && (focus === "beat" || focus === "vocal")) return `${sessionId}:mix:${focus}`;
  return `${sessionId}:${mode}`;
}

function mixRun(session) {
  return session.mixFocus === "beat" || session.mixFocus === "vocal" ? session.mixFocus : "";
}

function mixChecklist() {
  return habitsFor("mix").filter((habit) => habit.kind !== "mix-choice");
}

function stepsReached(session, part) {
  const total = mixChecklist().length;
  if (session.mixDone?.[part]) return total;
  return Math.min(mixStepCount(session.mixAt?.[part]), total);
}

function mixStepCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.floor(number);
}

function habitIndex(session, habits) {
  if (!habits.length) return 0;
  const key = cursorKey(session.id, session.mode, session.mixFocus);
  const saved = mixRun(session) ? Math.max(0, stepsReached(session, mixRun(session)) - 1) : 0;
  const current = cursor.has(key) ? cursor.get(key) : saved;
  return Math.min(Math.max(0, current), habits.length - 1);
}

function showHabit(session, index) {
  cursor.set(cursorKey(session.id, session.mode, session.mixFocus), index);
  const part = mixRun(session);
  if (part) {
    commit(setMixAt(state, part, index + 1), "", "habit-title");
    return;
  }
  focusAfter = "habit-title";
  render();
}

function startMix(part) {
  mixCard = part;
  let next = setMixFocus(state, part);
  const session = activeSession(next);
  const key = session ? cursorKey(session.id, "mix", part) : "";
  const reached = session ? stepsReached(session, part) : 0;
  if (session && !cursor.has(key)) cursor.set(key, reached > 0 ? Math.min(reached, mixChecklist().length) - 1 : 0);
  if (reached < 1) next = setMixAt(next, part, 1);
  commit(next, "", "habit-title");
}

function leaveMix() {
  commit(setMixFocus(state, ""), "", "habit-title");
}

function finishMix(session) {
  const part = mixRun(session);
  if (!part) return;
  const total = mixChecklist().length;
  commit(setMixFocus(setMixDone(setMixAt(state, part, total), part, true), ""), "", "habit-title");
}

function nextModeId(mode) {
  const index = MODE_ORDER.indexOf(mode);
  if (index < 0 || index >= MODE_ORDER.length - 1) return "";
  return MODE_ORDER[index + 1];
}

function moveOn(session) {
  const mode = nextModeId(session.mode);
  if (!mode) return;
  let next = state;
  if (session.mode === "create") {
    const field = document.getElementById("genre-name");
    const genre = cleanName(field ? field.value : activeStack(state)?.genre || "", 40);
    if (!genre) {
      flash = "Pick a genre first.";
      focusAfter = "genre-name";
      render();
      return;
    }
    next = setGenre(next, genre);
  }
  next = setMode(next, mode);
  const dest = activeSession(next);
  if (dest) cursor.set(cursorKey(dest.id, mode, ""), 0);
  commit(next, "", "habit-title");
}

function landOnRecord(next) {
  if (!next.activeStackId) return next;
  if (!activeSession(next)) next = createSession(next, "Untitled session");
  const session = activeSession(next);
  if (session) cursor.delete(cursorKey(session.id, "record", ""));
  if (!session) return setView(next, "board");
  return setView(setMode(next, "record"), "board");
}

function openSetup(id) {
  gate = "";
  commit(landOnRecord(setActiveStack(state, id)), "", "habit-title");
}

function pickMode(mode) {
  if (!activeStack(state)) {
    flash = "Add a setup first.";
    render();
    return;
  }
  let next = state;
  if (!activeSession(next)) next = createSession(next, "Untitled session");
  next = setMode(next, mode);
  if (mode === "mix") next = setMixFocus(next, "");
  commit(setView(next, "board"), "", "habit-title");
}

function pickHost(name) {
  hostName = name;
  hostDraft = "";
  focusAfter = name === "Bandlab" ? "host-bandlab" : "host-logic";
  render();
}

function splitSetups() {
  const matched = [];
  const other = [];
  for (const stack of state.stacks) {
    if (stack.daw?.name === hostName) matched.push(stack);
    else other.push(stack);
  }
  return { matched, other };
}

function armButton(key, label, armedLabel, onFire, ariaLabel) {
  return h(
    "button",
    {
      type: "button",
      class: "btn danger",
      "aria-label": ariaLabel || null,
      onclick: (event) => {
        if (!armed.has(key)) {
          armed.add(key);
          event.currentTarget.textContent = armedLabel;
          return;
        }
        onFire();
      },
    },
    [label],
  );
}

function pressClass(on, extra) {
  return on ? `btn ${extra}` : `btn ghost ${extra}`;
}

function choiceButton(id, label, on, className, onClick) {
  return h(
    "button",
    {
      type: "button",
      id,
      class: pressClass(on, className),
      "aria-pressed": on ? "true" : "false",
      onclick: onClick,
    },
    [label],
  );
}

function renderHost() {
  let form;
  form = h(
    "form",
    {
      class: "inline-form",
      onsubmit: (event) => {
        event.preventDefault();
        const name = cleanName(String(new FormData(form).get("host") || ""), 80);
        if (!name) {
          flash = "Name the host first.";
          focusAfter = "host-custom";
          render();
          return;
        }
        hostName = name;
        hostDraft = SEEDED_HOSTS.includes(name) ? "" : name;
        focusAfter = "host-use";
        render();
      },
    },
    [
      h("label", { class: "field grow" }, [
        h("span", { text: "New host" }),
        h("input", {
          id: "host-custom",
          name: "host",
          type: "text",
          maxlength: "80",
          autocomplete: "off",
          value: hostDraft,
          oninput: (event) => {
            hostDraft = event.target.value;
          },
        }),
      ]),
      h(
        "button",
        {
          type: "submit",
          id: "host-use",
          class: pressClass(!SEEDED_HOSTS.includes(hostName), "host-btn"),
          "aria-pressed": SEEDED_HOSTS.includes(hostName) ? "false" : "true",
        },
        ["Use this host"],
      ),
    ],
  );
  return h("div", { class: "host-block" }, [
    h("h2", { class: "screen-title", text: "Host" }),
    h(
      "div",
      { class: "hosts", role: "group", "aria-label": "Host" },
      SEEDED_HOSTS.map((name) =>
        choiceButton(
          name === "Bandlab" ? "host-bandlab" : "host-logic",
          name,
          hostName === name,
          "host-btn",
          () => pickHost(name),
        ),
      ),
    ),
    form,
    h("p", { class: "context", text: `Host · ${hostName}` }),
  ]);
}

function renderSetupCard(stack) {
  const on = stack.id === state.activeStackId;
  return h("article", { class: on ? "setup-card on" : "setup-card" }, [
    h("h3", { text: stack.name }),
    h("p", { class: "next-line", text: stack.daw?.name || "No host" }),
    h(
      "button",
      {
        type: "button",
        class: "btn",
        id: `open-${stack.id}`,
        "aria-current": on ? "true" : null,
        "aria-label": `Open ${stack.name}`,
        onclick: () => openSetup(stack.id),
      },
      ["Open"],
    ),
    h("label", { class: "field" }, [
      h("span", { text: "Rename" }),
      h("input", {
        id: on ? "setup-name" : null,
        type: "text",
        value: stack.name,
        maxlength: "120",
        autocomplete: "off",
        onchange: (event) => {
          const next = renameStack(state, stack.id, event.target.value);
          if (next === state) {
            flash = "The setup needs a name.";
            render();
            return;
          }
          commit(next, "");
        },
      }),
    ]),
    h(
      "button",
      {
        type: "button",
        class: "btn ghost",
        "aria-label": `Duplicate ${stack.name}`,
        onclick: () => commit(duplicateStack(state, stack.id), "Duplicated the setup.", "setup-name"),
      },
      ["Duplicate"],
    ),
  ]);
}

function renderSetupGroup(title, stacks, empty) {
  return h("div", {}, [
    h("h2", { id: title === "Setups" ? "setup-list" : null, class: "screen-title", tabindex: "-1", text: title }),
    stacks.length
      ? h("div", { class: "setups" }, stacks.map((stack) => renderSetupCard(stack)))
      : h("p", { class: "empty", text: empty }),
  ]);
}

function addDraftPlugin(form) {
  const name = cleanName(String(new FormData(form).get("plugin") || ""), 80);
  const setup = document.getElementById("new-setup-name");
  if (setup) draftSetupName = setup.value;
  if (!name) {
    flash = "Name the plugin first.";
    focusAfter = "plugin-name";
    render();
    return;
  }
  draftNames = [...draftNames, name];
  focusAfter = "plugin-name";
  render();
}

function finishNewSetup() {
  const setupInput = document.getElementById("new-setup-name");
  if (setupInput) draftSetupName = setupInput.value;
  const pending = cleanName(document.getElementById("plugin-name")?.value || "", 80);
  const plugins = draftNames.map((name) => cleanName(name, 80)).filter(Boolean);
  if (pending) plugins.push(pending);
  let next = createStack(state, draftSetupName, hostName);
  if (next === state) {
    flash = "Name the setup first.";
    focusAfter = "new-setup-name";
    render();
    return;
  }
  for (const name of plugins) next = addPlugin(next, { name, group: "other" });
  draftNames = [];
  draftSetupName = "";
  gate = "";
  commit(landOnRecord(next), "Setup added.", "habit-title");
}

function renderNewSetup() {
  let pluginForm;
  pluginForm = h(
    "form",
    {
      class: "add-line",
      onsubmit: (event) => {
        event.preventDefault();
        addDraftPlugin(pluginForm);
      },
    },
    [
      h("label", { class: "field" }, [
        h("span", { text: "Plugin name" }),
        h("input", {
          id: "plugin-name",
          name: "plugin",
          type: "text",
          maxlength: "80",
          autocomplete: "off",
        }),
      ]),
      h("button", { type: "submit", class: "btn" }, ["Add plugin"]),
    ],
  );
  return h("div", { class: "card new-setup" }, [
    h("h3", { text: "New setup" }),
    h("label", { class: "field" }, [
      h("span", { text: "Setup name" }),
      h("input", {
        id: "new-setup-name",
        type: "text",
        maxlength: "120",
        autocomplete: "off",
        value: draftSetupName,
        oninput: (event) => {
          draftSetupName = event.target.value;
        },
      }),
    ]),
    pluginForm,
    draftNames.length
      ? h(
          "ul",
          { class: "draft-plugins" },
          draftNames.map((name, index) =>
            h("li", {}, [
              h("span", { text: name }),
              h(
                "button",
                {
                  type: "button",
                  class: "btn ghost slim",
                  onclick: () => {
                    const setup = document.getElementById("new-setup-name");
                    if (setup) draftSetupName = setup.value;
                    draftNames = draftNames.filter((_, item) => item !== index);
                    render();
                  },
                },
                ["Remove"],
              ),
            ]),
          ),
        )
      : h("p", { class: "hint", text: "Plugins are optional. The guide does not use them." }),
    h(
      "button",
      { type: "button", class: "btn", id: "setup-next", onclick: finishNewSetup },
      ["Next"],
    ),
  ]);
}

function renderHome() {
  const { matched, other } = splitSetups();
  return h("section", { class: "screen home" }, [
    renderHost(),
    h(
      "div",
      { class: "choices", role: "group", "aria-label": "New or existing" },
      [
        choiceButton("gate-new", "New", gate === "new", "choice-btn", () => {
          gate = "new";
          focusAfter = "new-setup-name";
          render();
        }),
        choiceButton("gate-existing", "Existing", gate === "existing", "choice-btn", () => {
          gate = "existing";
          focusAfter = "setup-list";
          render();
        }),
      ],
    ),
    gate === "new" ? renderNewSetup() : null,
    renderSetupGroup("Setups", matched, "No saved setup for this host."),
    other.length ? renderSetupGroup("Other hosts", other, "") : null,
  ]);
}

function modeSwitcher(session) {
  return h(
    "div",
    { class: "modes", role: "group", "aria-label": "Best Habits" },
    orderedModes().map((mode) =>
      h(
        "button",
        {
          type: "button",
          id: `mode-${mode.id}`,
          class: `mode-btn mode-${mode.id}`,
          "aria-pressed": session?.mode === mode.id ? "true" : "false",
          onclick: () => pickMode(mode.id),
        },
        [h("span", { class: "mode-name", text: mode.label })],
      ),
    ),
  );
}

function selectPair(id, label, value, options, onChange) {
  return h("label", { class: "field" }, [
    h("span", { text: label }),
    h(
      "select",
      { id, onchange: onChange },
      options.map((option) =>
        h("option", { value: option.value, selected: option.value === value, text: option.label }),
      ),
    ),
  ]);
}

function pct(value) {
  return `${(value * 100).toFixed(4)}%`;
}

function openKeyboard() {
  keyboardOpen = true;
  focusAfter = "piano-close";
  render();
}

function closeKeyboard() {
  keyboardOpen = false;
  focusAfter = "piano-expand";
  render();
}

function renderKeyboard(stack, notes, expanded) {
  const layout = keyboardLayout(stack.key, stack.scale);
  if (!layout) return null;
  const scale = SCALES.find((item) => item.id === stack.scale);
  const label = `${stack.key} ${scale?.label || ""}. Marked notes ${notes.join(" ")}.`;
  const whites = layout.keys.filter((item) => !item.black);
  const blacks = layout.keys.filter((item) => item.black);
  const keyMark = (item) =>
    h(
      "span",
      {
        class: item.inScale ? `piano-key${item.black ? " black" : ""} in` : `piano-key${item.black ? " black" : ""}`,
        style: `left:${pct(item.x)};width:${pct(item.w)}`,
        "data-note": item.note,
        "data-in-scale": item.inScale ? "true" : "false",
      },
      [
        item.inScale ? h("span", { class: "piano-mark" }) : null,
        h("span", { class: "piano-name", text: item.note }),
      ],
    );
  return h(
    "div",
    {
      class: expanded ? "piano piano-full" : "piano",
      role: "img",
      "aria-label": label,
    },
    [
      expanded
        ? null
        : h(
            "button",
            { type: "button", class: "btn piano-open", id: "piano-expand", onclick: () => openKeyboard() },
            ["Full keyboard"],
          ),
      h(
        "div",
        {
          class: "piano-window",
          style: `aspect-ratio:${layout.windowWidth} / ${layout.imageHeight};--black-span:${pct(layout.blackSpan)}`,
        },
        [
          h("div", { class: "piano-track" }, [
            h("img", {
              class: "piano-art",
              src: "/keyboard-octave.png",
              alt: "",
              width: String(KEYBOARD.whiteCount * KEYBOARD.whiteWidth),
              height: String(KEYBOARD.whiteHeight),
              draggable: "false",
              style: `left:${pct(layout.imageX)};width:${pct(layout.imageW)}`,
            }),
            ...whites.map(keyMark),
            ...blacks.map(keyMark),
          ]),
        ],
      ),
    ],
  );
}

function scaleBody(habit, stack) {
  const notes = scaleNotes(stack.key, stack.scale);
  return h("div", {}, [
    selectPair("scale-key", "Key", stack.key, KEYS.map((key) => ({ value: key, label: key })), (event) =>
      commit(setKeyScale(state, event.target.value, activeStack(state)?.scale || stack.scale), "", "scale-key"),
    ),
    selectPair(
      "scale-name",
      "Scale",
      stack.scale,
      SCALES.map((scale) => ({ value: scale.id, label: scale.label })),
      (event) => commit(setKeyScale(state, activeStack(state)?.key || stack.key, event.target.value), "", "scale-name"),
    ),
    renderKeyboard(stack, notes),
    keyboardOpen ? keyboardDialog(stack, notes) : null,
    h("p", { id: "scale-notes", class: "notes", "aria-live": "polite", text: notes.join(" ") }),
    h("p", { class: "hint", text: (habit.lines || []).join(" ") }),
  ]);
}

function keyboardDialog(stack, notes) {
  const scale = SCALES.find((item) => item.id === stack.scale);
  return h(
    "div",
    {
      class: "piano-expand",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "piano-expand-title",
    },
    [
      h("div", { class: "piano-expand-bar" }, [
        h("h2", { id: "piano-expand-title", text: `${stack.key} ${scale?.label || ""}` }),
        h(
          "button",
          {
            type: "button",
            class: "btn",
            id: "piano-close",
            onclick: () => closeKeyboard(),
          },
          ["Close"],
        ),
      ]),
      h("p", { class: "hint", text: "Turn the phone sideways. The keys fill the screen and keep their note names." }),
      h("p", { id: "scale-notes-full", class: "notes", text: notes.join(" ") }),
      renderKeyboard(stack, notes, true),
    ],
  );
}

function arrangementBody(habit, stack) {
  const guide = guideForGenre(stack.genre);
  return h("div", {}, [
    lineList(habit),
    guide
      ? h("div", {}, [
          h("h3", { text: `${guide.label} form` }),
          levelList(guide.form),
          h("p", { class: "hint", text: "A common shape for this type. Repeat the hook and change the energy around it." }),
        ])
      : h("p", { class: "hint", text: "Pick a genre on the previous screen to see a form for that type." }),
  ]);
}

function genreBody(habit, stack) {
  return h("div", {}, [
    h("label", { class: "field" }, [
      h("span", { text: "Genre" }),
      h("input", {
        id: "genre-name",
        type: "text",
        maxlength: "40",
        autocomplete: "off",
        value: stack.genre || "",
        oninput: (event) => {
          remember(setGenre(state, event.target.value));
          const next = document.getElementById("habit-next");
          if (next) next.disabled = !cleanName(event.target.value, 40);
        },
      }),
    ]),
    h(
      "div",
      { class: "paths", role: "group", "aria-label": "Genre type" },
      GENRE_GUIDES.map((guide) =>
        choiceButton(`genre-${guide.id}`, guide.label, guideForGenre(stack.genre)?.id === guide.id, "path-btn", () =>
          commit(setGenre(state, guide.label), "", "genre-name"),
        ),
      ),
    ),
    h(
      "ul",
      { class: "habit-lines" },
      (habit.lines || []).map((line) => h("li", { text: line })),
    ),
  ]);
}

function levelList(lines) {
  return h(
    "ul",
    { class: "habit-lines" },
    lines.map((line) => h("li", { text: line })),
  );
}

function pathPanel(title, path) {
  return h("article", { class: "deck-panel" }, [
    h("p", { class: "deck-name", text: title }),
    h("p", { text: path.note }),
    h("p", { text: path.detail }),
    h("h3", { text: "Use" }),
    levelList(path.use),
    h("h3", { text: "Leave off" }),
    levelList(path.skip),
  ]);
}

function mixDeck(guide) {
  const vocal = mixCard === "vocal";
  return h("div", { class: "deck", id: "mix-deck" }, [
    h("div", { class: "deck-tabs", role: "tablist", "aria-label": "Beat or vocal card" }, [
      h(
        "button",
        {
          type: "button",
          class: "deck-tab",
          id: "deck-beat",
          role: "tab",
          "aria-selected": vocal ? "false" : "true",
          onclick: () => {
            mixCard = "beat";
            focusAfter = "deck-beat";
            render();
          },
        },
        ["Beat"],
      ),
      h(
        "button",
        {
          type: "button",
          class: "deck-tab",
          id: "deck-vocal",
          role: "tab",
          "aria-selected": vocal ? "true" : "false",
          onclick: () => {
            mixCard = "vocal";
            focusAfter = "deck-vocal";
            render();
          },
        },
        ["Vocal"],
      ),
    ]),
    h("p", { class: "deck-kicker", text: `${vocal ? "Vocal" : "Beat"} · ${guide.label}` }),
    h("div", { class: "deck-viewport", id: "deck-viewport" }, [
      h("div", { class: "deck-track", style: `transform:translateX(-${vocal ? 100 : 0}%)` }, [
        pathPanel("Beat", guide.beat),
        pathPanel("Vocal", guide.vocalPath),
      ]),
    ]),
    h("p", { class: "hint", text: "Swipe sideways for the other card. Beat is the music. Vocal is the voice." }),
  ]);
}

function rangeCard(stack, mode) {
  const matched = guideForGenre(stack.genre);
  const shared =
    mode === "record"
      ? SHARED_LEVELS.record
      : mode === "master"
        ? SHARED_LEVELS.master
        : mode === "mix"
          ? SHARED_LEVELS.mix
          : SHARED_LEVELS.mix;
  const title = mode === "record" ? "Record levels" : mode === "master" ? "Master levels" : "Mix levels";
  return h("div", { class: "range", id: "level-card" }, [
    h("h3", { text: title }),
    levelList(shared),
    h("p", { class: "hint", text: SHARED_LEVELS.note }),
    mode === "record"
      ? h("p", { class: "hint", text: "EQ, compression, saturation, delay, and reverb wait until Mix. The limiter waits until Master." })
      : null,
    mode === "mix"
      ? matched
        ? mixDeck(matched)
        : h("p", { class: "hint", text: "Pick a genre on Create to open the Beat and Vocal cards." })
      : null,
    mode === "master"
      ? h("p", {
          class: "source",
          text: "Spotify loudness and true-peak lines are from Spotify for Artists, Loudness normalization. Record peaks and mix-bus headroom are this guide's practice levels.",
        })
      : null,
  ]);
}

function progressBar(done, total, label) {
  const value = total ? Math.round((done / total) * 100) : 0;
  return h("div", { class: "meter" }, [
    h("p", { class: "progress", id: "section-progress", text: label }),
    h(
      "div",
      {
        class: "meter-track",
        role: "progressbar",
        "aria-valuemin": "0",
        "aria-valuemax": String(total),
        "aria-valuenow": String(done),
        "aria-label": label,
      },
      [h("div", { class: "meter-fill", style: `width:${value}%` })],
    ),
  ]);
}

function mixHub(session) {
  const done = session.mixDone || { beat: false, vocal: false };
  const total = mixChecklist().length;
  const beatReached = stepsReached(session, "beat");
  const vocalReached = stepsReached(session, "vocal");
  const beat = MIX_FOCUS.find((item) => item.id === "beat");
  const vocal = MIX_FOCUS.find((item) => item.id === "vocal");
  return h("div", { class: "habit", "data-habit": "mix-hub" }, [
    progressBar(beatReached, total, `Beat (${beatReached}/${total} steps completed)`),
    progressBar(vocalReached, total, `Vocal (${vocalReached}/${total} steps completed)`),
    h("h2", { id: "habit-title", tabindex: "-1", text: "Beat and vocal" }),
    h("p", { class: "hint", text: "Finish the checks you need. A beat can move on without a vocal. A vocal can move on without redoing the beat." }),
    h("div", { class: "paths" }, [
      h(
        "button",
        { type: "button", class: "btn", id: "mix-beat", onclick: () => startMix("beat") },
        [done.beat ? "Beat checks, done" : "Beat checks"],
      ),
      h(
        "button",
        { type: "button", class: "btn", id: "mix-vocal", onclick: () => startMix("vocal") },
        [done.vocal ? "Vocal checks, done" : "Vocal checks"],
      ),
    ]),
    h("p", { class: "do-this", text: beat.text }),
    h("p", { class: "do-this", text: vocal.text }),
    h("div", { class: "pager" }, [
      h(
        "button",
        { type: "button", class: "btn", id: "habit-next", onclick: () => moveOn(session) },
        ["Move On"],
      ),
    ]),
  ]);
}

function lineList(habit) {
  return h(
    "ul",
    { class: "habit-lines" },
    (habit.lines || []).map((line) => h("li", { text: line })),
  );
}

function mixGain(habit, session) {
  const path = MIX_FOCUS.find((item) => item.id === session.mixFocus);
  return h("div", {}, [
    path ? h("p", { class: "do-this", text: path.text }) : h("p", { class: "do-this", text: "Choose Vocal, Beat, or Both." }),
    lineList(habit),
  ]);
}

function habitBody(habit, stack, session) {
  if (habit.kind === "scale") return scaleBody(habit, stack);
  if (habit.kind === "genre") return genreBody(habit, stack);
  if (habit.kind === "arrangement") return arrangementBody(habit, stack);
  if (habit.kind === "mix-gain") return mixGain(habit, session);
  if (habit.kind === "master-limit") return masterLimit(habit, stack);
  return lineList(habit);
}

function masterLimit(habit, stack) {
  const guide = guideForGenre(stack.genre);
  return h("div", {}, [
    lineList(habit),
    guide?.masterNote
      ? h("div", {}, [
          h("h3", { text: `${guide.label} master` }),
          h("p", { text: guide.masterNote }),
        ])
      : h("p", { class: "hint", text: "Pick a genre on Create for a note on how hard to limit this type of record." }),
  ]);
}

function renderHabits(stack, session) {
  const mode = modeById(session.mode);
  if (session.mode === "mix" && !mixRun(session)) return mixHub(session);
  const habits = (session.mode === "mix" ? habitsFor("mix").filter((habit) => habit.kind !== "mix-choice") : habitsFor(mode.id));
  const index = habitIndex(session, habits);
  const habit = habits[index];
  if (!habit) {
    return h("div", { class: "habit" }, [h("h2", { id: "habit-title", tabindex: "-1", text: mode.label })]);
  }
  const running = Boolean(mixRun(session));
  const atEnd = index >= habits.length - 1;
  const upcoming = nextModeId(session.mode);
  const genreMissing = session.mode === "create" && habit.kind === "genre" && !cleanName(stack.genre || "", 40);
  const genreBlocksLeave = atEnd && session.mode === "create" && !cleanName(stack.genre || "", 40);
  const nextLabel = running && atEnd ? "Done" : atEnd && upcoming ? "Move On" : "Next";
  return h("div", { class: "habit", "data-habit": habit.id }, [
    progressBar(index + 1, habits.length, `${index + 1} of ${habits.length}`),
    h("h2", { id: "habit-title", tabindex: "-1", text: habit.title }),
    habitBody(habit, stack, session),
    h("div", { class: "pager" }, [
      running
        ? h(
            "button",
            { type: "button", class: "btn ghost", id: "mix-home", onclick: () => leaveMix() },
            ["Mix home"],
          )
        : null,
      h(
        "button",
        {
          type: "button",
          class: "btn ghost",
          id: "habit-back",
          disabled: index === 0 && !running,
          onclick: () => (index === 0 && running ? leaveMix() : showHabit(session, index - 1)),
        },
        ["Back"],
      ),
      h(
        "button",
        {
          type: "button",
          class: "btn",
          id: "habit-next",
          disabled: genreMissing || genreBlocksLeave || (atEnd && !upcoming && !running),
          onclick: () => (running && atEnd ? finishMix(session) : atEnd ? moveOn(session) : showHabit(session, index + 1)),
        },
        [nextLabel],
      ),
    ]),
  ]);
}

function renderGuide() {
  const stack = activeStack(state);
  if (!stack) {
    return h("section", { class: "screen" }, [
      h("h2", { id: "habit-title", tabindex: "-1", text: "Best Habits" }),
      h("p", { class: "empty", text: "Add a setup first." }),
      h(
        "button",
        {
          type: "button",
          class: "btn",
          onclick: () => {
            gate = "new";
            commit(setView(state, "home"), "", "new-setup-name");
          },
        },
        ["New setup"],
      ),
    ]);
  }
  let session = activeSession(state);
  if (!session) {
    return h("section", { class: "screen" }, [
      h("h2", { id: "habit-title", tabindex: "-1", text: stack.name }),
      h("p", { class: "empty", text: "This setup has no session yet." }),
      h(
        "button",
        {
          type: "button",
          class: "btn",
          onclick: () => commit(landOnRecord(createSession(state, "Untitled session")), "", "habit-title"),
        },
        ["Start"],
      ),
    ]);
  }
  return h("section", { class: "screen guide", "data-mode": session.mode }, [
    h("p", { class: "kicker", text: "Best Habits" }),
    h("p", { class: "context", text: stack.name }),
    modeSwitcher(session),
    renderHabits(stack, session),
    session.mode === "create" ? null : rangeCard(stack, session.mode),
  ]);
}

function gearNames(title, names) {
  if (!names.length) return null;
  return h("div", {}, [
    h("h3", { text: title }),
    h(
      "ul",
      { class: "gear-names" },
      names.map((name) => h("li", { text: name })),
    ),
  ]);
}

function renderGear() {
  const stack = activeStack(state);
  if (!stack) {
    return h("section", { class: "screen" }, [
      h("h2", { id: "gear-title", tabindex: "-1", text: "Gear" }),
      h("p", { class: "empty", text: "Add a setup first." }),
    ]);
  }
  let pluginForm;
  pluginForm = h(
    "form",
    {
      class: "add-line",
      onsubmit: (event) => {
        event.preventDefault();
        const name = cleanName(String(new FormData(pluginForm).get("plugin") || ""), 80);
        if (!name) {
          flash = "Name the plugin first.";
          focusAfter = "gear-plugin";
          render();
          return;
        }
        commit(addPlugin(state, { name, group: "other" }), "Plugin added.", "gear-plugin");
      },
    },
    [
      h("label", { class: "field" }, [
        h("span", { text: "Plugin name" }),
        h("input", { id: "gear-plugin", name: "plugin", type: "text", maxlength: "80", autocomplete: "off" }),
      ]),
      h("button", { type: "submit", class: "btn" }, ["Add plugin"]),
    ],
  );
  return h("section", { class: "screen" }, [
    h("h2", { id: "gear-title", tabindex: "-1", text: "Gear" }),
    h("p", { class: "intro", text: "Inventory only. Best Habits stays the same for every setup." }),
    h("label", { class: "field" }, [
      h("span", { text: "Setup" }),
      h(
        "select",
        {
          id: "gear-setup",
          onchange: (event) => {
            let next = setActiveStack(state, event.target.value);
            if (!activeSession(next)) next = createSession(next, "Untitled session");
            commit(next, "", "gear-setup");
          },
        },
        state.stacks.map((item) =>
          h("option", { value: item.id, selected: item.id === stack.id, text: item.name }),
        ),
      ),
    ]),
    h("label", { class: "field" }, [
      h("span", { text: "Host" }),
      h("input", {
        id: "gear-host",
        type: "text",
        value: stack.daw?.name || "",
        maxlength: "80",
        autocomplete: "off",
        onchange: (event) => {
          const next = setHost(state, event.target.value);
          if (next === state) {
            flash = "The host needs a name.";
            render();
            return;
          }
          commit(next, "", "gear-host");
        },
      }),
    ]),
    h("h3", { text: "Plugins" }),
    stack.plugins.length
      ? h(
          "ul",
          { class: "gear-list" },
          stack.plugins.map((plugin) =>
            h("li", { class: "gear-row" }, [
              h("span", { text: plugin.name }),
              armButton(
                `pl:${plugin.id}`,
                "Remove",
                "Remove now",
                () => commit(removePlugin(state, plugin.id), "Plugin removed."),
                `Remove ${plugin.name}`,
              ),
            ]),
          ),
        )
      : h("p", { class: "empty", text: "No plugins yet." }),
    pluginForm,
    gearNames(
      "Hardware",
      stack.hardware.map((item) => item.name).filter(Boolean),
    ),
    stack.monitor?.name ? gearNames("Monitor", [stack.monitor.name]) : null,
    h("h3", { text: "Remove this setup" }),
    armButton(`setup:${stack.id}`, "Delete setup", "Delete now", () =>
      commit(deleteStack(state, stack.id), "Deleted the setup.", "gear-title"),
    ),
  ]);
}

function fileSlug(name) {
  const slug = String(name || "setup")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "setup";
}

function download(filename, data) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderFile() {
  const stack = activeStack(state);
  return h("section", { class: "screen" }, [
    h("h2", { text: "Export" }),
    h("p", {
      class: "intro",
      text: "Download this setup and keep the file next to the session. Import replaces that setup and its sessions. Other setups stay.",
    }),
    h("div", { class: "row-actions" }, [
      h(
        "button",
        {
          type: "button",
          class: "btn",
          disabled: !stack,
          onclick: () => {
            const data = exportRig(state);
            if (!data) return;
            download(`${fileSlug(data.stack.name)}.guiderec.json`, data);
            flash = `Downloaded ${data.stack.name}.`;
            render();
          },
        },
        [stack ? `Download ${stack.name}` : "Download setup"],
      ),
      h(
        "button",
        {
          type: "button",
          class: "btn ghost",
          onclick: () => {
            download("guiderec-library.guiderec.json", exportLibrary(state));
            flash = "Downloaded every setup.";
            render();
          },
        },
        ["Download all setups"],
      ),
    ]),
    h("label", { class: "field" }, [
      h("span", { text: "Import JSON" }),
      h("input", {
        id: "import-file",
        type: "file",
        accept: "application/json,.json",
        onchange: async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          let text = "";
          try {
            text = await file.text();
          } catch {
            flash = "Could not read that file.";
            render();
            return;
          }
          const applied = applyImport(state, parseRig(text));
          if (applied.error) {
            flash = applied.error;
            render();
            return;
          }
          commit(applied.state, applied.notice);
        },
      }),
    ]),
    armButton("reset-browser", "Reset this browser", "Reset now", () => {
      cursor.clear();
      draftNames = [];
      draftSetupName = "";
      gate = "";
      hostName = "Logic Pro";
      hostDraft = "";
      commit(seedState(), "Restored the shipped setups.");
    }),
  ]);
}

function screen() {
  if (state.view === "board") return renderGuide();
  if (state.view === "rig") return renderGear();
  if (state.view === "file") return renderFile();
  return renderHome();
}

function footer() {
  const year = new Date().getFullYear();
  return h("footer", { class: "footer" }, [
    h("p", { text: `© ${year} ChantzMedia. All rights reserved.` }),
    h("p", {}, [
      h("a", {
        href: CHANTZMEDIA_URL,
        target: "_blank",
        rel: "noopener noreferrer",
        text: "Created By ChantzMedia",
      }),
    ]),
  ]);
}

function moveTab(event) {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  const ids = VIEWS.map(([id]) => id);
  const current = ids.indexOf(state.view);
  if (current < 0) return;
  event.preventDefault();
  const delta = event.key === "ArrowRight" ? 1 : -1;
  const next = ids[(current + delta + ids.length) % ids.length];
  commit(setView(state, next), "", `tab-${next}`);
}

function renderShell() {
  return h("div", { class: "shell" }, [
    h("a", { class: "skip", href: "#main", text: "Skip to content" }),
    h("header", { class: "top" }, [
      h("div", { class: "brand-row" }, [
        h("p", { class: "mark", text: "ChantzMedia" }),
        h("h1", { text: "GuideRec" }),
      ]),
      h(
        "div",
        { class: "tabs", role: "tablist", "aria-label": "Screens" },
        VIEWS.map(([id, label]) =>
          h(
            "button",
            {
              type: "button",
              role: "tab",
              id: `tab-${id}`,
              class: state.view === id ? "tab on" : "tab",
              "aria-selected": state.view === id ? "true" : "false",
              "aria-controls": "main",
              tabindex: state.view === id ? "0" : "-1",
              onclick: () => commit(setView(state, id), "", `tab-${id}`),
              onkeydown: moveTab,
            },
            [label],
          ),
        ),
      ),
    ]),
    h("main", { id: "main", class: "main", role: "tabpanel", tabindex: "-1" }, [screen()]),
    h("p", { id: "status", class: "status", role: "status", text: statusText() }),
    footer(),
  ]);
}

function bindDeck() {
  const view = document.getElementById("deck-viewport");
  if (!view) return;
  let startX = 0;
  let startY = 0;
  let active = false;
  view.addEventListener("pointerdown", (event) => {
    active = true;
    startX = event.clientX;
    startY = event.clientY;
  });
  view.addEventListener("pointerup", (event) => {
    if (!active) return;
    active = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    mixCard = dx < 0 ? "vocal" : "beat";
    focusAfter = mixCard === "vocal" ? "deck-vocal" : "deck-beat";
    render();
  });
}

function render() {
  armed.clear();
  document.body.classList.toggle("keyboard-open", keyboardOpen);
  document.getElementById("app").replaceChildren(renderShell());
  flash = "";
  bindDeck();
  document.getElementById("piano-close")?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeKeyboard();
  });
  if (focusAfter) {
    document.getElementById(focusAfter)?.focus();
    focusAfter = "";
  }
}

render();
