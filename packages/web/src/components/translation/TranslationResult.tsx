import WordBreakdown from './WordBreakdown';
import AlternativeTranslations from './AlternativeTranslations';

interface TranslationData {
  originalText: string[];
  iastText: string[];
  words: Array<{ word: string; meanings: string[] }>;
  alternativeTranslations?: string[] | null;
}

interface TranslationResultProps {
  data: TranslationData;
  onCopyIast: () => void;
}

/**
 * Displays the full translation result including original text, IAST, word breakdown,
 * and alternative translations.
 */
export default function TranslationResult({ data, onCopyIast }: TranslationResultProps) {
  return (
    <article className="mt-4">
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-1">Original Text</h2>
        {data.originalText.map((line, index) => (
          <p key={`original-${index}`} className="text-gray-800">{line}</p>
        ))}
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold">IAST</h2>
          <button
            onClick={onCopyIast}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded transition-colors"
            aria-label="Copy IAST text to clipboard"
          >
            Copy
          </button>
        </div>
        {data.iastText.map((line, index) => (
          <p key={`iast-${index}`} className="text-gray-800">{line}</p>
        ))}
      </section>

      <WordBreakdown words={data.words} />
      <AlternativeTranslations translations={data.alternativeTranslations ?? []} />
    </article>
  );
}
