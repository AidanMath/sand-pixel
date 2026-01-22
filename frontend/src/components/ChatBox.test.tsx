import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatBox } from './ChatBox';
import type { ChatMessage } from '../types/game.types';

describe('ChatBox', () => {
  const defaultProps = {
    messages: [] as ChatMessage[],
    onSendMessage: vi.fn(),
  };

  it('renders empty state message when no messages', () => {
    render(<ChatBox {...defaultProps} />);

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('renders message input and send button', () => {
    render(<ChatBox {...defaultProps} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('displays messages from players', () => {
    const messages: ChatMessage[] = [
      { playerId: '1', playerName: 'Alice', text: 'Hello world!', timestamp: Date.now() },
      { playerId: '2', playerName: 'Bob', text: 'Hi Alice!', timestamp: Date.now() },
    ];
    render(<ChatBox {...defaultProps} messages={messages} />);

    expect(screen.getByText('Alice:')).toBeInTheDocument();
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
    expect(screen.getByText('Bob:')).toBeInTheDocument();
    expect(screen.getByText('Hi Alice!')).toBeInTheDocument();
  });

  it('displays system messages differently', () => {
    const messages: ChatMessage[] = [
      { playerId: 'system', playerName: 'System', text: 'Player joined!', timestamp: Date.now(), system: true },
    ];
    render(<ChatBox {...defaultProps} messages={messages} />);

    expect(screen.getByText('Player joined!')).toBeInTheDocument();
    expect(screen.queryByText('System:')).not.toBeInTheDocument();
  });

  it('allows typing in the input field', async () => {
    const user = userEvent.setup();
    render(<ChatBox {...defaultProps} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test message');

    expect(input).toHaveValue('test message');
  });

  it('calls onSendMessage when form is submitted', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<ChatBox {...defaultProps} onSendMessage={onSendMessage} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello{Enter}');

    expect(onSendMessage).toHaveBeenCalledWith('Hello');
  });

  it('calls onSendMessage when send button is clicked', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<ChatBox {...defaultProps} onSendMessage={onSendMessage} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(onSendMessage).toHaveBeenCalledWith('Hello');
  });

  it('clears input after sending message', async () => {
    const user = userEvent.setup();
    render(<ChatBox {...defaultProps} onSendMessage={vi.fn()} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello{Enter}');

    expect(input).toHaveValue('');
  });

  it('does not send empty messages', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<ChatBox {...defaultProps} onSendMessage={onSendMessage} />);

    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('does not send whitespace-only messages', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<ChatBox {...defaultProps} onSendMessage={onSendMessage} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '   ');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('trims whitespace from messages', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<ChatBox {...defaultProps} onSendMessage={onSendMessage} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '  Hello  {Enter}');

    expect(onSendMessage).toHaveBeenCalledWith('Hello');
  });

  it('disables input when disabled prop is true', () => {
    render(<ChatBox {...defaultProps} disabled={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('disables send button when disabled prop is true', () => {
    render(<ChatBox {...defaultProps} disabled={true} />);

    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
  });

  it('disables send button when input is empty', () => {
    render(<ChatBox {...defaultProps} />);

    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
  });

  it('uses custom placeholder when provided', () => {
    render(<ChatBox {...defaultProps} placeholder="Custom placeholder" />);

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('uses default placeholder when not provided', () => {
    render(<ChatBox {...defaultProps} />);

    expect(screen.getByPlaceholderText('Type your guess...')).toBeInTheDocument();
  });

  it('displays close guess warning when closeGuessWarning is true', () => {
    render(<ChatBox {...defaultProps} closeGuessWarning={true} />);

    expect(screen.getByText("That's close! Keep trying!")).toBeInTheDocument();
  });

  it('does not display close guess warning when closeGuessWarning is false', () => {
    render(<ChatBox {...defaultProps} closeGuessWarning={false} />);

    expect(screen.queryByText("That's close! Keep trying!")).not.toBeInTheDocument();
  });

  it('has maxLength of 100 on input', () => {
    render(<ChatBox {...defaultProps} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '100');
  });
});
