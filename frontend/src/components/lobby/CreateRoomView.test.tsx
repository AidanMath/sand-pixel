import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateRoomView } from './CreateRoomView';
import type { RoomSettings } from '../../types/game.types';

describe('CreateRoomView', () => {
  const defaultSettings: RoomSettings = {
    totalRounds: 3,
    drawTime: 60,
    revealTime: 10,
    maxPlayers: 8,
  };

  const defaultProps = {
    playerName: '',
    settings: defaultSettings,
    error: null,
    onPlayerNameChange: vi.fn(),
    onSettingsChange: vi.fn(),
    onCreateRoom: vi.fn(),
    onBack: vi.fn(),
  };

  it('renders the create room form', () => {
    render(<CreateRoomView {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Create Room' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByText('Rounds')).toBeInTheDocument();
    expect(screen.getByText('Draw Time')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<CreateRoomView {...defaultProps} onBack={onBack} />);

    await user.click(screen.getByText('← Back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onPlayerNameChange when typing in name input', async () => {
    const user = userEvent.setup();
    const onPlayerNameChange = vi.fn();
    render(<CreateRoomView {...defaultProps} onPlayerNameChange={onPlayerNameChange} />);

    const nameInput = screen.getByPlaceholderText(/enter your name/i);
    await user.type(nameInput, 'TestPlayer');

    expect(onPlayerNameChange).toHaveBeenCalled();
    expect(onPlayerNameChange).toHaveBeenLastCalledWith('r'); // Last character
  });

  it('displays the current player name', () => {
    render(<CreateRoomView {...defaultProps} playerName="Alice" />);

    const nameInput = screen.getByPlaceholderText(/enter your name/i);
    expect(nameInput).toHaveValue('Alice');
  });

  it('calls onSettingsChange when rounds selection changes', async () => {
    const user = userEvent.setup();
    const onSettingsChange = vi.fn();
    render(<CreateRoomView {...defaultProps} onSettingsChange={onSettingsChange} />);

    const roundsSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(roundsSelect, '5');

    expect(onSettingsChange).toHaveBeenCalledWith({
      ...defaultSettings,
      totalRounds: 5,
    });
  });

  it('calls onSettingsChange when draw time selection changes', async () => {
    const user = userEvent.setup();
    const onSettingsChange = vi.fn();
    render(<CreateRoomView {...defaultProps} onSettingsChange={onSettingsChange} />);

    const drawTimeSelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(drawTimeSelect, '120');

    expect(onSettingsChange).toHaveBeenCalledWith({
      ...defaultSettings,
      drawTime: 120,
    });
  });

  it('disables Create Room button when player name is empty', () => {
    render(<CreateRoomView {...defaultProps} playerName="" />);

    const createButton = screen.getByRole('button', { name: /create room/i });
    expect(createButton).toBeDisabled();
  });

  it('disables Create Room button when player name is only whitespace', () => {
    render(<CreateRoomView {...defaultProps} playerName="   " />);

    const createButton = screen.getByRole('button', { name: /create room/i });
    expect(createButton).toBeDisabled();
  });

  it('enables Create Room button when player name is provided', () => {
    render(<CreateRoomView {...defaultProps} playerName="Alice" />);

    const createButton = screen.getByRole('button', { name: /create room/i });
    expect(createButton).not.toBeDisabled();
  });

  it('calls onCreateRoom when Create Room button is clicked', async () => {
    const user = userEvent.setup();
    const onCreateRoom = vi.fn();
    render(<CreateRoomView {...defaultProps} playerName="Alice" onCreateRoom={onCreateRoom} />);

    await user.click(screen.getByRole('button', { name: /create room/i }));

    expect(onCreateRoom).toHaveBeenCalledTimes(1);
  });

  it('displays error message when error prop is provided', () => {
    render(<CreateRoomView {...defaultProps} error="Failed to create room" />);

    expect(screen.getByText('Failed to create room')).toBeInTheDocument();
  });

  it('does not display error message when error is null', () => {
    render(<CreateRoomView {...defaultProps} error={null} />);

    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
  });

  it('displays correct round options', () => {
    render(<CreateRoomView {...defaultProps} />);

    const roundsSelect = screen.getAllByRole('combobox')[0];
    expect(roundsSelect).toHaveTextContent('1 round');
    expect(roundsSelect).toHaveTextContent('2 rounds');
    expect(roundsSelect).toHaveTextContent('10 rounds');
  });

  it('displays correct draw time options', () => {
    render(<CreateRoomView {...defaultProps} />);

    const drawTimeSelect = screen.getAllByRole('combobox')[1];
    expect(drawTimeSelect).toHaveTextContent('30 seconds');
    expect(drawTimeSelect).toHaveTextContent('60 seconds');
    expect(drawTimeSelect).toHaveTextContent('180 seconds');
  });
});
