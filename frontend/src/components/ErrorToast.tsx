import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export function ErrorToast() {
  const { error, clearError } = useGameStore();

  useEffect(() => {
    if (error) {
      console.error('[ErrorToast] Error:', error);
      // Auto-clear after 5 seconds
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-right">
      <div className="bg-red-900 border border-red-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-red-400 text-xl">⚠️</div>
          <div className="flex-1">
            <div className="font-semibold text-red-200">Error</div>
            <div className="text-red-300 text-sm mt-1">{error}</div>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-200 transition"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
