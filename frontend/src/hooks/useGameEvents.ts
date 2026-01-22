import { useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import type {
  GameEvent,
  RoomResponse,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  CountdownPayload,
  RoundStartPayload,
  WordOptionsPayload,
  WordSelectedPayload,
  DrawingPhasePayload,
  RevealPhasePayload,
  CorrectGuessPayload,
  CloseGuessPayload,
  RoundEndPayload,
  GameOverPayload,
  HintPayload,
  ErrorPayload,
  ChatMessage,
  Room,
} from '../types/game.types';
import { wsService } from '../services/websocket';

export function useGameEvents() {
  const {
    setRoom,
    setMySessionId,
    removePlayer,
    setCountdown,
    setRoundInfo,
    setWordOptions,
    setSelectedWord,
    setDrawingPhase,
    setRevealPhase,
    addCorrectGuesser,
    handleCloseGuess,
    setRoundEnd,
    setGameOver,
    addChatMessage,
    setHint,
    setError,
    clearError,
  } = useGameStore();

  const handleGameEvent = useCallback(
    (event: GameEvent) => {
      console.log('[GameEvent]', event.type, event.payload);

      switch (event.type) {
        case 'ROOM_STATE':
          setRoom(event.payload as Room);
          break;

        case 'PLAYER_JOINED': {
          const { room } = event.payload as PlayerJoinedPayload;
          setRoom(room);
          break;
        }

        case 'PLAYER_LEFT': {
          const { room, player } = event.payload as PlayerLeftPayload;
          setRoom(room);
          removePlayer(player.id);
          break;
        }

        case 'COUNTDOWN': {
          const { seconds } = event.payload as CountdownPayload;
          setCountdown(seconds);
          break;
        }

        case 'ROUND_START': {
          const payload = event.payload as RoundStartPayload;
          setRoundInfo(payload);
          break;
        }

        case 'WORD_OPTIONS': {
          const { words } = event.payload as WordOptionsPayload;
          setWordOptions(words);
          break;
        }

        case 'WORD_SELECTED': {
          const { word } = event.payload as WordSelectedPayload;
          setSelectedWord(word);
          break;
        }

        case 'DRAWING_PHASE': {
          const { drawTime, wordLength, wordHint } = event.payload as DrawingPhasePayload;
          setDrawingPhase(drawTime, wordLength, wordHint);
          break;
        }

        case 'REVEAL_PHASE': {
          const payload = event.payload as RevealPhasePayload;
          setRevealPhase(payload.word);
          break;
        }

        case 'CORRECT_GUESS': {
          const payload = event.payload as CorrectGuessPayload;
          addCorrectGuesser(payload);
          addChatMessage({
            playerId: 'system',
            playerName: 'System',
            text: `${payload.playerName} guessed correctly! (+${payload.points})`,
            timestamp: Date.now(),
            system: true,
          });
          break;
        }

        case 'CLOSE_GUESS': {
          const { playerId } = event.payload as CloseGuessPayload;
          handleCloseGuess(playerId);
          break;
        }

        case 'ROUND_END': {
          const payload = event.payload as RoundEndPayload;
          setRoundEnd(payload);
          break;
        }

        case 'GAME_OVER': {
          const payload = event.payload as GameOverPayload;
          setGameOver(payload);
          break;
        }

        case 'CHAT': {
          const message = event.payload as ChatMessage;
          addChatMessage(message);
          break;
        }

        case 'HINT': {
          const { hint } = event.payload as HintPayload;
          setHint(hint);
          break;
        }

        case 'ERROR': {
          const { message } = event.payload as ErrorPayload;
          setError(message);
          break;
        }
      }
    },
    [
      setRoom,
      removePlayer,
      setCountdown,
      setRoundInfo,
      setWordOptions,
      setSelectedWord,
      setDrawingPhase,
      setRevealPhase,
      addCorrectGuesser,
      handleCloseGuess,
      setRoundEnd,
      setGameOver,
      addChatMessage,
      setHint,
      setError,
    ]
  );

  const handleRoomResponse = useCallback(
    (response: RoomResponse) => {
      console.log('[RoomResponse]', response);

      if (response.success && response.room) {
        if (response.sessionId) {
          setMySessionId(response.sessionId);
          wsService.subscribeToPlayerEvents(response.sessionId);
        }
        setRoom(response.room);
        wsService.subscribeToRoom(response.room.id);
        clearError();
      } else if (response.error) {
        setError(response.error);
      }
    },
    [setRoom, setError, setMySessionId, clearError]
  );

  return {
    handleGameEvent,
    handleRoomResponse,
  };
}
