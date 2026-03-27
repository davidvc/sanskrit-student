import Link from 'next/link';

/**
 * Home page — entry point with navigation to main features.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Sanskrit Student</h1>
      <p className="text-lg text-gray-500 mb-10">Translate Sanskrit text with AI</p>

      <nav className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/translate"
          className="bg-sky-500 hover:bg-sky-600 text-white text-center font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Start Translating
        </Link>
        <Link
          href="/ocr"
          className="bg-sky-500 hover:bg-sky-600 text-white text-center font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Photograph Text (OCR)
        </Link>
        <Link
          href="/history"
          className="bg-slate-500 hover:bg-slate-600 text-white text-center font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          History
        </Link>
      </nav>
    </main>
  );
}
