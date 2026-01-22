/**
 * Styled button component
 * Provides consistent button styling with variants
 */

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700',
  secondary: 'bg-zinc-700 hover:bg-zinc-600',
  success: 'bg-green-600 hover:bg-green-700',
  danger: 'bg-red-600 hover:bg-red-700',
};

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  fullWidth = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        py-3 px-6 rounded font-semibold transition
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
