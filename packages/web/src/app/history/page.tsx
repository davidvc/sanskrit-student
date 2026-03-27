'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadHistory, clearHistory, type HistoryEntry } from '@/lib/translationHistory';

/**
 * History page — displays past Sanskrit translations stored in localStorage.
 */
export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setEntries([]);
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Translation History</h1>
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Clear history
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No translations yet.</p>
          <Link
            href="/translate"
            className="text-sky-500 hover:text-sky-700 font-medium transition-colors"
          >
            Translate your first sutra →
          </Link>
        </div>
      ) : (
        <ol className="space-y-4">
          {entries.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
    </main>
  );
}

interface HistoryCardProps {
  entry: HistoryEntry;
}

function HistoryCard({ entry }: HistoryCardProps) {
  const date = new Date(entry.timestamp);
  const iast = entry.iastText.join(' ');

  return (
    <li className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
      <p className="text-xs text-gray-400 mb-1">
        {date.toLocaleDateString()} {date.toLocaleTimeString()}
      </p>
      <p className="font-semibold text-gray-800 mb-1">{entry.sutra}</p>
      {iast && <p className="text-sm text-gray-600 italic">{iast}</p>}
      {entry.words.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          {entry.words.map((w) => w.word).join(' · ')}
        </p>
      )}
    </li>
  );
}
