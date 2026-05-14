import { offlineBibleService } from './offlineBibleService';

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleChapterData {
  reference: string;
  verses: BibleVerse[];
  text: string;
}

const CACHE_NAME = 'bible_cache_v1';
const MEMORY_CACHE: Record<string, BibleChapterData> = {};

export const fetchChapter = async (book: string, chapter: number, translation: string = 'kjv'): Promise<BibleChapterData> => {
  const cacheKey = `${translation}_${book}_${chapter}`.replace(/\s+/g, '_').toLowerCase();
  
  // 1. Check Offline Storage (IndexedDB)
  try {
    const offlineChapter = await offlineBibleService.getChapter(translation.toLowerCase(), book, chapter);
    if (offlineChapter && offlineChapter.data) {
      MEMORY_CACHE[cacheKey] = offlineChapter.data;
      return offlineChapter.data;
    }
  } catch (e) {
    console.warn("Offline fetch failed", e);
  }

  // 1.5 Check Memory Cache
  if (MEMORY_CACHE[cacheKey]) {
    return MEMORY_CACHE[cacheKey];
  }

  // 2. Check LocalStorage Cache
  try {
    const cached = localStorage.getItem(`${CACHE_NAME}_${cacheKey}`);
    if (cached) {
      const data = JSON.parse(cached) as BibleChapterData;
      MEMORY_CACHE[cacheKey] = data;
      return data;
    }
  } catch (e) {
    console.warn("Cache read failed", e);
  }

// 3. Fetch from API with retry logic
  let attempts = 0;
  const maxAttempts = 3;
  let lastError: any = null;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${translation.toLowerCase()}`);
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait longer
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempts + 1)));
        } else {
          throw new Error(`Failed to fetch Bible chapter (${translation}): ${response.statusText}`);
        }
      } else {
        const data = await response.json() as BibleChapterData;

        // 4. Update Caches
        MEMORY_CACHE[cacheKey] = data;
        try {
          localStorage.setItem(`${CACHE_NAME}_${cacheKey}`, JSON.stringify(data));
        } catch (e) {
          console.warn("Cache write failed", e);
        }

        return data;
      }
    } catch (error) {
      lastError = error;
      console.warn(`Fetch attempt ${attempts + 1} failed for ${book} ${chapter}`, error);
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
    }
    attempts++;
  }

  throw lastError || new Error(`Failed to fetch Bible chapter (${translation}) after ${maxAttempts} attempts`);
};

// Optional: Prefetch next chapter in background
export const prefetchChapter = (book: string, chapter: number, translation: string) => {
  const cacheKey = `${translation}_${book}_${chapter}`.replace(/\s+/g, '_').toLowerCase();
  if (!MEMORY_CACHE[cacheKey]) {
    fetchChapter(book, chapter, translation).catch(() => {});
  }
};

export const getVerse = async (reference: string, translation: string = 'kjv'): Promise<{ reference: string; text: string } | null> => {
  try {
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=${translation.toLowerCase()}`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      reference: data.reference,
      text: data.text
    };
  } catch (error) {
    console.error("Single verse fetch failed:", error);
    return null;
  }
};

export const bibleService = {
  fetchChapter,
  getVerse,
  prefetchChapter
};
