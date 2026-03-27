const STORAGE_KEY = 'sanskrit-student:history';
const MAX_ENTRIES = 50;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  sutra: string;
  iastText: string[];
  words: Array<{ word: string; meanings: string[] }>;
}

/** Load translation history from localStorage, newest first. */
export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/** Prepend a new entry to history, keeping at most MAX_ENTRIES. */
export function saveHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
  const history = loadHistory();
  const newEntry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    ...entry,
  };
  const trimmed = [newEntry, ...history].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/** Remove all history entries from localStorage. */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
