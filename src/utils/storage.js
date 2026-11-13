import { BACKUP_KEYS, LAST_BACKUP_KEY } from "../config";

export const STORAGE_ERROR_EVENT = "clinic-storage-error";
export const STORAGE_OK_EVENT = "clinic-storage-ok";
export const STORAGE_DATA_EVENT = "clinic-storage-data";
const DB_NAME = "noor-jahan-memorial-clinic";
const DB_VERSION = 1;
const STORE_NAME = "datasets";
const FALLBACK_MARKER_KEY = "clinic_idb_fallback_active";
const cache = new Map();
let dbPromise;
let failing = false;
let changeChannel = null;
try {
  if (typeof BroadcastChannel !== "undefined") changeChannel = new BroadcastChannel("noor-jahan-clinic-data");
} catch { /* cross-tab messaging is an optional enhancement */ }
if (changeChannel) {
  changeChannel.onmessage = ({ data }) => {
    if (!data || typeof data.key !== "string") return;
    cache.set(data.key, data.value);
    window.dispatchEvent(new CustomEvent(STORAGE_DATA_EVENT, { detail: data }));
  };
}

function announceDatasetChange(key, value) {
  changeChannel?.postMessage({ key, value });
}

export const isStorageFailing = () => failing;

function signalStorageFailure(error) {
  console.error("Unable to persist clinic data in this browser.", error);
  if (!failing) {
    failing = true;
    window.dispatchEvent(new Event(STORAGE_ERROR_EVENT));
  }
}

function signalStorageSuccess() {
  if (failing) {
    failing = false;
    window.dispatchEvent(new Event(STORAGE_OK_EVENT));
  }
}

function openDatabase() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable"));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "key" });
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => reject(request.error || new Error("Could not open IndexedDB"));
      request.onblocked = () => reject(new Error("IndexedDB upgrade is blocked by another open tab"));
    }).catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

function parseLegacyValue(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch (error) {
    console.warn(`Could not read legacy clinic storage key: ${key}`, error);
    return undefined;
  }
}

function writeLegacyMirror(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // IndexedDB is the durable primary store; a full localStorage mirror must
    // not prevent a successful IndexedDB save.
    console.warn(`Legacy localStorage mirror unavailable for ${key}.`, error);
    return false;
  }
}

/**
 * Run once before React mounts. Existing localStorage values are copied to
 * IndexedDB only when that dataset has not already been migrated. Originals
 * are intentionally retained for backup compatibility and rollback safety.
 */
export async function initializeClinicStorage() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    let preferLegacy = false;
    try { preferLegacy = localStorage.getItem(FALLBACK_MARKER_KEY) === "true"; } catch { /* marker unavailable */ }
    const values = await Promise.all(BACKUP_KEYS.map((key) => new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result && !preferLegacy) {
          resolve([key, request.result.value]);
          return;
        }
        const legacy = parseLegacyValue(key);
        if (legacy !== undefined) {
          store.put({ key, value: legacy, migratedAt: new Date().toISOString() });
          resolve([key, legacy]);
          return;
        }
        // A missing localStorage mirror does not mean an IndexedDB-only
        // dataset is empty (e.g. a previous mirror write may have hit quota).
        resolve([key, request.result?.value]);
      };
      request.onerror = () => reject(request.error);
    })));
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("Clinic data migration failed"));
      tx.onabort = () => reject(tx.error || new Error("Clinic data migration was interrupted"));
    });
    const verification = db.transaction(STORE_NAME, "readonly");
    const verifiedValues = await Promise.all(BACKUP_KEYS.map((key) => new Promise((resolve, reject) => {
      const request = verification.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve([key, request.result?.value]);
      request.onerror = () => reject(request.error);
    })));
    await new Promise((resolve, reject) => {
      verification.oncomplete = resolve;
      verification.onerror = () => reject(verification.error || new Error("Migration verification failed"));
      verification.onabort = () => reject(verification.error || new Error("Migration verification was interrupted"));
    });
    values.forEach(([key, value]) => {
      if (value !== undefined) cache.set(key, value);
    });
    verifiedValues.forEach(([key, value]) => {
      const expected = values.find(([sourceKey]) => sourceKey === key)?.[1];
      if (Array.isArray(expected) && (!Array.isArray(value) || value.length !== expected.length)) {
        throw new Error(`IndexedDB migration count validation failed for ${key}`);
      }
    });
    if (preferLegacy) {
      try { localStorage.removeItem(FALLBACK_MARKER_KEY); } catch { /* leave marker for the next startup */ }
    }
    signalStorageSuccess();
    return { mode: "indexeddb", loadedKeys: values.filter(([, value]) => value !== undefined).map(([key]) => key), recordCounts: Object.fromEntries(values.map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])) };
  } catch (error) {
    // A browser with blocked/disabled IndexedDB can still use the original
    // localStorage architecture; the visible StorageAlert reports write loss.
    console.error("IndexedDB initialization failed; using legacy storage fallback.", error);
    BACKUP_KEYS.forEach((key) => {
      const value = parseLegacyValue(key);
      if (value !== undefined) cache.set(key, value);
    });
    signalStorageFailure(error);
    return { mode: "localstorage-fallback", loadedKeys: [], recordCounts: {} };
  }
}

export function getStoredJSON(key, fallback) {
  if (cache.has(key)) return cache.get(key);
  const value = parseLegacyValue(key);
  return value === undefined ? fallback : value;
}

/** Persist a whole dataset in IndexedDB and maintain the old backup mirror. */
export function saveJSON(key, value) {
  cache.set(key, value);
  announceDatasetChange(key, value);
  const legacySaved = writeLegacyMirror(key, value);
  return openDatabase().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ key, value, updatedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("IndexedDB write failed"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB write aborted"));
  })).catch((error) => {
    if (legacySaved) {
      try { localStorage.setItem(FALLBACK_MARKER_KEY, "true"); } catch { /* marker cannot be persisted */ }
    }
    signalStorageFailure(error);
    return legacySaved;
  });
}

/** Atomically read-modify-write a dataset (including token sequence updates). */
export async function updateStoredJSON(key, updater, fallback = []) {
  try {
    const db = await openDatabase();
    const next = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      let updated;
      request.onsuccess = () => {
        const current = request.result ? request.result.value : getStoredJSON(key, fallback);
        try {
          updated = updater(current);
          store.put({ key, value: updated, updatedAt: new Date().toISOString() });
        } catch (error) {
          tx.abort();
          reject(error);
        }
      };
      request.onerror = () => reject(request.error || new Error("Could not read clinic data"));
      tx.oncomplete = () => resolve(updated);
      tx.onerror = () => reject(tx.error || new Error("Clinic data update failed"));
      tx.onabort = () => reject(tx.error || new Error("Clinic data update was aborted"));
    });
    cache.set(key, next);
    announceDatasetChange(key, next);
    writeLegacyMirror(key, next);
    return next;
  } catch (error) {
    // Preserve fallback writes across reloads: on the next start localStorage
    // is preferred until IndexedDB can be brought back in sync.
    const current = getStoredJSON(key, fallback);
    const next = updater(current);
    const legacySaved = writeLegacyMirror(key, next);
    if (!legacySaved) {
      signalStorageFailure(error);
      throw error;
    }
    try { localStorage.setItem(FALLBACK_MARKER_KEY, "true"); } catch { /* warning remains visible */ }
    cache.set(key, next);
    announceDatasetChange(key, next);
    signalStorageFailure(error);
    return next;
  }
}

export async function restoreStoredDatasets(rawValues) {
  const parsed = {};
  BACKUP_KEYS.forEach((key) => {
    if (typeof rawValues[key] === "string") parsed[key] = JSON.parse(rawValues[key]);
    else parsed[key] = undefined;
  });

  let indexedDbRestoreSucceeded = false;
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      BACKUP_KEYS.forEach((key) => {
        if (parsed[key] === undefined) store.delete(key);
        else store.put({ key, value: parsed[key], updatedAt: new Date().toISOString() });
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("Restore failed"));
      tx.onabort = () => reject(tx.error || new Error("Restore was interrupted"));
    });
    indexedDbRestoreSucceeded = true;
  } catch (error) {
    console.warn("IndexedDB restore failed; attempting legacy restore.", error);
    signalStorageFailure(error);
  }

  let legacyRestoreSucceeded = true;
  BACKUP_KEYS.forEach((key) => {
    if (parsed[key] === undefined) {
      cache.delete(key);
      try { localStorage.removeItem(key); } catch { legacyRestoreSucceeded = false; }
    } else {
      cache.set(key, parsed[key]);
      if (!writeLegacyMirror(key, parsed[key])) legacyRestoreSucceeded = false;
    }
  });
  if (legacyRestoreSucceeded && !indexedDbRestoreSucceeded) {
    // If IndexedDB restore failed, keep the marker so next boot reads the
    // just-restored localStorage backup rather than stale IndexedDB values.
    try { localStorage.setItem(FALLBACK_MARKER_KEY, "true"); } catch { /* storage failure already reported */ }
  } else if (indexedDbRestoreSucceeded) {
    try { localStorage.removeItem(FALLBACK_MARKER_KEY); } catch { /* marker cleanup can wait */ }
  }
}

export function getLastBackup() {
  try { return localStorage.getItem(LAST_BACKUP_KEY); } catch { return null; }
}

export function markBackupDone() {
  try { localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString()); } catch { /* backup file still exists */ }
}
