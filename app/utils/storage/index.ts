import { MMKV } from "react-native-mmkv"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"

// Create a storage interface that works in both Expo Go and dev builds
// MMKV requires native code (not available in Expo Go), so we use AsyncStorage as fallback
interface StorageInterface {
  getString(key: string): string | undefined
  set(key: string, value: string): void
  delete(key: string): void
  clearAll(): void
}

// Try to use MMKV (works in dev builds with native code)
// Fall back to AsyncStorage wrapper (works in Expo Go)
let storage: StorageInterface

try {
  const mmkv = new MMKV()
  storage = mmkv as unknown as StorageInterface
} catch (error) {
  // MMKV failed (likely in Expo Go), use AsyncStorage with sync wrapper
  console.warn("MMKV not available, using AsyncStorage fallback for Expo Go:", error)
  
  // AsyncStorage sync wrapper using a cache
  const cache = new Map<string, string>()
  let cacheInitialized = false
  
  // Initialize cache from AsyncStorage (one-time async load)
  AsyncStorage.getAllKeys().then((keys) => {
    if (keys.length > 0) {
      return AsyncStorage.multiGet(keys)
    }
    return []
  }).then((pairs) => {
    pairs.forEach(([key, value]) => {
      if (value) cache.set(key, value)
    })
    cacheInitialized = true
  }).catch(() => {
    cacheInitialized = true
  })
  
  // Create sync wrapper for AsyncStorage
  storage = {
    getString(key: string): string | undefined {
      // Return from cache if available, otherwise undefined
      // Cache will be populated asynchronously on first load
      return cache.get(key) ?? undefined
    },
    
    set(key: string, value: string): void {
      cache.set(key, value)
      // Async write (fire and forget)
      AsyncStorage.setItem(key, value).catch(() => {})
    },
    
    delete(key: string): void {
      cache.delete(key)
      // Async delete (fire and forget)
      AsyncStorage.removeItem(key).catch(() => {})
    },
    
    clearAll(): void {
      cache.clear()
      // Async clear (fire and forget)
      AsyncStorage.clear().catch(() => {})
    },
  }
}

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
