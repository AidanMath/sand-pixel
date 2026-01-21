import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types/game.types';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  closeGuessWarning?: boolean;
}

export function ChatBox({
  messages,
  onSendMessage,
  disabled = false,
  placeholder = 'Type your guess...',
  closeGuessWarning = false,
}: ChatBoxProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="bg-zinc-800 rounded-lg flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 text-sm py-4">
            No messages yet
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`text-sm ${msg.system ? 'text-center' : ''}`}
          >
            {msg.system ? (
              <span className="text-green-400 font-medium">{msg.text}</span>
            ) : (
              <>
                <span className="font-semibold text-blue-400">
                  {msg.playerName}:
                </span>{' '}
                <span className="text-zinc-300">{msg.text}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Close guess warning */}
      {closeGuessWarning && (
        <div className="px-3 py-2 bg-yellow-500/20 border-t border-yellow-500/30">
          <span className="text-yellow-400 text-sm font-medium">
            That's close! Keep trying!
          </span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={100}
            className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
