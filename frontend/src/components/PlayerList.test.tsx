import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerList } from './PlayerList';
import type { Player } from '../types/game.types';

describe('PlayerList', () => {
  const createPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: 'player1',
    sessionId: 'session1',
    name: 'Player 1',
    score: 0,
    ready: false,
    connected: true,
    ...overrides,
  });

  it('renders player count in header', () => {
    const players = [createPlayer(), createPlayer({ id: 'player2', sessionId: 'session2', name: 'Player 2' })];
    render(<PlayerList players={players} hostId="session1" currentDrawerId={null} />);

    expect(screen.getByText('Players (2)')).toBeInTheDocument();
  });

  it('renders player names', () => {
    const players = [
      createPlayer({ name: 'Alice' }),
      createPlayer({ id: 'player2', sessionId: 'session2', name: 'Bob' }),
    ];
    render(<PlayerList players={players} hostId="session1" currentDrawerId={null} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('displays first letter avatar for each player', () => {
    const players = [createPlayer({ name: 'Alice' })];
    render(<PlayerList players={players} hostId="session1" currentDrawerId={null} />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows Host badge for the host player', () => {
    const players = [createPlayer({ sessionId: 'host-session', name: 'Host Player' })];
    render(<PlayerList players={players} hostId="host-session" currentDrawerId={null} />);

    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('does not show Host badge for non-host players', () => {
    const players = [createPlayer({ sessionId: 'other-session', name: 'Other Player' })];
    render(<PlayerList players={players} hostId="host-session" currentDrawerId={null} />);

    expect(screen.queryByText('Host')).not.toBeInTheDocument();
  });

  it('shows Drawing badge for current drawer', () => {
    const players = [createPlayer({ id: 'drawer-id', name: 'Drawer' })];
    render(<PlayerList players={players} hostId="session1" currentDrawerId="drawer-id" />);

    expect(screen.getByText('Drawing')).toBeInTheDocument();
  });

  it('does not show Drawing badge when not drawing', () => {
    const players = [createPlayer({ id: 'player-id', name: 'Player' })];
    render(<PlayerList players={players} hostId="session1" currentDrawerId="other-id" />);

    expect(screen.queryByText('Drawing')).not.toBeInTheDocument();
  });

  it('shows (you) indicator for current player', () => {
    const players = [createPlayer({ id: 'my-id', name: 'Me' })];
    render(<PlayerList players={players} hostId="session1" currentDrawerId={null} myPlayerId="my-id" />);

    expect(screen.getByText('(you)')).toBeInTheDocument();
  });

  it('does not show (you) indicator for other players', () => {
    const players = [createPlayer({ id: 'other-id', name: 'Other' })];
    render(<PlayerList players={players} hostId="session1" currentDrawerId={null} myPlayerId="my-id" />);

    expect(screen.queryByText('(you)')).not.toBeInTheDocument();
  });

  it('shows ready indicator when showScores is false', () => {
    const players = [createPlayer({ ready: true })];
    const { container } = render(
      <PlayerList players={players} hostId="session1" currentDrawerId={null} showScores={false} />
    );

    // Ready indicator is a green dot
    const readyDot = container.querySelector('.bg-green-500');
    expect(readyDot).toBeInTheDocument();
  });

  it('shows not ready indicator when player is not ready', () => {
    const players = [createPlayer({ ready: false })];
    const { container } = render(
      <PlayerList players={players} hostId="session1" currentDrawerId={null} showScores={false} />
    );

    // Not ready indicator is a gray dot
    const notReadyDot = container.querySelector('.bg-zinc-600');
    expect(notReadyDot).toBeInTheDocument();
  });

  it('shows scores when showScores is true', () => {
    const players = [createPlayer({ score: 150 })];
    render(
      <PlayerList players={players} hostId="session1" currentDrawerId={null} showScores={true} />
    );

    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('shows rank numbers when showScores is true', () => {
    const players = [
      createPlayer({ id: 'p1', name: 'First', score: 100 }),
      createPlayer({ id: 'p2', sessionId: 's2', name: 'Second', score: 50 }),
    ];
    render(
      <PlayerList players={players} hostId="session1" currentDrawerId={null} showScores={true} />
    );

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('sorts players by score when showScores is true', () => {
    const players = [
      createPlayer({ id: 'p1', name: 'Low', score: 50 }),
      createPlayer({ id: 'p2', sessionId: 's2', name: 'High', score: 150 }),
    ];
    render(
      <PlayerList players={players} hostId="session1" currentDrawerId={null} showScores={true} />
    );

    // The #1 rank should appear before #2 in the document
    const ranks = screen.getAllByText(/#[12]/);
    expect(ranks[0]).toHaveTextContent('#1');
    expect(ranks[1]).toHaveTextContent('#2');
  });

  it('shows disconnected text for disconnected players', () => {
    const players = [createPlayer({ connected: false })];
    render(<PlayerList players={players} hostId="session1" currentDrawerId={null} />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('does not show disconnected text for connected players', () => {
    const players = [createPlayer({ connected: true })];
    render(<PlayerList players={players} hostId="session1" currentDrawerId={null} />);

    expect(screen.queryByText('Disconnected')).not.toBeInTheDocument();
  });

  it('applies opacity to disconnected players', () => {
    const players = [createPlayer({ connected: false, name: 'Disconnected Player' })];
    const { container } = render(
      <PlayerList players={players} hostId="session1" currentDrawerId={null} />
    );

    const playerRow = container.querySelector('.opacity-50');
    expect(playerRow).toBeInTheDocument();
  });

  it('handles empty player list', () => {
    render(<PlayerList players={[]} hostId="session1" currentDrawerId={null} />);

    expect(screen.getByText('Players (0)')).toBeInTheDocument();
  });

  it('shows multiple badges when applicable', () => {
    const players = [createPlayer({ id: 'player1', sessionId: 'host-session', name: 'Host Drawer' })];
    render(
      <PlayerList
        players={players}
        hostId="host-session"
        currentDrawerId="player1"
        myPlayerId="player1"
      />
    );

    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('Drawing')).toBeInTheDocument();
    expect(screen.getByText('(you)')).toBeInTheDocument();
  });
});
