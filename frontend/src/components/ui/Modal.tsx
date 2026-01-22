/**
 * Modal overlay component
 * Provides consistent modal styling
 */

import { useEffect } from 'react';

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export function Modal({
  children,
  onClose,
  closeOnOverlayClick = true,
  className = '',
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleOverlayClick = () => {
    if (closeOnOverlayClick && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalHeader({ children, className = '' }: ModalHeaderProps) {
  return (
    <h2 className={`text-2xl font-bold text-center mb-6 ${className}`}>{children}</h2>
  );
}
