import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'imperial_bible_store';
const TRANS_STORE = 'translations';
const CHAPTER_STORE = 'chapters';
const DB_VERSION = 2; // Incremented version

interface TranslationData {
  id: string; // e.g. "kjv"
  name: string;
  metadata: any;
  timestamp: number;
}

interface ChapterData {
  id: string; // e.g. "kjv_genesis_1"
  translationId: string;
  book: string;
  chapter: number;
  data: any;
}

class OfflineBibleService {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  private async getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
          if (!db.objectStoreNames.contains(TRANS_STORE)) {
            db.createObjectStore(TRANS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(CHAPTER_STORE)) {
            db.createObjectStore(CHAPTER_STORE, { keyPath: 'id' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  async saveTranslation(id: string, name: string, metadata: any) {
    const db = await this.getDB();
    await db.put(TRANS_STORE, {
      id,
      name,
      metadata,
      timestamp: Date.now()
    });
  }

  async saveChapter(translationId: string, book: string, chapter: number, data: any) {
    const db = await this.getDB();
    const id = `${translationId}_${book}_${chapter}`.replace(/\s+/g, '_').toLowerCase();
    await db.put(CHAPTER_STORE, {
      id,
      translationId,
      book,
      chapter,
      data
    });
  }

  async getChapter(translationId: string, book: string, chapter: number) {
    const db = await this.getDB();
    const id = `${translationId}_${book}_${chapter}`.replace(/\s+/g, '_').toLowerCase();
    return db.get(CHAPTER_STORE, id);
  }

  async getTranslation(id: string) {
    const db = await this.getDB();
    return db.get(TRANS_STORE, id);
  }

  async getAllDownloaded() {
    const db = await this.getDB();
    return db.getAll(TRANS_STORE);
  }

  async deleteTranslation(id: string) {
    const db = await this.getDB();
    await db.delete(TRANS_STORE, id);
    
    // Also delete all chapters for this translation
    const tx = db.transaction(CHAPTER_STORE, 'readwrite');
    const store = tx.objectStore(CHAPTER_STORE);
    let cursor = await store.openCursor();
    
    while (cursor) {
      if (cursor.value.translationId === id) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  async isDownloaded(id: string): Promise<boolean> {
    const trans = await this.getTranslation(id);
    return !!trans;
  }
}

export const offlineBibleService = new OfflineBibleService();
