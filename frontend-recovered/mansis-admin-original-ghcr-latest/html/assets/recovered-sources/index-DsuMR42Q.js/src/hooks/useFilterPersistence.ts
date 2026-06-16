import { useState, useEffect, useCallback } from 'react';

const STORAGE_PREFIX = 'filter_';

function getStorageKey(pageKey: string): string {
  return `${STORAGE_PREFIX}${pageKey}`;
}

function readFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = sessionStorage.getItem(getStorageKey(key));
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.warn(`Failed to read filters from storage for key: ${key}`, error);
  }
  return defaultValue;
}

function writeToStorage<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to write filters to storage for key: ${key}`, error);
  }
}

function clearFromStorage(key: string): void {
  try {
    sessionStorage.removeItem(getStorageKey(key));
  } catch (error) {
    console.warn(`Failed to clear filters from storage for key: ${key}`, error);
  }
}

interface UseFilterPersistenceReturn<T> {
  persistedValue: T;
  setPersisted: (value: T) => void;
  clearPersisted: () => void;
}

export function useFilterPersistence<T>(
  pageKey: string,
  defaultValue: T
): UseFilterPersistenceReturn<T> {
  const [persistedValue, setPersistedValue] = useState<T>(() =>
    readFromStorage(pageKey, defaultValue)
  );

  const setPersisted = useCallback(
    (value: T) => {
      setPersistedValue(value);
      writeToStorage(pageKey, value);
    },
    [pageKey]
  );

  const clearPersisted = useCallback(() => {
    setPersistedValue(defaultValue);
    clearFromStorage(pageKey);
  }, [pageKey, defaultValue]);

  useEffect(() => {
    const stored = readFromStorage(pageKey, defaultValue);
    setPersistedValue(stored);
  }, [pageKey]);

  return {
    persistedValue,
    setPersisted,
    clearPersisted
  };
}
