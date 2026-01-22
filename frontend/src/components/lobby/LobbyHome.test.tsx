import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LobbyHome } from './LobbyHome';

describe('LobbyHome', () => {
  it('renders title and subtitle', () => {
    render(<LobbyHome onCreateRoom={vi.fn()} onJoinRoom={vi.fn()} />);

    expect(screen.getByText('Sand Draw')).toBeInTheDocument();
    expect(screen.getByText('Draw, guess, watch it fall!')).toBeInTheDocument();
  });

  it('renders Create Room and Join Room buttons', () => {
    render(<LobbyHome onCreateRoom={vi.fn()} onJoinRoom={vi.fn()} />);

    expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join room/i })).toBeInTheDocument();
  });

  it('calls onCreateRoom when Create Room button is clicked', async () => {
    const user = userEvent.setup();
    const onCreateRoom = vi.fn();
    render(<LobbyHome onCreateRoom={onCreateRoom} onJoinRoom={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /create room/i }));

    expect(onCreateRoom).toHaveBeenCalledTimes(1);
  });

  it('calls onJoinRoom when Join Room button is clicked', async () => {
    const user = userEvent.setup();
    const onJoinRoom = vi.fn();
    render(<LobbyHome onCreateRoom={vi.fn()} onJoinRoom={onJoinRoom} />);

    await user.click(screen.getByRole('button', { name: /join room/i }));

    expect(onJoinRoom).toHaveBeenCalledTimes(1);
  });
});
