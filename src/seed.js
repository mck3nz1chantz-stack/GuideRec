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
    text: "Clean noise, breaths, and mud before tone. Set the vocal level against the beat. Do not stack vocal suites.",
  },
  {
    id: "beat",
    label: "Beat",
    text: "Balance drums and bass first, then the rest of the music.",
  },
  {
    id: "both",
    label: "Both",
    text: "Beat balance first, then the vocal level against that beat, then the shared delay and reverb.",
  },
];

/**
 * Absolute levels that do not change with genre.
 * Spotify numbers are from Spotify for Artists, "Loudness normalization".
 * Record and mix-bus numbers are this app's practice levels.
 */
export const SHARED_LEVELS = {
  session: [
    "24-bit. Pick 44.1 kHz or 48 kHz and leave it.",
    "Name the session before the first take.",
    "Arm one track. Set the preamp on Level. Record is the last button.",
  ],
  record: [
    "Peaks about -12 to -6 dBFS. Average nearer -18 dBFS.",
    "0 dBFS is a clip. Turn the preamp down and do the take again.",
  ],
  mix: [
    "Mix-bus peaks around -6 dBFS.",
    "No limiter on the mix bus while the faders are still moving.",
  ],
  master: [
    "Spotify Normal plays at -14 LUFS integrated and turns hotter masters down. Loud is -11. Quiet is -19. Those are listener settings.",
    "True peak under -1 dBTP. Spotify asks for under -2 dBTP when the master is louder than -14 LUFS.",
    "One limiter at the end of the chain. About 1–3 dB of gain reduction is light. Past about 6 dB, listen for pumping.",
  ],
  note: "A vocal does not have its own dBFS law. Set it against the beat, then use the genre card for how hard to control it.",
};

/**
 * Starting points for a first mix. Plugin types only.
 * Gain reduction is how far the compressor turns the loud parts down.
 */
export const GENRE_GUIDES = [
  {
    id: "rap",
    label: "Rap",
    match: ["rap", "hip-hop", "hip hop", "trap"],
    vocal: "The words stay in front of the beat on every bar, including the quiet syllables.",
    control: "Start near 4–6 dB of gain reduction. A second compressor can catch peaks. Stop when the voice sounds smaller.",
    tone: "High-pass the vocal. Cut mud around 200–400 Hz only where it fights the kick and bass.",
    fx: "Very short room, or none. Delay as a throw on a send, then turn it down.",
    beat: {
      note: "Kick and bass first. The rest of the beat fits around them.",
      use: [
        "Kick: gain, then a compressor only if the hits are uneven. Leave the punch.",
        "Bass or 808: gain, and a high-pass only for rumble under the note.",
        "Snare or clap: subtractive EQ if it is boxy. A little saturator if it is thin.",
        "Hats: high-pass EQ. A compressor only if one hit jumps out.",
      ],
      skip: ["De-esser on drums.", "Reverb on the kick or the 808.", "A limiter on the drums while the faders still move."],
      detail: "Set the kick first. The snare sits a little under it, and the hats under both. The 808 can match the kick in the chorus and sit lower in the verse. If the kick vanishes, turn the 808 down before you add saturation.",
    },
    vocalPath: {
      note: "Keep the words even and dry.",
      use: [
        "Gain, high-pass EQ, and subtractive EQ where the vocal fights the 808.",
        "Compressor, about 4–6 dB of gain reduction. A second compressor only for peaks.",
        "De-esser on the S sounds.",
        "Delay as a throw on a send. Turn it down after you hear it.",
      ],
      skip: ["A hall or a long plate.", "Saturation if the vocal is already thick.", "A limiter on the vocal."],
      detail: "Ride the fader so the quiet syllables stay audible, then let the compressor even what is left. One delay throw on a word is enough. If the vocal sounds smaller, you have too much gain reduction.",
    },
    masterNote: "Rap masters are often hotter than -14 LUFS. That extra loudness is turned down on Spotify Normal, so only keep it if the 808 does not pump against the kick. If you are louder than -14, set true peak to -2 dBTP.",
    form: [
      "Count in 8 or 16 bars.",
      "A verse is often 16 bars. Bring the hook back often.",
      "Take drums away before the hook so the hook feels bigger.",
      "The intro can be short. End on the hook.",
    ],
  },
  {
    id: "rock",
    label: "Rock",
    match: ["rock", "punk", "indie"],
    vocal: "The vocal has to cut guitars without sitting on top of them like a podcast.",
    control: "Start near 3–6 dB of gain reduction. A slower attack lets the consonant through.",
    tone: "Cut mud around 200–400 Hz on guitars and vocal where they pile up. Cut harshness around 2–5 kHz only where it hurts.",
    fx: "Short room or a small plate on a send. A little saturation if the vocal is thin after compression.",
    beat: {
      note: "Drums and bass, then guitars tucked around them.",
      use: [
        "Kick and snare: gain, then a compressor with a slower attack so the hit stays.",
        "Bass: high-pass only the rumble. Subtractive EQ where it shares mud with the kick.",
        "Guitars: high-pass EQ and a cut around 200–400 Hz where they pile up.",
        "A short room send on the snare, quieter than the drum.",
      ],
      skip: ["De-esser on guitars or drums.", "A long hall on the kit.", "High-pass that thins the bass out."],
      detail: "Kick and snare are the loudest drums. Cymbals stay back. Guitars can be wide and still leave a gap in the middle for the vocal. If two guitars make mud, cut one of them instead of boosting both.",
    },
    vocalPath: {
      note: "The vocal cuts the guitars and still sounds like a person.",
      use: [
        "Gain, high-pass EQ, and a cut where the guitars and the vocal share mud.",
        "Compressor, about 3–6 dB, with a slower attack so the consonant gets through.",
        "De-esser before any brightness.",
        "Short room or a small plate on a send. A little saturator if the vocal is thin.",
      ],
      skip: ["A long hall on the lead.", "A delay that covers the words.", "A limiter on the vocal."],
      detail: "The chorus vocal can be a little louder than the verse. A short room puts it in the band. If the words get lost, lower a guitar before you brighten the vocal.",
    },
    masterNote: "Cymbals and the vocal show limiter strain before the guitars do. Stay nearer 2–4 dB of limiting. A flat wall of loudness makes the chorus smaller, not bigger.",
    form: [
      "Verse, chorus, verse, chorus, bridge, chorus.",
      "The chorus is the part someone can sing back. Repeat it.",
      "Keep the verse thinner. Make the chorus fuller.",
      "The bridge happens once, then the last chorus.",
    ],
  },
  {
    id: "rnb",
    label: "R&B",
    match: ["r&b", "rnb", "soul"],
    vocal: "The vocal stays smooth and close. Quiet notes can remain quiet.",
    control: "Start near 2–4 dB of gain reduction. Slower attack and release. Skip the second compressor if the first one is enough.",
    tone: "High-pass lightly. Leave the chest. Cut harshness around 2–5 kHz before you brighten anything.",
    fx: "A plate or a short hall on a send. A slow delay, quieter than the vocal. Saturation only if the tone is dull.",
    beat: {
      note: "The drums stay soft enough that the vocal has room.",
      use: [
        "Kick and bass: gain, and a gentle compressor if the low end wanders.",
        "Keys or guitar: subtractive EQ where they cover the vocal.",
        "Snare: a short plate send, turned down.",
        "Hats: high-pass EQ. Leave them quieter than the vocal.",
      ],
      skip: ["A fast compressor on keys.", "Reverb on the bass.", "Saturation on every drum."],
      detail: "Keep the drums quieter than you would in rap or rock. Keys and guitar carry the harmony and should duck where the vocal sings. The snare can have a short plate. The bass stays dry.",
    },
    vocalPath: {
      note: "Smooth and close. Quiet notes can stay quiet.",
      use: [
        "Gain and a light high-pass. Leave the chest.",
        "Compressor, about 2–4 dB, slower attack and release.",
        "De-esser before you brighten anything.",
        "A plate or a short hall on a send, plus a slow quiet delay.",
      ],
      skip: ["A second compressor if the first one is enough.", "Heavy saturation.", "A limiter on the vocal."],
      detail: "Let the soft notes stay soft. A slow compressor is for the jumps, not for every word. The plate should sit behind the vocal. If you can name the reverb while the vocal is singing, it is too loud.",
    },
    masterNote: "Leave the vocal dynamic. About 1–3 dB of limiting on the chorus is often enough. A hotter file will not play louder on Spotify Normal.",
    form: [
      "A short melodic hook, then space around it.",
      "Verse, pre-chorus, chorus. A quieter second verse is normal.",
      "Leave a breakdown before the last chorus.",
      "Save ad-libs for the last chorus.",
    ],
  },
  {
    id: "pop",
    label: "Pop",
    match: ["pop"],
    vocal: "The chorus vocal is the clearest sound in the song. The verse can sit a little farther back.",
    control: "Start near 3–6 dB of gain reduction. Use a de-esser on the S sounds before you brighten the vocal.",
    tone: "Cut mud, then a small boost only if the vocal is still dull. Do not brighten every track.",
    fx: "Short plate on a send. A short delay on a send for the chorus. Turn both down until they almost disappear.",
    beat: {
      note: "Drums and bass carry the chorus. The music does not out-sing the vocal.",
      use: [
        "Kick and snare: gain, then a compressor if the chorus drums jump.",
        "Bass: high-pass the rumble and a cut where it masks the kick.",
        "Guitars or synths: subtractive EQ in the vocal range.",
        "A short plate send on the snare only.",
      ],
      skip: ["De-esser on drums.", "Brightness on every instrument.", "A limiter on the music bus."],
      detail: "The chorus drums can come up. The verse drums can sit back. Bass and kick share the low end, so pick which one has the sub. Synths and guitars leave a pocket around 2–5 kHz for the vocal.",
    },
    vocalPath: {
      note: "The chorus vocal is the clearest sound. The verse can sit back a little.",
      use: [
        "Gain, high-pass EQ, and a mud cut before any boost.",
        "Compressor, about 3–6 dB.",
        "De-esser, then a small boost only if the vocal is still dull.",
        "Short plate and a short delay, both on sends, both turned down.",
      ],
      skip: ["Saturation on a vocal that is already bright.", "Printed reverb.", "A limiter on the vocal."],
      detail: "Verse vocal a little farther back, chorus vocal in front. De-ess before you add brightness. The plate and the delay are felt more than heard.",
    },
    masterNote: "The chorus will read louder than the whole-song integrated number. Judge integrated LUFS, not the drop. True peak -1 dBTP, or -2 dBTP if you are hotter than -14 LUFS.",
    form: [
      "Let the hook arrive early.",
      "Sections are often 8 bars: verse, pre-chorus, chorus.",
      "Repeat the title in the chorus.",
      "The last chorus can be bigger. Change the drums or the vocal, not the whole song.",
    ],
  },
  {
    id: "country",
    label: "Country",
    match: ["country", "folk", "singer"],
    vocal: "Leave the performance dynamic. The story matters more than a flat vocal.",
    control: "Start near 2–4 dB of gain reduction. If the compressor is working on every word, it is too much.",
    tone: "High-pass rumble. A small cut where the vocal and acoustic guitar share the same mud.",
    fx: "A small room on a send. Skip heavy saturation.",
    beat: {
      note: "The acoustic and the vocal share space. The drums stay light.",
      use: [
        "Acoustic guitar: high-pass rumble, then a small cut where it masks the vocal.",
        "Bass: gain, and a compressor only if notes disappear.",
        "Drums: gain. A compressor only on a snare that jumps.",
        "Electric guitar: subtractive EQ, quieter than the acoustic.",
      ],
      skip: ["Heavy saturation on the acoustic.", "A hall on the guitar.", "A fast compressor on the whole drum kit."],
      detail: "The acoustic guitar and the vocal cannot both own 200–400 Hz. Cut the guitar there first. Drums support the story. They do not need to hit as hard as a rock kit.",
    },
    vocalPath: {
      note: "Leave the story dynamic.",
      use: [
        "Gain and a high-pass for rumble.",
        "Compressor, about 2–4 dB. If it moves on every word, it is too much.",
        "De-esser, lightly.",
        "A small room on a send.",
      ],
      skip: ["A second compressor.", "Saturation.", "A long delay or a hall."],
      detail: "If a line is the point of the verse, ride that line up instead of compressing the whole vocal flat. A small room is enough to take the voice out of the headphones.",
    },
    masterNote: "Do not chase rap loudness. A master near -14 LUFS with only a couple of dB of limiting keeps the vocal human. If the story flattens, turn the limiter down.",
    form: [
      "Verses tell the story. The chorus says the point.",
      "Put the title in the chorus.",
      "Verse, chorus, verse, chorus, bridge, chorus.",
      "Keep the chorus easy to say back.",
    ],
  },
  {
    id: "electronic",
    label: "Electronic",
    match: ["electronic", "edm", "house", "dance", "techno"],
    vocal: "The kick and bass own the low end. The vocal sits in the space above them.",
    control: "Drums can take more compression than the vocal. On a sung vocal, start near 3–6 dB. On a chopped rap vocal, use the Rap card.",
    tone: "High-pass everything that is not kick or bass. Cut where the vocal masks the snare.",
    fx: "Delay and reverb on sends. Sidechain is a compressor on the music keyed by the kick, used only when the kick disappears.",
    beat: {
      note: "Kick and bass own the low end. Sidechain is for the music, not the kick.",
      use: [
        "Kick: gain. A compressor only to even the hits. Do not dull the click.",
        "Bass: high-pass under the note. Keep it out of the kick's punch.",
        "Clap and hats: high-pass EQ. Saturator only if the clap is thin.",
        "Synths: high-pass EQ. A sidechain compressor, keyed by the kick, only when the kick disappears.",
      ],
      skip: ["Reverb on the sub.", "De-esser on drums.", "A limiter while you are still balancing."],
      detail: "The kick is the clock. Bass can be as loud and still move out of the way with a sidechain compressor on the bass or the synths, keyed from the kick. Hats and claps sit above that, not on top of it.",
    },
    vocalPath: {
      note: "The vocal sits above the kick and bass. A chopped vocal can follow the Rap vocal list.",
      use: [
        "Gain and a high-pass. Cut where the vocal hides the clap.",
        "Compressor, about 3–6 dB on a sung vocal.",
        "De-esser if you brighten it.",
        "Delay and a short reverb on sends.",
      ],
      skip: ["Sidechain on the lead vocal.", "Reverb printed on the vocal.", "A limiter on the vocal."],
      detail: "A sung vocal uses the pop amount of compression. A chopped vocal uses the rap list: drier, more even, delay as a throw. Do not sidechain the lead. Sidechain is for the music under the kick.",
    },
    masterNote: "The kick will hit the limiter first. If the drop ducks, the kick and bass are too big in the mix. Do not add a second limiter to hide that.",
    form: [
      "Count in 8 and 16 bars.",
      "Intro, build, drop, breakdown, drop.",
      "The drop is the chorus. Take sounds away before it.",
      "A vocal can be a short loop. It does not need a full verse.",
    ],
  },
  {
    id: "metal",
    label: "Metal",
    match: ["metal", "hardcore"],
    vocal: "The vocal has to stay intelligible through dense guitars.",
    control: "Start near 4–6 dB of gain reduction. A second compressor can catch screams. Stop before the vocal lisps.",
    tone: "High-pass the guitars and the vocal. Cut the shared mud around 200–400 Hz so both can exist.",
    fx: "Short room on a send. Saturation if the vocal is thin. No long hall on the lead.",
    beat: {
      note: "Guitars are the dense part. Kick and bass still need a pocket.",
      use: [
        "Kick: gain and a compressor that leaves the click.",
        "Guitars: high-pass EQ and a cut around 200–400 Hz where the pair gets muddy.",
        "Bass: subtractive EQ so it is not a second guitar.",
        "Snare: a short room send, quieter than the guitars.",
      ],
      skip: ["A high-pass that makes the guitars tiny.", "A hall on the guitars.", "De-esser on guitars."],
      detail: "Guitars are loud, but the kick still needs a click and the bass still needs a note. Pan guitars apart so the vocal has the center. Cut mud on the guitars before you turn the vocal up.",
    },
    vocalPath: {
      note: "The words stay intelligible through the guitars.",
      use: [
        "Gain, high-pass EQ, and a cut in the shared mud around 200–400 Hz.",
        "Compressor, about 4–6 dB. A second compressor can catch screams.",
        "De-esser if the vocal lisps after compression.",
        "Saturator only if the vocal is thin, and a short room on a send.",
      ],
      skip: ["A long hall.", "Brightness that makes the vocal hiss.", "A limiter on the vocal."],
      detail: "Screams need a compressor that catches the peaks and a de-esser if the S sounds lisp. Stop adding compression when the vocal gets smaller. A short room is the only space it needs.",
    },
    masterNote: "Guitars turn harsh before the drums clip. If the top end goes white, turn the limiter down and cut a little 2–5 kHz in front of it, or fix the guitars in the mix.",
    form: [
      "The riff is the hook. Repeat it.",
      "A verse riff and a chorus riff can carry different weight.",
      "A breakdown changes the density, then the main riff comes back.",
      "Bring the heaviest part back before the song runs long.",
    ],
  },
];

export function guideForGenre(genre) {
  const text = String(genre || "").toLowerCase();
  if (!text.trim()) return null;
  return GENRE_GUIDES.find((item) => item.match.some((word) => text.includes(word))) || null;
}

/** One walkthrough for every setup. Plugin product names never belong in these lines. */
export const HABITS = [
  {
    id: "rec-session",
    mode: "record",
    order: 0,
    title: "Session",
    lines: SHARED_LEVELS.session,
  },
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
      "Peaks about -12 to -6 dBFS. Do not hit 0 dBFS.",
      "If the meter clips, turn the preamp down and do the take again.",
      "Average energy can sit nearer -18 dBFS. Leave that headroom for the mix.",
      "Start quiet, then turn up.",
      "Set the level before you reach for a compressor on the way in.",
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
    id: "cre-genre",
    mode: "create",
    order: 2,
    title: "Genre",
    kind: "genre",
    lines: [
      "Pick a type. The level card uses it on Mix and Master.",
      "Genre decides density. Plugin types do not decide the song.",
    ],
  },
  {
    id: "cre-form",
    mode: "create",
    order: 3,
    title: "Arrangement",
    kind: "arrangement",
    lines: [
      "Intro, verse, chorus, and out.",
      "Load the beat, the drums, or a click before a full take.",
      "Record the idea dry. Leave the mix moves for Mix.",
      "Do not write the song here. Do not arrange with plugins.",
    ],
  },
  {
    id: "mix-path",
    mode: "mix",
    order: 1,
    title: "Vocal, beat, or both",
    kind: "mix-choice",
  },
  {
    id: "mix-gain",
    mode: "mix",
    order: 2,
    title: "Gain",
    kind: "mix-gain",
    lines: [
      "Set clip or channel gain so the fader can sit near unity.",
      "If you need the fader at the bottom to make it quiet, the clip is too hot.",
    ],
  },
  {
    id: "mix-eq",
    mode: "mix",
    order: 3,
    title: "EQ",
    lines: [
      "Cut before you boost.",
      "Mud often sits around 200–400 Hz. Harshness often sits around 2–5 kHz.",
      "High-pass what does not need sub energy.",
      "Do not EQ every channel by habit.",
    ],
  },
  {
    id: "mix-comp",
    mode: "mix",
    order: 4,
    title: "Compress",
    lines: [
      "Start near 2–4 dB of gain reduction.",
      "Slow attack lets the hit through. Fast attack dulls it.",
      "Makeup gain brings back the level you just removed.",
      "If you cannot hear the change with the compressor in and out, it is not working.",
    ],
  },
  {
    id: "mix-sat",
    mode: "mix",
    order: 5,
    title: "Saturate",
    lines: [
      "Saturate only if the sound is thin or dull after the compressor. A little.",
      "If it gets smaller or fizzy, back off.",
    ],
  },
  {
    id: "mix-comp-2",
    mode: "mix",
    order: 6,
    title: "Second compressor",
    lines: [
      "Add a second compressor only when the first one is doing one job and you still need another.",
      "One evens the performance. One catches peaks.",
      "Skip it when 2–4 dB was enough.",
    ],
  },
  {
    id: "mix-fx",
    mode: "mix",
    order: 7,
    title: "Effects",
    lines: [
      "Put delay and reverb on a send. Do not print them on the dry track.",
      "One shared delay and one shared reverb.",
      "Set the send until you hear it, then lower it.",
    ],
  },
  {
    id: "mix-head",
    mode: "mix",
    order: 8,
    title: "Headroom",
    lines: [
      "Balance first.",
      "Mix-bus peaks around -6 dBFS, with a few dB still free.",
      "No limiter on the mix bus while the faders are still moving.",
      "Do not master inside the mix.",
    ],
  },
  {
    id: "mas-print",
    mode: "master",
    order: 1,
    title: "Print the mix",
    lines: [
      "Bounce a stereo file into a new session. Master the bounce, not the multitrack.",
      "24-bit, same sample rate as the mix. Do not convert it twice.",
      "Headphone correction off. Any mix-bus limiter off.",
      "Peaks still around -6 dBFS. If the bounce is already against 0, go back to the mix.",
    ],
  },
  {
    id: "mas-ref",
    mode: "master",
    order: 2,
    title: "Reference",
    lines: [
      "Load one finished record in this genre. Level-match it to your bounce before you judge tone. Louder always wins an unfair A/B.",
      "Listen on the speakers you mixed on, then one other system you know.",
      "Check the chorus and the quietest section. The master is the whole song.",
    ],
  },
  {
    id: "mas-eq",
    mode: "master",
    order: 3,
    title: "Corrective EQ",
    lines: [
      "Narrow cuts only. About 0.5–2 dB. Mud often sits around 200–400 Hz. Harshness often sits around 2–5 kHz.",
      "If a cut needs more than that, fix the mix.",
      "High-pass only real rumble, often under 30 Hz. Do not strip a bass record.",
      "No de-esser here. A lisp is a vocal problem.",
    ],
  },
  {
    id: "mas-glue",
    mode: "master",
    order: 4,
    title: "Glue",
    lines: [
      "One compressor, optional. It is for glue, not loudness.",
      "About 1–2 dB of gain reduction on the chorus. Slow attack so the snare still speaks.",
      "Bypass it. If the song gets smaller or the vocal lisps, take it off.",
    ],
  },
  {
    id: "mas-tone",
    mode: "master",
    order: 5,
    title: "Tone and mono",
    lines: [
      "Broad moves after the compressor. Shelves, low Q, half a dB to 1 dB.",
      "You can add a little side energy above 10 kHz. Do not widen below about 150 Hz. Bass stays in the center.",
      "Hit mono. Kick, bass, and the lead vocal still have to be there. If the low end disappears, it is too wide.",
    ],
  },
  {
    id: "mas-limit",
    mode: "master",
    order: 6,
    title: "Limiter",
    kind: "master-limit",
    lines: [
      "One limiter, last, in front of a loudness meter.",
      "Ceiling at -1 dBTP. If the master is louder than -14 LUFS integrated, set the ceiling to -2 dBTP. Spotify publishes both.",
      "About 1–3 dB of gain reduction is light. About 3–5 dB is a harder modern master. Past about 6 dB, stop and listen.",
      "Integrated LUFS is the whole song. The chorus will read louder on a short-term meter. Do not chase the chorus number.",
      "Spotify Normal plays at -14 LUFS and turns hotter masters down. Extra limiting is a tone choice, not a louder release.",
    ],
  },
  {
    id: "mas-listen",
    mode: "master",
    order: 7,
    title: "Listen back",
    lines: [
      "Level-match the reference again after the limiter. Then A/B.",
      "Mono check again. A limiter can change the sides.",
      "Turn the speakers down. If the vocal disappears, the balance is a mix problem.",
      "If the low end pumps or the vocal lisps, turn the limiter down. Do not add a de-esser on the master.",
    ],
  },
  {
    id: "mas-release",
    mode: "master",
    order: 8,
    title: "Release",
    lines: [
      "Export WAV, 24-bit, same sample rate, stereo. Re-measure the file. True peak still under the ceiling.",
      "Dither only when you reduce bit depth, such as 24-bit down to 16-bit. One dither, and it is the last process. A 24-bit delivery does not need it.",
      "Keep the pre-master bounce. Upload the WAV, not an MP3.",
      "If you are still unhappy with the tone, turn the limiter down and fix the mix. This is the last pass before release.",
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
