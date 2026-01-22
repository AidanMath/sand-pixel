/**
 * Styled form select dropdown
 * Provides consistent select styling
 */

interface FormSelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: FormSelectOption[];
  className?: string;
  disabled?: boolean;
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  className = '',
  disabled = false,
}: FormSelectProps) {
  return (
    <div className={className}>
      <label className="block text-sm text-zinc-400 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
