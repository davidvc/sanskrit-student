interface AlternativeTranslationsProps {
  translations: string[];
}

/**
 * Collapsible section showing alternative translations for the sutra.
 */
export default function AlternativeTranslations({ translations }: AlternativeTranslationsProps) {
  if (!translations || translations.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <details>
        <summary className="text-lg font-semibold cursor-pointer hover:text-blue-600">
          Alternative Translations
        </summary>
        <ul className="mt-2 pl-4 list-disc text-gray-700 space-y-1">
          {translations.slice(0, 3).map((alt, index) => (
            <li key={`alt-${index}`}>{alt}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
