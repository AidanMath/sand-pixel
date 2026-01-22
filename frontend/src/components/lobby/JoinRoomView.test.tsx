import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinRoomView } from './JoinRoomView';

describe('JoinRoomView', () => {
  const defaultProps = {
    playerName: '',
    roomCode: '',
    error: null,
    onPlayerNameChange: vi.fn(),
    onRoomCodeChange: vi.fn(),
    onJoinRoom: vi.fn(),
    onBack: vi.fn(),
  };

  it('renders the join room form', () => {
    render(<JoinRoomView {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Join Room' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter 6-character code/i)).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<JoinRoomView {...defaultProps} onBack={onBack} />);

    await user.click(screen.getByText('← Back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onPlayerNameChange when typing in name input', async () => {
    const user = userEvent.setup();
    const onPlayerNameChange = vi.fn();
    render(<JoinRoomView {...defaultProps} onPlayerNameChange={onPlayerNameChange} />);

    const nameInput = screen.getByPlaceholderText(/enter your name/i);
    await user.type(nameInput, 'Bob');

    expect(onPlayerNameChange).toHaveBeenCalled();
  });

  it('displays the current player name', () => {
    render(<JoinRoomView {...defaultProps} playerName="Bob" />);

    const nameInput = screen.getByPlaceholderText(/enter your name/i);
    expect(nameInput).toHaveValue('Bob');
  });

  it('calls onRoomCodeChange when typing room code', async () => {
    const user = userEvent.setup();
    const onRoomCodeChange = vi.fn();
    render(<JoinRoomView {...defaultProps} onRoomCodeChange={onRoomCodeChange} />);

    const codeInput = screen.getByPlaceholderText(/enter 6-character code/i);
    await user.type(codeInput, 'abc');

    // Should be called with uppercase
    expect(onRoomCodeChange).toHaveBeenCalledWith('A');
    expect(onRoomCodeChange).toHaveBeenCalledWith('B');
    expect(onRoomCodeChange).toHaveBeenCalledWith('C');
  });

  it('displays the current room code', () => {
    render(<JoinRoomView {...defaultProps} roomCode="ABCDEF" />);

    const codeInput = screen.getByPlaceholderText(/enter 6-character code/i);
    expect(codeInput).toHaveValue('ABCDEF');
  });

  it('disables Join Room button when player name is empty', () => {
    render(<JoinRoomView {...defaultProps} playerName="" roomCode="ABCDEF" />);

    const joinButton = screen.getByRole('button', { name: /join room/i });
    expect(joinButton).toBeDisabled();
  });

  it('disables Join Room button when room code is less than 6 characters', () => {
    render(<JoinRoomView {...defaultProps} playerName="Bob" roomCode="ABC" />);

    const joinButton = screen.getByRole('button', { name: /join room/i });
    expect(joinButton).toBeDisabled();
  });

  it('disables Join Room button when both name and code are invalid', () => {
    render(<JoinRoomView {...defaultProps} playerName="" roomCode="ABC" />);

    const joinButton = screen.getByRole('button', { name: /join room/i });
    expect(joinButton).toBeDisabled();
  });

  it('enables Join Room button when name and 6-character code are provided', () => {
    render(<JoinRoomView {...defaultProps} playerName="Bob" roomCode="ABCDEF" />);

    const joinButton = screen.getByRole('button', { name: /join room/i });
    expect(joinButton).not.toBeDisabled();
  });

  it('calls onJoinRoom when Join Room button is clicked', async () => {
    const user = userEvent.setup();
    const onJoinRoom = vi.fn();
    render(
      <JoinRoomView
        {...defaultProps}
        playerName="Bob"
        roomCode="ABCDEF"
        onJoinRoom={onJoinRoom}
      />
    );

    await user.click(screen.getByRole('button', { name: /join room/i }));

    expect(onJoinRoom).toHaveBeenCalledTimes(1);
  });

  it('displays error message when error prop is provided', () => {
    render(<JoinRoomView {...defaultProps} error="Room not found" />);

    expect(screen.getByText('Room not found')).toBeInTheDocument();
  });

  it('does not display error message when error is null', () => {
    render(<JoinRoomView {...defaultProps} error={null} />);

    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument();
  });

  it('has maxLength of 6 on room code input', () => {
    render(<JoinRoomView {...defaultProps} />);

    const codeInput = screen.getByPlaceholderText(/enter 6-character code/i);
    expect(codeInput).toHaveAttribute('maxLength', '6');
  });

  it('has maxLength of 20 on name input', () => {
    render(<JoinRoomView {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText(/enter your name/i);
    expect(nameInput).toHaveAttribute('maxLength', '20');
  });
});
