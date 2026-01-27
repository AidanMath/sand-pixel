import { motion } from 'motion/react';
import { springBouncy, buttonHover, buttonTap } from '../../utils/animations';

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
  primary: 'bg-gradient-to-r from-ocean-dark to-ocean shadow-lg shadow-ocean/10',
  secondary: 'bg-zinc-700 hover:bg-zinc-600',
  success: 'bg-gradient-to-r from-green-700 to-green-500 shadow-lg shadow-green-500/10',
  danger: 'bg-gradient-to-r from-red-700 to-red-500 shadow-lg shadow-red-500/10',
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
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        py-3 px-6 rounded-lg font-semibold transition-colors
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : variantStyles[variant]}
        ${className}
      `}
      whileHover={disabled ? undefined : buttonHover}
      whileTap={disabled ? undefined : buttonTap}
      transition={springBouncy}
    >
      {children}
    </motion.button>
  );
}
