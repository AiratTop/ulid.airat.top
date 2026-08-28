const ULID_LIMITS = {
  countMin: 1,
  countMax: 10000,
};

const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const ui = {
  reset: document.querySelector("#resetDefaults"),
  ulid: {
    output: document.querySelector("#ulidOutput"),
    outputWrap: document.querySelector("#ulidOutputWrap"),
    count: document.querySelector("#ulidCount"),
    refresh: document.querySelector("#ulidRefresh"),
    copy: document.querySelector("#ulidCopy"),
    download: document.querySelector("#ulidDownload"),
    status: document.querySelector("#ulidStatus"),
  },
};

const state = {
  messageTimers: new Map(),
  ulidList: [],
  lastTimestamp: -1,
  lastRandomness: new Uint8Array(10),
};

const STORAGE_KEY = "ulid-airat-top-settings-v1";

const DEFAULTS = {
  count: 1,
};

function setStatus(target, message) {
  const existing = state.messageTimers.get(target);
  if (existing) {
    clearTimeout(existing);
  }
  target.textContent = message;
  if (!message) {
    return;
  }
  const timer = setTimeout(() => {
    target.textContent = "";
  }, 2400);
  state.messageTimers.set(target, timer);
}

function copyText(text, statusNode, label) {
  if (!text) {
    return;
  }
  const message = label ? `${label} copied.` : "Copied to clipboard.";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => setStatus(statusNode, message))
      .catch(() => setStatus(statusNode, "Copy failed."));
    return;
  }

  const fallback = document.createElement("textarea");
  fallback.value = text;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "absolute";
  fallback.style.left = "-9999px";
  document.body.appendChild(fallback);
  fallback.select();
  try {
    document.execCommand("copy");
    setStatus(statusNode, message);
  } catch (error) {
    setStatus(statusNode, "Copy failed.");
  }
  document.body.removeChild(fallback);
}

function clampNumber(value, min, max) {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function parseNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeSettings(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  return {
    count: clampNumber(parseNumber(safe.count, DEFAULTS.count), ULID_LIMITS.countMin, ULID_LIMITS.countMax),
  };
}

function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return normalizeSettings(JSON.parse(raw));
  } catch (error) {
    return null;
  }
}

function setStoredSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    // Ignore storage errors in private browsing and restricted contexts.
  }
}

function getCurrentSettings() {
  return {
    count: clampNumber(
      parseNumber(ui.ulid.count.value, DEFAULTS.count),
      ULID_LIMITS.countMin,
      ULID_LIMITS.countMax
    ),
  };
}

function storeSettings() {
  setStoredSettings(getCurrentSettings());
}

function setUlidCount(value) {
  const count = clampNumber(
    parseNumber(value, DEFAULTS.count),
    ULID_LIMITS.countMin,
    ULID_LIMITS.countMax
  );
  ui.ulid.count.value = `${count}`;
  return count;
}

function encodeTimestamp(timestamp) {
  let value = timestamp;
  const encoded = new Array(10);

  for (let index = encoded.length - 1; index >= 0; index -= 1) {
    encoded[index] = ULID_ALPHABET[value % 32];
    value = Math.floor(value / 32);
  }

  return encoded.join("");
}

function encodeRandomness(bytes) {
  let encoded = "";
  let buffer = 0;
  let bits = 0;

  bytes.forEach((byte) => {
    buffer = (buffer << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      bits -= 5;
      encoded += ULID_ALPHABET[(buffer >> bits) & 31];
    }

    buffer &= (1 << bits) - 1;
  });

  return encoded;
}

function incrementRandomness(bytes) {
  for (let index = bytes.length - 1; index >= 0; index -= 1) {
    if (bytes[index] < 255) {
      bytes[index] += 1;
      return;
    }
    bytes[index] = 0;
  }

  throw new Error("ULID randomness overflowed within one millisecond.");
}

function buildUlid() {
  if (!window.crypto || typeof window.crypto.getRandomValues !== "function") {
    throw new Error("Secure browser randomness is unavailable.");
  }

  const now = Date.now();
  const timestamp = Math.max(now, state.lastTimestamp);

  if (timestamp === state.lastTimestamp) {
    incrementRandomness(state.lastRandomness);
  } else {
    window.crypto.getRandomValues(state.lastRandomness);
    state.lastTimestamp = timestamp;
  }

  return `${encodeTimestamp(timestamp)}${encodeRandomness(state.lastRandomness)}`;
}

function buildUlidList(count) {
  const result = [];
  for (let index = 0; index < count; index += 1) {
    result.push(buildUlid());
  }
  return result;
}

function getUlidCopyText() {
  return state.ulidList.join("\n");
}

function getTimestampForFilename() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

function downloadTextFile(content, filename) {
  if (!content) {
    return;
  }
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function downloadUlidList() {
  const text = getUlidCopyText();
  if (!text) {
    setStatus(ui.ulid.status, "Nothing to download.");
    return;
  }
  const timestamp = getTimestampForFilename();
  const suffix = state.ulidList.length > 1 ? `-${state.ulidList.length}` : "";
  downloadTextFile(`${text}\n`, `ulid${suffix}-${timestamp}.txt`);
  setStatus(ui.ulid.status, "TXT downloaded.");
}

function refreshUlids() {
  const count = setUlidCount(ui.ulid.count.value);

  try {
    const next = buildUlidList(count);
    state.ulidList = next;
    ui.ulid.output.textContent = next.join("\n");
    ui.ulid.output.classList.toggle("is-single", count === 1);
  } catch (error) {
    state.ulidList = [];
    ui.ulid.output.textContent = "Unable to generate ULIDs in this browser.";
    ui.ulid.output.classList.add("is-single");
    setStatus(ui.ulid.status, error.message);
  }
}

function applySettings(settings) {
  const normalized = normalizeSettings(settings || DEFAULTS);
  setUlidCount(normalized.count);
}

function resetDefaults() {
  applySettings(DEFAULTS);
  refreshUlids();
  storeSettings();
}

function getCopyLabel() {
  return state.ulidList.length > 1 ? "ULID list" : "ULID";
}

function bindEvents() {
  if (ui.reset) {
    ui.reset.addEventListener("click", resetDefaults);
  }

  ui.ulid.refresh.addEventListener("click", () => {
    refreshUlids();
    storeSettings();
  });

  ui.ulid.copy.addEventListener("click", () => {
    copyText(getUlidCopyText(), ui.ulid.status, getCopyLabel());
  });

  ui.ulid.download.addEventListener("click", downloadUlidList);

  ui.ulid.outputWrap.addEventListener("click", () => {
    copyText(getUlidCopyText(), ui.ulid.status, getCopyLabel());
  });

  ui.ulid.count.addEventListener("input", () => {
    refreshUlids();
    storeSettings();
  });
}

const storedSettings = getStoredSettings();
applySettings(storedSettings || DEFAULTS);
bindEvents();
refreshUlids();
