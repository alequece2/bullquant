import { useState, useEffect } from 'react';

export type RecentSearch = {
  ticker: string;
  name: string;
  exchange: string;
  logoUrl: string | null;
};

const MAX_RECENT_SEARCHES = 5;
const STORAGE_KEY = 'bullquant_recent_searches';

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  const addSearch = (search: RecentSearch) => {
    setRecentSearches((prev) => {
      // Remove if already exists to move it to the top
      const filtered = prev.filter((s) => s.ticker !== search.ticker);
      const newSearches = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSearches));
      } catch (e) {
        console.error('Failed to save recent search', e);
      }
      
      return newSearches;
    });
  };

  const removeSearch = (ticker: string) => {
    setRecentSearches((prev) => {
      const newSearches = prev.filter((s) => s.ticker !== ticker);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSearches));
      } catch (e) {
        console.error('Failed to save recent search', e);
      }
      return newSearches;
    });
  };

  const clearSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear recent searches', e);
    }
  };

  return {
    recentSearches: isClient ? recentSearches : [],
    addSearch,
    removeSearch,
    clearSearches,
    isClient,
  };
}
