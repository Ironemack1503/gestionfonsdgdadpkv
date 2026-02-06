import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface CacheConfig {
  key: string;
  maxAge?: number; // in milliseconds, default 24 hours
}

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = 'dgda_cache_';

/**
 * Save data to localStorage with timestamp
 */
export function saveToCache<T>(key: string, data: T): void {
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
  } catch (error) {
    // localStorage might be full or disabled
    console.warn('Failed to save to cache:', error);
  }
}

/**
 * Get data from localStorage if not expired
 */
export function getFromCache<T>(key: string, maxAge: number = DEFAULT_MAX_AGE): T | null {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const { data, timestamp }: CachedData<T> = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > maxAge;

    if (isExpired) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to read from cache:', error);
    return null;
  }
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  localStorage.removeItem(`${CACHE_PREFIX}${key}`);
}

/**
 * Clear all app cache
 */
export function clearAllCache(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  keys.forEach(key => localStorage.removeItem(key));
}

/**
 * Hook to persist React Query data to localStorage
 */
export function useQueryPersistence() {
  const queryClient = useQueryClient();

  // Restore cached data on mount
  useEffect(() => {
    const keysToRestore = [
      'dashboard-stats',
      'rubriques',
      'programmations',
    ];

    keysToRestore.forEach(key => {
      const cachedData = getFromCache(key);
      if (cachedData) {
        queryClient.setQueryData([key], cachedData);
      }
    });
  }, [queryClient]);

  // Save data to cache when queries succeed
  const persistQuery = useCallback((queryKey: string, data: unknown) => {
    if (data) {
      saveToCache(queryKey, data);
    }
  }, []);

  return { persistQuery };
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { count: number; size: string } {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  let totalSize = 0;
  
  keys.forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      totalSize += item.length * 2; // UTF-16 = 2 bytes per char
    }
  });

  return {
    count: keys.length,
    size: totalSize < 1024 
      ? `${totalSize} B` 
      : totalSize < 1024 * 1024 
        ? `${(totalSize / 1024).toFixed(1)} KB`
        : `${(totalSize / (1024 * 1024)).toFixed(1)} MB`,
  };
}
