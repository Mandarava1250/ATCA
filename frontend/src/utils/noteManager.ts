// 笔记管理器 - 使用 localStorage 存储
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPublic: boolean;
  relatedBuildingId?: number;
  relatedBuildingName?: string;
  createdAt: string;
  updatedAt: string;
  userId?: number;
  authorName?: string;
}

const STORAGE_KEY = 'atca_notes';
const MAX_NOTES = 100;
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]): { success: boolean; trimmed: boolean } {
  // 限制笔记数量
  let trimmedNotes = notes.slice(0, MAX_NOTES);
  let data: string;
  let trimmed = false;

  try {
    data = JSON.stringify(trimmedNotes);
  } catch {
    // 如果序列化失败，尝试减少内容
    const simplifiedNotes = trimmedNotes.map(n => ({
      ...n,
      content: n.content.substring(0, 1000)
    }));
    data = JSON.stringify(simplifiedNotes);
    trimmed = true;
  }

  // 检查存储容量
  if (data.length > MAX_STORAGE_SIZE) {
    if (trimmedNotes.length <= 10) {
      // 已经是最少了，无法再删减
      console.error('笔记存储已满且无法进一步精简');
      return { success: false, trimmed: true };
    }
    // 尝试保留一半
    const halfSize = Math.floor(trimmedNotes.length / 2);
    return saveNotes(trimmedNotes.slice(0, halfSize));
  }

  try {
    localStorage.setItem(STORAGE_KEY, data);
    return { success: true, trimmed };
  } catch (e) {
    // localStorage 写满，尝试清理
    if (trimmedNotes.length > 10) {
      return saveNotes(trimmedNotes.slice(0, Math.floor(trimmedNotes.length / 2)));
    }
    return { success: false, trimmed: true };
  }
}

export const noteManager = {
  getAll(): Note[] {
    return loadNotes();
  },

  getById(id: string): Note | undefined {
    return loadNotes().find(n => n.id === id);
  },

  getByBuildingId(buildingId: number): Note[] {
    return loadNotes().filter(n => n.relatedBuildingId === buildingId);
  },

  getPublicNotes(): Note[] {
    return loadNotes().filter(n => n.isPublic);
  },

  getUserNotes(): Note[] {
    return loadNotes();
  },

  create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      createdAt: now,
      updatedAt: now,
    };
    const notes = loadNotes();
    notes.unshift(newNote);
    saveNotes(notes);
    return newNote;
  },

  update(id: string, updates: Partial<Note>): Note | null {
    const notes = loadNotes();
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    notes[idx] = { ...notes[idx], ...updates, updatedAt: new Date().toISOString() };
    saveNotes(notes);
    return notes[idx];
  },

  delete(id: string): boolean {
    const notes = loadNotes();
    const filtered = notes.filter(n => n.id !== id);
    if (filtered.length === notes.length) return false;
    saveNotes(filtered);
    return true;
  },

  hasNotesForBuilding(buildingId: number): boolean {
    return loadNotes().some(n => n.relatedBuildingId === buildingId);
  },
};
