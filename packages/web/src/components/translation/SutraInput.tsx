interface SutraInputProps {
  value: string;
  onChange: (text: string) => void;
  onTranslate: () => void;
  disabled?: boolean;
}

/**
 * Form for entering Sanskrit text and submitting for translation.
 */
export default function SutraInput({ value, onChange, onTranslate, disabled }: SutraInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTranslate();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <textarea
        className="w-full border border-gray-300 rounded-lg p-3 text-base min-h-[80px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter Sanskrit text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Translate
      </button>
    </form>
  );
}
