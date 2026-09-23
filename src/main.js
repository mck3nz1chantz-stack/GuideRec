import { h } from "./dom.js";
import {
  KEYBOARD,
  KEYS,
  MIX_FOCUS,
  MODE_ORDER,
  MODES,
  SCALES,
  SEEDED_HOSTS,
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
  return "Saved on this Mac.";
}

function cursorKey(sessionId, mode) {
  return `${sessionId}:${mode}`;
}

function habitIndex(session, habits) {
  if (!habits.length) return 0;
  const key = cursorKey(session.id, session.mode);
  const current = cursor.has(key) ? cursor.get(key) : 0;
  return Math.min(Math.max(0, current), habits.length - 1);
}

function showHabit(session, index) {
  cursor.set(cursorKey(session.id, session.mode), index);
  focusAfter = "habit-title";
  render();
}

function landOnRecord(next) {
  if (!next.activeStackId) return next;
  if (!activeSession(next)) next = createSession(next, "Untitled session");
  const session = activeSession(next);
  if (session) cursor.delete(cursorKey(session.id, "record"));
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
  commit(setView(setMode(next, mode), "board"), "", "habit-title");
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

function renderKeyboard(stack, notes) {
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
      class: "piano",
      role: "img",
      "aria-label": label,
    },
    [
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
    h("p", { id: "scale-notes", class: "notes", "aria-live": "polite", text: notes.join(" ") }),
    h("p", { class: "hint", text: (habit.lines || []).join(" ") }),
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
        oninput: (event) => remember(setGenre(state, event.target.value)),
      }),
    ]),
    h(
      "ul",
      { class: "habit-lines" },
      (habit.lines || []).map((line) => h("li", { text: line })),
    ),
  ]);
}

function mixChoice(session) {
  return h(
    "div",
    { class: "paths", role: "group", "aria-label": "Vocal, beat, or both" },
    MIX_FOCUS.map((path) =>
      choiceButton(`mix-${path.id}`, path.label, session.mixFocus === path.id, "path-btn", () =>
        commit(setMixFocus(state, path.id), "", `mix-${path.id}`),
      ),
    ),
  );
}

function mixMoves(session) {
  const path = MIX_FOCUS.find((item) => item.id === session.mixFocus);
  if (!path) return h("p", { class: "do-this", text: "Choose Vocal, Beat, or Both." });
  return h("div", {}, [
    h("p", { class: "kicker", text: path.label }),
    h("p", { class: "do-this", text: path.text }),
  ]);
}

function habitBody(habit, stack, session) {
  if (habit.kind === "scale") return scaleBody(habit, stack);
  if (habit.kind === "genre") return genreBody(habit, stack);
  if (habit.kind === "mix-choice") return mixChoice(session);
  if (habit.kind === "mix-moves") return mixMoves(session);
  return h(
    "ul",
    { class: "habit-lines" },
    (habit.lines || []).map((line) => h("li", { text: line })),
  );
}

function renderHabits(stack, session) {
  const mode = modeById(session.mode);
  const habits = habitsFor(mode.id);
  const index = habitIndex(session, habits);
  const habit = habits[index];
  if (!habit) {
    return h("div", { class: "habit" }, [h("h2", { id: "habit-title", tabindex: "-1", text: mode.label })]);
  }
  const needsChoice = habit.kind === "mix-choice" && !session.mixFocus;
  return h("div", { class: "habit", "data-habit": habit.id }, [
    h("p", { class: "progress", text: `${index + 1} of ${habits.length}` }),
    h("h2", { id: "habit-title", tabindex: "-1", text: habit.title }),
    habitBody(habit, stack, session),
    h("div", { class: "pager" }, [
      h(
        "button",
        {
          type: "button",
          class: "btn ghost",
          id: "habit-back",
          disabled: index === 0,
          onclick: () => showHabit(session, index - 1),
        },
        ["Back"],
      ),
      h(
        "button",
        {
          type: "button",
          class: "btn",
          id: "habit-next",
          disabled: index >= habits.length - 1 || needsChoice,
          onclick: () => showHabit(session, index + 1),
        },
        ["Next"],
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

function render() {
  armed.clear();
  document.getElementById("app").replaceChildren(renderShell());
  flash = "";
  if (focusAfter) {
    document.getElementById(focusAfter)?.focus();
    focusAfter = "";
  }
}

render();
