import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useGameStore } from '../../stores/gameStore';
import { LobbyHome } from './LobbyHome';
import { CreateRoomView } from './CreateRoomView';
import { JoinRoomView } from './JoinRoomView';
import { RoomView } from './RoomView';
import { slideLeft, slideRight } from '../../utils/animations';
import type { RoomSettings } from '../../types/game.types';
import { DEFAULT_ROOM_SETTINGS } from '../../types/game.types';

interface GameLobbyProps {
  onGameStart?: () => void;
}

type ViewType = 'home' | 'create' | 'join' | 'room';

const viewOrder: ViewType[] = ['home', 'create', 'join', 'room'];

export function GameLobby({ onGameStart }: GameLobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [view, setView] = useState<ViewType>('home');
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_ROOM_SETTINGS);
  const prevViewRef = useRef<ViewType>('home');

  const {
    connect,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
  } = useWebSocket();

  const {
    connectionStatus,
    room,
    error,
    clearError,
    isHost,
    getPlayerList,
    getMyPlayer,
    getPersistedSession,
    persistSession,
    clearPersistedSession,
  } = useGameStore();

  // Track navigation direction
  const isForward = viewOrder.indexOf(view) >= viewOrder.indexOf(prevViewRef.current);
  const slideVariants = isForward ? slideLeft : slideRight;

  const navigateTo = (newView: ViewType) => {
    prevViewRef.current = view;
    setView(newView);
  };

  // Connect on mount and try to rejoin if we have a persisted session
  useEffect(() => {
    const initConnection = async () => {
      await connect();

      const persisted = getPersistedSession();
      if (persisted && !room) {
        setPlayerName(persisted.playerName);
        setRoomCode(persisted.roomId);
        joinRoom(persisted.roomId, persisted.playerName);
      }
    };
    initConnection();
  }, [connect, getPersistedSession, joinRoom, room]);

  // Switch to room view when room is set and persist session
  useEffect(() => {
    if (room && playerName) {
      navigateTo('room');
      persistSession(room.id, playerName);
    }
  }, [room, playerName, persistSession]);

  // Call onGameStart when game starts
  useEffect(() => {
    if (room?.gameState.phase === 'COUNTDOWN' && onGameStart) {
      onGameStart();
    }
  }, [room?.gameState.phase, onGameStart]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) return;
    createRoom(playerName.trim(), settings);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  const handleLeaveRoom = () => {
    if (room) {
      leaveRoom(room.id);
      clearPersistedSession();
      navigateTo('home');
    }
  };

  const handleToggleReady = () => {
    if (room) toggleReady(room.id);
  };

  const handleStartGame = () => {
    if (room) startGame(room.id);
  };

  const players = getPlayerList();
  const myPlayer = getMyPlayer();
  const canStart = players.length >= 2 && players.every((p) => p.ready);

  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Connecting...</div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Disconnected from server</div>
          <button
            onClick={connect}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {view === 'room' && room ? (
        <motion.div
          key="room"
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <RoomView
            room={room}
            players={players}
            myPlayer={myPlayer}
            isHost={isHost()}
            canStart={canStart}
            error={error}
            onLeaveRoom={handleLeaveRoom}
            onToggleReady={handleToggleReady}
            onStartGame={handleStartGame}
            onClearError={clearError}
          />
        </motion.div>
      ) : view === 'create' ? (
        <motion.div
          key="create"
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <CreateRoomView
            playerName={playerName}
            settings={settings}
            error={error}
            onPlayerNameChange={setPlayerName}
            onSettingsChange={setSettings}
            onCreateRoom={handleCreateRoom}
            onBack={() => navigateTo('home')}
          />
        </motion.div>
      ) : view === 'join' ? (
        <motion.div
          key="join"
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <JoinRoomView
            playerName={playerName}
            roomCode={roomCode}
            error={error}
            onPlayerNameChange={setPlayerName}
            onRoomCodeChange={setRoomCode}
            onJoinRoom={handleJoinRoom}
            onBack={() => navigateTo('home')}
          />
        </motion.div>
      ) : (
        <motion.div
          key="home"
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <LobbyHome
            onCreateRoom={() => navigateTo('create')}
            onJoinRoom={() => navigateTo('join')}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
