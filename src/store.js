import { GROUPS, KEYS, MODE_IDS, SCALES, cloneSetup, mobileSetup, seedStack } from "./seed.js";

export const SCHEMA = "StackRig.v1";
export const STORAGE_KEY = "chantzmedia.guiderec.v1";
export const LEGACY_KEY = "chantzmedia.stackrig.v1";
const VIEWS = ["home", "board", "rig", "file"];

export function uid(prefix) {
  const rand = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${rand}`;
}

export function cleanName(value, max) {
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.slice(0, max);
}

export function cleanText(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}

export function cleanModes(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const id of list) {
    if (MODE_IDS.includes(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

function cleanGroup(group) {
  return GROUPS.some((item) => item.id === group) ? group : "other";
}

function cleanId(id, prefix) {
  if (typeof id === "string" && /^[a-z0-9-]{1,80}$/i.test(id)) return id;
  return uid(prefix);
}

function cleanChain(chain) {
  const out = {};
  if (!chain || typeof chain !== "object") return out;
  for (const id of MODE_IDS) {
    const value = chain[id];
    if (typeof value === "number" && Number.isFinite(value)) out[id] = value;
  }
  return out;
}

function normalizePlugin(input) {
  if (!input || typeof input !== "object") return null;
  const name = cleanName(input.name, 80);
  if (!name) return null;
  const doNotInvent = input.doNotInvent === true;
  return {
    id: cleanId(input.id, "pl"),
    name,
    kind: "plugin",
    group: cleanGroup(input.group),
    vendor: cleanName(input.vendor || "", 40),
    owned: doNotInvent ? false : input.owned !== false,
    doNotInvent,
    modes: doNotInvent ? [] : cleanModes(input.modes),
    note: cleanText(input.note || "", 180),
    chain: doNotInvent ? {} : cleanChain(input.chain),
  };
}

function normalizePiece(input, kind, allowEmpty = false) {
  if (!input || typeof input !== "object") return null;
  const name = cleanName(input.name, 80);
  if (!name && !allowEmpty) return null;
  const doNotInvent = input.doNotInvent === true;
  const prefix = kind === "hardware" ? "hw" : kind === "monitor" ? "mon" : "daw";
  return {
    id: cleanId(input.id, prefix),
    name,
    kind,
    group: "",
    vendor: "",
    owned: doNotInvent ? false : input.owned !== false,
    doNotInvent,
    modes: doNotInvent ? [] : cleanModes(input.modes),
    note: cleanText(input.note || "", 180),
    chain: doNotInvent ? {} : cleanChain(input.chain),
  };
}

function emptyDaw() {
  return {
    id: uid("daw"),
    name: "Logic Pro",
    kind: "daw",
    group: "",
    vendor: "",
    owned: true,
    doNotInvent: false,
    modes: [...MODE_IDS],
    note: "",
    chain: { record: 0, create: 0, mix: 0, master: 0 },
  };
}

function monitorFrom(input) {
  const name = cleanName(input?.name, 80);
  const base = {
    id: cleanId(input?.id, "mon"),
    name: "",
    kind: "monitor",
    group: "",
    vendor: "",
    owned: input?.doNotInvent === true ? false : input?.owned !== false,
    doNotInvent: input?.doNotInvent === true,
    modes: input?.doNotInvent === true ? [] : Array.isArray(input?.modes) ? cleanModes(input.modes) : ["mix"],
    note: cleanText(input?.note ?? "Never bounce or print.", 180),
    chain: cleanChain(input?.chain),
  };
  if (!name) return base;
  return normalizePiece({ ...input, name }, "monitor") || base;
}

function normalizeStep(input) {
  if (!input || typeof input !== "object") return null;
  const title = cleanName(input.title, 80);
  if (!title) return null;
  const order = typeof input.order === "number" && Number.isFinite(input.order) ? input.order : 1;
  return {
    id: cleanId(input.id, "step"),
    mode: MODE_IDS.includes(input.mode) ? input.mode : "record",
    order,
    title,
    rule: cleanText(input.rule || "", 800),
    start: cleanText(input.start || "", 800),
    fail: cleanText(input.fail || "", 800),
  };
}

function cleanKey(value) {
  return KEYS.includes(value) ? value : "C";
}

function cleanScale(value) {
  return SCALES.some((scale) => scale.id === value) ? value : "major";
}

export function normalizeStack(input) {
  if (!input || typeof input !== "object") return null;
  const name = cleanName(input.name, 120);
  if (!name) return null;
  let daw = input.daw ? normalizePiece(input.daw, "daw", true) || emptyDaw() : emptyDaw();
  if (input.id === "stk-mobile-bandlab" && !daw.name) daw = { ...daw, name: "Bandlab" };
  const steps = Array.isArray(input.steps) ? input.steps.map(normalizeStep).filter(Boolean).slice(0, 80) : [];
  return {
    id: cleanId(input.id, "stk"),
    name,
    key: cleanKey(input.key),
    scale: cleanScale(input.scale),
    genre: cleanName(input.genre || "", 40),
    daw,
    monitor: monitorFrom(input.monitor),
    hardware: (Array.isArray(input.hardware) ? input.hardware : [])
      .map((item) => normalizePiece(item, "hardware"))
      .filter(Boolean)
      .slice(0, 40),
    plugins: (Array.isArray(input.plugins) ? input.plugins : [])
      .map(normalizePlugin)
      .filter(Boolean)
      .slice(0, 80),
    steps,
  };
}

function normalizeSession(input, known) {
  if (!input || typeof input !== "object") return null;
  const name = cleanName(input.name, 120);
  const stackId = typeof input.stackId === "string" ? input.stackId : "";
  if (!name || !stackId) return null;
  const checked = [];
  if (Array.isArray(input.checkedStepIds)) {
    for (const id of input.checkedStepIds) {
      if (typeof id === "string" && known.has(id) && !checked.includes(id)) checked.push(id);
      if (checked.length >= 100) break;
    }
  }
  return {
    id: cleanId(input.id, "ses"),
    name,
    stackId,
    mode: MODE_IDS.includes(input.mode) ? input.mode : "record",
    depth: input.depth === "advanced" ? "advanced" : "newbie",
    mixFocus: input.mixFocus === "vocal" || input.mixFocus === "beat" || input.mixFocus === "both" ? input.mixFocus : "",
    checkedStepIds: checked,
    notes: cleanText(input.notes || "", 4000),
  };
}

export function normalizeState(raw) {
  const stacks = (Array.isArray(raw?.stacks) ? raw.stacks : [])
    .map(normalizeStack)
    .filter(Boolean)
    .slice(0, 40);
  const sessions = (Array.isArray(raw?.sessions) ? raw.sessions : [])
    .map((session) => {
      const stack = stacks.find((item) => item.id === session?.stackId);
      const known = new Set((stack?.steps || []).map((step) => step.id));
      return normalizeSession(session, known);
    })
    .filter((session) => session && stacks.some((stack) => stack.id === session.stackId))
    .slice(0, 200);
  const activeStackId = stacks.some((stack) => stack.id === raw?.activeStackId) ? raw.activeStackId : stacks[0]?.id || null;
  const activeSessionId = sessions.some(
    (session) => session.id === raw?.activeSessionId && session.stackId === activeStackId,
  )
    ? raw.activeSessionId
    : sessions.find((session) => session.stackId === activeStackId)?.id || null;
  return {
    schema: SCHEMA,
    stacks,
    sessions,
    activeStackId,
    activeSessionId,
    view: VIEWS.includes(raw?.view) ? raw.view : "home",
  };
}

function freshSession(stackId, id) {
  return {
    id: id || uid("ses"),
    name: "Untitled session",
    stackId,
    mode: "record",
    depth: "newbie",
    mixFocus: "",
    checkedStepIds: [],
    notes: "",
  };
}

export function seedState() {
  const home = seedStack();
  const home2 = cloneSetup(home, "stk-home-2", "Home 2");
  const mobile = mobileSetup();
  return normalizeState({
    schema: SCHEMA,
    stacks: [home, home2, mobile],
    sessions: [
      freshSession(home.id, "ses-home"),
      freshSession(home2.id, "ses-home-2"),
      freshSession(mobile.id, "ses-mobile"),
    ],
    activeStackId: home.id,
    activeSessionId: "ses-home",
    view: "home",
  });
}

function readStored(storage, key) {
  if (!storage?.getItem) return { status: "missing" };
  const raw = storage.getItem(key);
  if (raw == null || String(raw).trim() === "") return { status: "empty" };
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schema === SCHEMA && Array.isArray(parsed.stacks)) return { status: "ok", parsed };
    return { status: "invalid" };
  } catch {
    return { status: "invalid" };
  }
}

export function upgradeLegacy(parsed) {
  const stacks = Array.isArray(parsed?.stacks) ? parsed.stacks.map((stack) => ({ ...stack })) : [];
  const sessions = Array.isArray(parsed?.sessions) ? parsed.sessions.map((session) => ({ ...session })) : [];
  const homeIndex = stacks.findIndex((stack) => stack.id === "stk-mkz-logic-home");
  if (homeIndex >= 0 && stacks[homeIndex].name === "MKZ Logic Home") {
    stacks[homeIndex] = { ...stacks[homeIndex], name: "Home" };
  }
  if (!stacks.some((stack) => stack.id === "stk-mkz-logic-home")) {
    stacks.unshift(seedStack());
    sessions.unshift(freshSession("stk-mkz-logic-home", "ses-home"));
  }
  if (!stacks.some((stack) => stack.id === "stk-home-2" || stack.name === "Home 2")) {
    const home = stacks.find((stack) => stack.id === "stk-mkz-logic-home") || seedStack();
    const copy = cloneSetup(home, "stk-home-2", "Home 2");
    stacks.push(copy);
    sessions.push(freshSession(copy.id, "ses-home-2"));
  }
  if (!stacks.some((stack) => stack.id === "stk-mobile-bandlab" || stack.name === "Mobile (Bandlab)")) {
    const mobile = mobileSetup();
    stacks.push(mobile);
    sessions.push(freshSession(mobile.id, "ses-mobile"));
  }
  return { ...parsed, schema: SCHEMA, stacks, sessions };
}

export function loadState(storage = globalThis.localStorage) {
  const current = readStored(storage, STORAGE_KEY);
  if (current.status === "ok") return normalizeState(current.parsed);
  if (current.status === "empty" || current.status === "missing") {
    const legacy = readStored(storage, LEGACY_KEY);
    if (legacy.status === "ok") {
      const state = normalizeState(upgradeLegacy(legacy.parsed));
      saveState(state, storage);
      return state;
    }
  }
  return seedState();
}

export function saveState(state, storage = globalThis.localStorage) {
  if (!storage?.setItem) return { ok: false, reason: "no-storage" };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    return { ok: false, reason: "blocked" };
  }
}

export function activeStack(state) {
  return state.stacks.find((stack) => stack.id === state.activeStackId) || null;
}

export function activeSession(state) {
  const session = state.sessions.find((item) => item.id === state.activeSessionId) || null;
  if (!session || session.stackId !== state.activeStackId) return null;
  return session;
}

export function sessionsForStack(state, stackId) {
  return state.sessions.filter((session) => session.stackId === stackId);
}

function mapStack(state, fn) {
  if (!activeStack(state)) return state;
  return {
    ...state,
    stacks: state.stacks.map((stack) => (stack.id === state.activeStackId ? fn(stack) : stack)),
  };
}

function mapSession(state, fn) {
  if (!activeSession(state)) return state;
  return {
    ...state,
    sessions: state.sessions.map((session) =>
      session.id === state.activeSessionId ? fn(session) : session,
    ),
  };
}

export function setView(state, view) {
  if (!VIEWS.includes(view)) return state;
  return { ...state, view };
}

export function setActiveStack(state, id) {
  if (!state.stacks.some((stack) => stack.id === id)) return state;
  const still = state.sessions.find((session) => session.id === state.activeSessionId && session.stackId === id);
  const next = still || state.sessions.find((session) => session.stackId === id) || null;
  return { ...state, activeStackId: id, activeSessionId: next ? next.id : null };
}

export function setActiveSession(state, id) {
  const session = state.sessions.find((item) => item.id === id && item.stackId === state.activeStackId);
  if (!session) return state;
  return { ...state, activeSessionId: session.id };
}

export function blankStack(name) {
  return normalizeStack({
    id: uid("stk"),
    name,
    daw: { id: uid("daw"), name: "", kind: "daw", modes: [], note: "", chain: {} },
    monitor: { id: uid("mon"), name: "", kind: "monitor", modes: [], note: "", chain: {} },
    hardware: [],
    plugins: [],
    steps: [],
  });
}

export function createStack(state, name, host) {
  const clean = cleanName(name, 120);
  if (!clean) return state;
  const stack = blankStack(clean);
  const hostName = cleanName(typeof host === "string" ? host : "", 80);
  if (hostName) stack.daw = { ...stack.daw, name: hostName, modes: [...MODE_IDS] };
  const session = freshSession(stack.id);
  return {
    ...state,
    stacks: [...state.stacks, stack],
    sessions: [...state.sessions, session],
    activeStackId: stack.id,
    activeSessionId: session.id,
  };
}

export function duplicateStack(state, id) {
  const source = state.stacks.find((stack) => stack.id === id);
  if (!source) return state;
  const copy = structuredClone(source);
  copy.id = uid("stk");
  copy.name = cleanName(`${source.name} copy`, 120);
  copy.daw = { ...copy.daw, id: uid("daw") };
  copy.monitor = { ...copy.monitor, id: uid("mon") };
  copy.hardware = copy.hardware.map((item) => ({ ...item, id: uid("hw") }));
  copy.plugins = copy.plugins.map((item) => ({ ...item, id: uid("pl") }));
  copy.steps = (copy.steps || []).map((step) => ({ ...step }));
  const session = freshSession(copy.id);
  return {
    ...state,
    stacks: [...state.stacks, copy],
    sessions: [...state.sessions, session],
    activeStackId: copy.id,
    activeSessionId: session.id,
  };
}

export function renameStack(state, id, name) {
  const clean = cleanName(name, 120);
  if (!clean) return state;
  return {
    ...state,
    stacks: state.stacks.map((stack) => (stack.id === id ? { ...stack, name: clean } : stack)),
  };
}

export function deleteStack(state, id) {
  const stacks = state.stacks.filter((stack) => stack.id !== id);
  const sessions = state.sessions.filter((session) => session.stackId !== id);
  const activeStackId = state.activeStackId === id ? stacks[0]?.id || null : state.activeStackId;
  const activeSessionId = sessions.some(
    (session) => session.id === state.activeSessionId && session.stackId === activeStackId,
  )
    ? state.activeSessionId
    : sessions.find((session) => session.stackId === activeStackId)?.id || null;
  return { ...state, stacks, sessions, activeStackId, activeSessionId };
}

export function createSession(state, name) {
  const clean = cleanName(name, 120);
  if (!clean || !state.activeStackId) return state;
  const session = { ...freshSession(state.activeStackId), name: clean };
  return { ...state, sessions: [...state.sessions, session], activeSessionId: session.id };
}

export function renameSession(state, id, name) {
  const clean = cleanName(name, 120);
  if (!clean) return state;
  return {
    ...state,
    sessions: state.sessions.map((session) => (session.id === id ? { ...session, name: clean } : session)),
  };
}

export function deleteSession(state, id) {
  const sessions = state.sessions.filter((session) => session.id !== id);
  const activeSessionId =
    state.activeSessionId === id
      ? sessions.find((session) => session.stackId === state.activeStackId)?.id || null
      : state.activeSessionId;
  return { ...state, sessions, activeSessionId };
}

export function setMode(state, mode) {
  if (!MODE_IDS.includes(mode)) return state;
  return mapSession(state, (session) => ({ ...session, mode }));
}

export function setHost(state, name) {
  const clean = cleanName(name, 80);
  if (!clean) return state;
  return mapStack(state, (stack) => ({ ...stack, daw: { ...stack.daw, name: clean } }));
}

export function setKeyScale(state, key, scale) {
  if (!KEYS.includes(key) || !SCALES.some((item) => item.id === scale)) return state;
  return mapStack(state, (stack) => ({ ...stack, key, scale }));
}

export function setGenre(state, genre) {
  return mapStack(state, (stack) => ({ ...stack, genre: cleanName(genre, 40) }));
}

export function setMixFocus(state, focus) {
  if (focus !== "vocal" && focus !== "beat" && focus !== "both") return state;
  return mapSession(state, (session) => ({ ...session, mixFocus: focus }));
}

export function setDepth(state, depth) {
  if (depth !== "newbie" && depth !== "advanced") return state;
  return mapSession(state, (session) => ({ ...session, depth }));
}

export function toggleStep(state, stepId) {
  const stack = activeStack(state);
  if (!stack?.steps?.some((step) => step.id === stepId)) return state;
  return mapSession(state, (session) => {
    const has = session.checkedStepIds.includes(stepId);
    return {
      ...session,
      checkedStepIds: has
        ? session.checkedStepIds.filter((id) => id !== stepId)
        : [...session.checkedStepIds, stepId],
    };
  });
}

export function updateStep(state, id, patch) {
  return mapStack(state, (stack) => ({
    ...stack,
    steps: stack.steps.map((step) => {
      if (step.id !== id) return step;
      return normalizeStep({ ...step, ...patch, id: step.id }) || step;
    }),
  }));
}

export function addStep(state, input) {
  const stack = activeStack(state);
  if (!stack) return state;
  const order = stack.steps.reduce((max, step) => Math.max(max, step.order || 0), 0) + 1;
  const step = normalizeStep({
    id: uid("step"),
    mode: input?.mode,
    order,
    title: input?.title,
    rule: input?.rule || "",
    start: input?.start || "",
    fail: input?.fail || "",
  });
  if (!step) return state;
  return mapStack(state, (current) => ({ ...current, steps: [...current.steps, step] }));
}

export function removeStep(state, id) {
  const stackId = state.activeStackId;
  const next = mapStack(state, (stack) => ({
    ...stack,
    steps: stack.steps.filter((step) => step.id !== id),
  }));
  return {
    ...next,
    sessions: next.sessions.map((session) =>
      session.stackId === stackId
        ? { ...session, checkedStepIds: session.checkedStepIds.filter((stepId) => stepId !== id) }
        : session,
    ),
  };
}

export function setNotes(state, notes) {
  return mapSession(state, (session) => ({ ...session, notes: cleanText(notes, 4000) }));
}

export function setPiece(state, kind, id, patch) {
  return mapStack(state, (stack) => {
    if (kind === "daw") {
      const next = normalizePiece({ ...stack.daw, ...patch, id: stack.daw.id }, "daw", true);
      return next ? { ...stack, daw: next } : stack;
    }
    if (kind === "monitor") {
      const next = normalizePiece({ ...stack.monitor, ...patch, id: stack.monitor.id }, "monitor", true);
      return next ? { ...stack, monitor: next } : stack;
    }
    return {
      ...stack,
      hardware: stack.hardware.map((item) => {
        if (item.id !== id) return item;
        return normalizePiece({ ...item, ...patch, id: item.id }, "hardware") || item;
      }),
    };
  });
}

export function addHardware(state, input) {
  const name = cleanName(input?.name, 80);
  if (!name) return state;
  const item = normalizePiece(
    {
      id: uid("hw"),
      name,
      modes: input.modes,
      note: input.note || "",
      doNotInvent: input.doNotInvent === true,
    },
    "hardware",
  );
  if (!item) return state;
  return mapStack(state, (stack) => ({ ...stack, hardware: [...stack.hardware, item] }));
}

export function removeHardware(state, id) {
  return mapStack(state, (stack) => ({
    ...stack,
    hardware: stack.hardware.filter((item) => item.id !== id),
  }));
}

export function addPlugin(state, input) {
  const plugin = normalizePlugin({
    id: uid("pl"),
    name: input?.name,
    group: input?.group,
    vendor: input?.vendor || "",
    doNotInvent: input?.doNotInvent === true,
    modes: input?.modes,
    note: input?.note || "",
  });
  if (!plugin) return state;
  return mapStack(state, (stack) => ({ ...stack, plugins: [...stack.plugins, plugin] }));
}

export function updatePlugin(state, id, patch) {
  return mapStack(state, (stack) => ({
    ...stack,
    plugins: stack.plugins.map((plugin) => {
      if (plugin.id !== id) return plugin;
      return normalizePlugin({ ...plugin, ...patch, id: plugin.id }) || plugin;
    }),
  }));
}

export function removePlugin(state, id) {
  return mapStack(state, (stack) => ({
    ...stack,
    plugins: stack.plugins.filter((plugin) => plugin.id !== id),
  }));
}

export function tone(item, mode) {
  if (!item || item.doNotInvent || item.owned === false) return "block";
  const modes = Array.isArray(item.modes) ? item.modes : [];
  return modes.includes(mode) ? "on" : "dim";
}

export function chainRank(item, mode) {
  const value = item?.chain?.[mode];
  return typeof value === "number" ? value : 1000;
}

export function rigPieces(stack) {
  if (!stack) return [];
  const out = [];
  if (stack.daw?.name) out.push(stack.daw);
  for (const item of stack.hardware || []) out.push(item);
  if (stack.monitor?.name) out.push(stack.monitor);
  for (const item of stack.plugins || []) out.push(item);
  return out;
}

export function piecesForBoard(stack, mode) {
  const rank = { on: 0, dim: 1, block: 2 };
  return rigPieces(stack)
    .slice()
    .sort((a, b) => {
      const byTone = rank[tone(a, mode)] - rank[tone(b, mode)];
      if (byTone) return byTone;
      const byChain = chainRank(a, mode) - chainRank(b, mode);
      if (byChain) return byChain;
      return a.name.localeCompare(b.name);
    });
}

export function stepsFor(stack, mode) {
  const steps = Array.isArray(stack?.steps) ? stack.steps : STEPS;
  return steps
    .filter((step) => step.mode === mode)
    .slice()
    .sort((a, b) => a.order - b.order);
}

export function exportRig(state, now = () => new Date().toISOString()) {
  const stack = activeStack(state);
  if (!stack) return null;
  return {
    schema: SCHEMA,
    kind: "rig",
    exportedAt: now(),
    stack,
    sessions: state.sessions.filter((session) => session.stackId === stack.id),
  };
}

export function exportLibrary(state, now = () => new Date().toISOString()) {
  return {
    schema: SCHEMA,
    kind: "library",
    exportedAt: now(),
    stacks: state.stacks,
    sessions: state.sessions,
    activeStackId: state.activeStackId,
    activeSessionId: state.activeSessionId,
  };
}

export function parseRig(text) {
  if (typeof text !== "string" || text.length > 1_000_000) {
    return { error: "That file is empty or over 1 MB." };
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: "That file is not JSON." };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { error: "JSON must be an object." };
  }
  if (data.schema !== SCHEMA) return { error: "Unknown file. Expected a GuideRec export." };
  if (data.kind === "library" || Array.isArray(data.stacks)) {
    const stacks = (Array.isArray(data.stacks) ? data.stacks : []).map(normalizeStack).filter(Boolean);
    if (!stacks.length) return { error: "Library file has no setups." };
    const ids = new Set(stacks.map((stack) => stack.id));
    const sessions = (Array.isArray(data.sessions) ? data.sessions : [])
      .map((session) => {
        const known = new Set((stacks.find((stack) => stack.id === session?.stackId)?.steps || []).map((step) => step.id));
        return normalizeSession(session, known);
      })
      .filter((session) => session && ids.has(session.stackId));
    return {
      kind: "library",
      stacks,
      sessions,
      activeStackId: typeof data.activeStackId === "string" ? data.activeStackId : stacks[0].id,
      activeSessionId: typeof data.activeSessionId === "string" ? data.activeSessionId : null,
    };
  }
  const stack = normalizeStack(data.stack);
  if (!stack) return { error: "That file is missing a setup name." };
  const known = new Set(stack.steps.map((step) => step.id));
  const sessions = (Array.isArray(data.sessions) ? data.sessions : [])
    .map((session) => normalizeSession({ ...session, stackId: stack.id }, known))
    .filter(Boolean);
  return { kind: "rig", stack, sessions };
}

function mergeById(current, incoming) {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}

export function applyImport(state, parsed) {
  if (!parsed || parsed.error) {
    return { state, error: parsed?.error || "Could not import that file." };
  }
  if (parsed.kind === "library") {
    const stacks = mergeById(state.stacks, parsed.stacks).slice(0, 40);
    const ids = new Set(stacks.map((stack) => stack.id));
    const sessions = mergeById(state.sessions, parsed.sessions)
      .filter((session) => ids.has(session.stackId))
      .slice(0, 200);
    const activeStackId = ids.has(parsed.activeStackId) ? parsed.activeStackId : stacks[0]?.id || null;
    const activeSessionId = sessions.some(
      (session) => session.id === parsed.activeSessionId && session.stackId === activeStackId,
    )
      ? parsed.activeSessionId
      : sessions.find((session) => session.stackId === activeStackId)?.id || null;
    return {
      state: { ...state, stacks, sessions, activeStackId, activeSessionId, view: "file" },
      error: "",
      notice: `Imported the library. ${parsed.stacks.length} setup${parsed.stacks.length === 1 ? "" : "s"} in the file.`,
    };
  }
  const stacks = mergeById(state.stacks, [parsed.stack]).slice(0, 40);
  const kept = mergeById(
    state.sessions.filter((session) => session.stackId !== parsed.stack.id),
    parsed.sessions,
  ).slice(0, 200);
  return {
    state: {
      ...state,
      stacks,
      sessions: kept,
      activeStackId: parsed.stack.id,
      activeSessionId: parsed.sessions[0]?.id || null,
      view: "file",
    },
    error: "",
    notice: `Imported ${parsed.stack.name}. ${parsed.sessions.length} session${parsed.sessions.length === 1 ? "" : "s"}.`,
  };
}
