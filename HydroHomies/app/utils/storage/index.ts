import AsyncStorage from "@react-native-async-storage/async-storage"
import { MMKV } from "react-native-mmkv"

/**
 * Synchronous key-value storage. Uses MMKV in dev/production builds; in Expo Go
 * (no MMKV native module) it falls back to an in-memory cache backed by
 * AsyncStorage, loaded once at startup.
 */
export interface StorageInterface {
  getString(key: string): string | undefined
  set(key: string, value: string): void
  delete(key: string): void
  clearAll(): void
  getAllKeys(): string[]
}

function createAsyncStorageFallback(): StorageInterface {
  const cache = new Map<string, string>()
  AsyncStorage.getAllKeys()
    .then((keys) => (keys.length ? AsyncStorage.multiGet(keys) : []))
    .then((pairs) => pairs.forEach(([key, value]) => value !== null && cache.set(key, value)))
    .catch(() => {})

  return {
    getString: (key) => cache.get(key),
    set(key, value) {
      cache.set(key, value)
      AsyncStorage.setItem(key, value).catch(() => {})
    },
    delete(key) {
      cache.delete(key)
      AsyncStorage.removeItem(key).catch(() => {})
    },
    clearAll() {
      cache.clear()
      AsyncStorage.clear().catch(() => {})
    },
    getAllKeys: () => [...cache.keys()],
  }
}

function createStorage(): StorageInterface {
  try {
    return new MMKV()
  } catch {
    console.warn("MMKV unavailable (Expo Go?); using AsyncStorage fallback")
    return createAsyncStorageFallback()
  }
}

export const storage = createStorage()

/**
 * Loads a string from storage.
 *
 * @param key The key to fetch.
 */
export function loadString(key: string): string | null {
  try {
    return storage.getString(key) ?? null
  } catch {
    // not sure why this would fail... even reading the RN docs I'm unclear
    return null
  }
}

/**
 * Saves a string to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export function saveString(key: string, value: string): boolean {
  try {
    storage.set(key, value)
    return true
  } catch {
    return false
  }
}

/**
 * Loads something from storage and runs it thru JSON.parse.
 *
 * @param key The key to fetch.
 */
export function load<T>(key: string): T | null {
  let almostThere: string | null = null
  try {
    almostThere = loadString(key)
    return JSON.parse(almostThere ?? "") as T
  } catch {
    return (almostThere as T) ?? null
  }
}

/**
 * Saves an object to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export function save(key: string, value: unknown): boolean {
  try {
    saveString(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Removes something from storage.
 *
 * @param key The key to kill.
 */
export function remove(key: string): void {
  try {
    storage.delete(key)
  } catch {}
}

/**
 * Burn it all to the ground.
 */
export function clear(): void {
  try {
    storage.clearAll()
  } catch {}
}
