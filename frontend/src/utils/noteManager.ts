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

function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
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
