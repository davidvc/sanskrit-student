interface WordInfo {
  word: string;
  meanings: string[];
}

interface WordBreakdownProps {
  words: WordInfo[];
}

/**
 * Displays a word-by-word breakdown of the Sanskrit translation in a table.
 */
export default function WordBreakdown({ words }: WordBreakdownProps) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Word Breakdown</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left border-b border-gray-200">
            <th className="py-2 pr-4 font-semibold text-gray-700">Word</th>
            <th className="py-2 font-semibold text-gray-700">Meanings</th>
          </tr>
        </thead>
        <tbody>
          {words.map((wordInfo, index) => (
            <tr key={`word-${index}`} className="border-b border-gray-100">
              <td className="py-2 pr-4 font-medium text-gray-800 align-top">{wordInfo.word}</td>
              <td className="py-2 text-gray-600">{wordInfo.meanings.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
