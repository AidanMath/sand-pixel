/**
 * Error message display for forms
 * Provides consistent styling for error states
 */

interface FormErrorProps {
  error: string | null;
  className?: string;
}

export function FormError({ error, className = '' }: FormErrorProps) {
  if (!error) return null;

  return (
    <div
      className={`mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 ${className}`}
      role="alert"
    >
      {error}
    </div>
  );
}
