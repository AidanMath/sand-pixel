/**
 * Styled form input
 * Provides consistent input styling
 */

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: 'text' | 'email' | 'password';
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  type = 'text',
  className = '',
  inputClassName = '',
  disabled = false,
}: FormInputProps) {
  return (
    <div className={className}>
      <label className="block text-sm text-zinc-400 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50 ${inputClassName}`}
      />
    </div>
  );
}
