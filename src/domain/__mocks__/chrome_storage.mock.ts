import { vi } from "vitest";

/* eslint functional/immutable-data: off, functional/no-let: off */

// Mock data store
const mockStorage = new Map<string, unknown>();

// Mock implementations
export const mockChromeStorage = {
  local: {
    get: vi
      .fn()
      .mockImplementation(
        async (
          keys?: string | string[] | Record<string, unknown>,
        ): Promise<Record<string, unknown>> => {
          if (!keys) {
            // Return all items
            const result: Record<string, unknown> = {};
            for (const [key, value] of mockStorage.entries()) {
              result[key] = value;
            }
            return result;
          }

          if (typeof keys === "string") {
            // Single key
            const value = mockStorage.get(keys);
            return value !== undefined ? { [keys]: value } : {};
          }

          if (Array.isArray(keys)) {
            // Array of keys
            const result: Record<string, unknown> = {};
            for (const key of keys) {
              const value = mockStorage.get(key);
              if (value !== undefined) {
                result[key] = value;
              }
            }
            return result;
          }

          if (typeof keys === "object") {
            // Object with default values
            const result: Record<string, unknown> = {};
            for (const [key, defaultValue] of Object.entries(keys)) {
              const value = mockStorage.get(key);
              result[key] = value !== undefined ? value : defaultValue;
            }
            return result;
          }

          return {};
        },
      ),

    set: vi
      .fn()
      .mockImplementation(
        async (items: Record<string, unknown>): Promise<void> => {
          for (const [key, value] of Object.entries(items)) {
            mockStorage.set(key, value);
          }
        },
      ),
  },
};

// Test utilities
export const mockStorageUtils = {
  clear: () => {
    mockStorage.clear();
  },

  setItem: (key: string, value: unknown) => {
    mockStorage.set(key, value);
  },

  getItem: (key: string) => {
    return mockStorage.get(key);
  },

  removeItem: (key: string) => {
    mockStorage.delete(key);
  },

  getAllItems: (): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of mockStorage.entries()) {
      result[key] = value;
    }
    return result;
  },

  hasItem: (key: string): boolean => {
    return mockStorage.has(key);
  },

  size: (): number => {
    return mockStorage.size;
  },
};

// Setup global chrome object for tests
export function setupChromeStorageMock() {
  global.chrome = {
    ...global.chrome,
    storage: mockChromeStorage as unknown as typeof chrome.storage,
  } as unknown as typeof global.chrome;
  mockStorage.clear();
}

// Reset function for beforeEach in tests
export function resetChromeStorageMock() {
  mockStorageUtils.clear();
  vi.clearAllMocks();
}
