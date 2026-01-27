import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { modalBackdrop, modalContent, springBouncy } from '../../utils/animations';

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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        onClick={handleOverlayClick}
        variants={modalBackdrop}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className={`bg-zinc-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl ${className}`}
          onClick={(e) => e.stopPropagation()}
          variants={modalContent}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={springBouncy}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
