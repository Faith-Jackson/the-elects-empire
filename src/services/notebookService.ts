import { openDB, IDBPDatabase } from 'idb';
import { supabase } from '../lib/supabase';

const DB_NAME = 'elects_notebook_store';
const FOLDER_STORE = 'folders';
const NOTE_STORE = 'notes';
const SYNC_QUEUE_STORE = 'sync_queue';
const DB_VERSION = 1;

export interface NotebookFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  deletedAt?: string;
}

export type NoteType = 'general' | 'vision' | 'sermon';

export interface NotebookNote {
  id: string;
  folderId: string | null;
  title: string;
  content: string;
  tags: string[];
  type: NoteType;
  metadata?: {
    scriptureRef?: string;
    dateOfVision?: string;
    interpretation?: string;
    outline?: string[];
  };
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isSynced: boolean;
  deletedAt?: string;
}

interface SyncItem {
  id: string;
  type: 'note' | 'folder';
  action: 'upsert' | 'delete';
  timestamp: number;
}

class NotebookService {
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private isSyncing = false;

  private async getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(FOLDER_STORE)) {
            db.createObjectStore(FOLDER_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(NOTE_STORE)) {
            const noteStore = db.createObjectStore(NOTE_STORE, { keyPath: 'id' });
            noteStore.createIndex('folderId', 'folderId', { unique: false });
          }
          if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
            db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  // Folders
  async getFolders(): Promise<NotebookFolder[]> {
    const db = await this.getDB();
    return db.getAll(FOLDER_STORE);
  }

  async saveFolder(folder: NotebookFolder) {
    const db = await this.getDB();
    await db.put(FOLDER_STORE, { ...folder, deletedAt: undefined });
    await this.addToSyncQueue(folder.id, 'folder', 'upsert');
    this.triggerSync();
  }

  async deleteFolder(id: string) {
    const db = await this.getDB();
    const folder = await db.get(FOLDER_STORE, id);
    if (folder) {
      const deletedFolder = { ...folder, deletedAt: new Date().toISOString() };
      await db.put(FOLDER_STORE, deletedFolder);
      await this.addToSyncQueue(id, 'folder', 'upsert'); // Sync as update with deletedAt
    }
    this.triggerSync();
  }

  // Notes
  async getNotes(folderId?: string | null): Promise<NotebookNote[]> {
    const db = await this.getDB();
    let all: NotebookNote[] = [];
    if (folderId !== undefined) {
      all = await db.getAllFromIndex(NOTE_STORE, 'folderId', folderId);
    } else {
      all = await db.getAll(NOTE_STORE);
    }
    return all.filter(n => !n.deletedAt);
  }

  async getNote(id: string): Promise<NotebookNote | undefined> {
    const db = await this.getDB();
    const note = await db.get(NOTE_STORE, id);
    return note?.deletedAt ? undefined : note;
  }

  async saveNote(note: NotebookNote) {
    const db = await this.getDB();
    await db.put(NOTE_STORE, { ...note, isSynced: false, deletedAt: undefined });
    await this.addToSyncQueue(note.id, 'note', 'upsert');
    this.triggerSync();
  }

  async deleteNote(id: string) {
    const db = await this.getDB();
    const note = await db.get(NOTE_STORE, id);
    if (note) {
      const deletedNote = { ...note, deletedAt: new Date().toISOString(), isSynced: false };
      await db.put(NOTE_STORE, deletedNote);
      await this.addToSyncQueue(id, 'note', 'upsert'); // Sync as update with deletedAt
    }
    this.triggerSync();
  }

  // Sync logic
  private async addToSyncQueue(id: string, type: 'note' | 'folder', action: 'upsert' | 'delete') {
    const db = await this.getDB();
    await db.put(SYNC_QUEUE_STORE, { id, type, action, timestamp: Date.now() });
  }

  async triggerSync() {
    if (this.isSyncing) return;
    if (!navigator.onLine) return;

    this.isSyncing = true;
    try {
      const db = await this.getDB();
      const queue: SyncItem[] = await db.getAll(SYNC_QUEUE_STORE);
      
      if (queue.length === 0) {
        await this.pullFromServer();
        return;
      }

      for (const item of queue) {
        try {
          if (item.type === 'note') {
            if (item.action === 'upsert') {
              const note = await db.get(NOTE_STORE, item.id);
              if (note) {
                const { error } = await supabase.from('notebook_notes').upsert({
                  id: note.id,
                  folder_id: note.folderId,
                  title: note.title,
                  content: note.content,
                  type: note.type,
                  metadata: note.metadata,
                  tags: note.tags,
                  is_pinned: note.isPinned,
                  user_id: note.userId,
                  deleted_at: note.deletedAt,
                  updated_at: note.updatedAt,
                  created_at: note.createdAt
                });
                if (!error) {
                  await db.put(NOTE_STORE, { ...note, isSynced: true });
                  await db.delete(SYNC_QUEUE_STORE, item.id);
                }
              }
            } else {
              const { error } = await supabase.from('notebook_notes').delete().eq('id', item.id);
              if (!error) await db.delete(SYNC_QUEUE_STORE, item.id);
            }
          } else if (item.type === 'folder') {
            if (item.action === 'upsert') {
              const folder = await db.get(FOLDER_STORE, item.id);
              if (folder) {
                const { error } = await supabase.from('notebook_folders').upsert({
                  id: folder.id,
                  name: folder.name,
                  parent_id: folder.parentId,
                  user_id: folder.userId,
                  deleted_at: folder.deletedAt,
                  updated_at: folder.updatedAt,
                  created_at: folder.createdAt
                });
                if (!error) await db.delete(SYNC_QUEUE_STORE, item.id);
              }
            } else {
              const { error } = await supabase.from('notebook_folders').delete().eq('id', item.id);
              if (!error) await db.delete(SYNC_QUEUE_STORE, item.id);
            }
          }
        } catch (e) {
          console.error('Sync failed for item', item.id, e);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async pullFromServer() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const db = await this.getDB();

    // Pull folders
    const { data: folders } = await supabase.from('notebook_folders').select('*').eq('user_id', user.id);
    if (folders) {
      await db.clear(FOLDER_STORE); // Clear local to sync with server truth
      for (const f of folders) {
        await db.put(FOLDER_STORE, {
          id: f.id,
          name: f.name,
          parentId: f.parent_id,
          userId: f.user_id,
          createdAt: f.created_at,
          updatedAt: f.updated_at,
          deletedAt: f.deleted_at
        });
      }
    }

    // Pull notes
    const { data: notes } = await supabase.from('notebook_notes').select('*').eq('user_id', user.id);
    if (notes) {
      await db.clear(NOTE_STORE); // Clear local
      for (const n of notes) {
        await db.put(NOTE_STORE, {
          id: n.id,
          folderId: n.folder_id,
          title: n.title,
          content: n.content,
          type: n.type,
          metadata: n.metadata,
          tags: n.tags || [],
          isPinned: n.is_pinned,
          userId: n.user_id,
          createdAt: n.created_at,
          updatedAt: n.updated_at,
          deletedAt: n.deleted_at,
          isSynced: true
        });
      }
    }
  }
}

export interface FolderNode extends NotebookFolder {
  children: FolderNode[];
}

export function buildFolderTree(folders: NotebookFolder[]): FolderNode[] {
  const activeFolders = folders.filter(f => !f.deletedAt);
  const map = new Map<string | null, FolderNode[]>();
  activeFolders.forEach(f => {
    const node = { ...f, children: [] };
    if (!map.has(f.parentId)) map.set(f.parentId, []);
    map.get(f.parentId)!.push(node);
  });

  const build = (parentId: string | null): FolderNode[] => {
    const nodes = map.get(parentId) || [];
    nodes.forEach(node => {
      node.children = build(node.id);
    });
    return nodes;
  };

  return build(null);
}

export const notebookService = new NotebookService();
