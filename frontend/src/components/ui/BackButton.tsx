/**
 * Back navigation button
 * Provides consistent back button styling
 */

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function BackButton({
  onClick,
  className = '',
  children = '← Back',
}: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`mb-8 text-zinc-400 hover:text-white transition ${className}`}
    >
      {children}
    </button>
  );
}
