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
  ReactionPayload,
  VotingStartPayload,
  VotingResultsPayload,
  TelephoneDrawPayload,
  TelephoneGuessPayload,
  TelephonePromptPayload,
  TelephoneRevealPayload,
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
    addReaction,
    removeReaction,
    setVotingStart,
    setVotingResults,
    setTelephoneDraw,
    setTelephoneGuess,
    setTelephonePrompt,
    setTelephoneReveal,
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
          // Build message with streak info if applicable
          let message = `${payload.playerName} guessed correctly! (+${payload.points})`;
          if (payload.multiplier > 1) {
            message += ` 🔥 ${payload.multiplier}x streak!`;
          }
          addChatMessage({
            playerId: 'system',
            playerName: 'System',
            text: message,
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

        case 'REACTION': {
          const payload = event.payload as ReactionPayload;
          const reactionId = `${payload.playerId}-${payload.timestamp}`;
          addReaction({
            id: reactionId,
            playerId: payload.playerId,
            playerName: payload.playerName,
            emoji: payload.emoji,
            timestamp: payload.timestamp,
          });
          // Auto-remove after 2 seconds
          setTimeout(() => {
            removeReaction(reactionId);
          }, 2000);
          break;
        }

        case 'VOTING_START': {
          const payload = event.payload as VotingStartPayload;
          setVotingStart(payload.drawings, payload.votingTime);
          break;
        }

        case 'VOTE_RECEIVED': {
          // Could show who voted, but we'll keep it simple for now
          break;
        }

        case 'VOTING_RESULTS': {
          const payload = event.payload as VotingResultsPayload;
          setVotingResults(payload.results, payload.winnerId);
          break;
        }

        case 'TELEPHONE_DRAW': {
          const payload = event.payload as TelephoneDrawPayload;
          setTelephoneDraw(payload.playerId, payload.playerName, payload.drawTime, payload.remainingPlayers);
          break;
        }

        case 'TELEPHONE_GUESS': {
          const payload = event.payload as TelephoneGuessPayload;
          setTelephoneGuess(payload.playerId, payload.playerName, payload.guessTime, payload.remainingPlayers);
          break;
        }

        case 'TELEPHONE_PROMPT': {
          const payload = event.payload as TelephonePromptPayload;
          setTelephonePrompt(payload.prompt, payload.type);
          break;
        }

        case 'TELEPHONE_REVEAL': {
          const payload = event.payload as TelephoneRevealPayload;
          setTelephoneReveal(payload.originalWord, payload.chain);
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
      addReaction,
      removeReaction,
      setVotingStart,
      setVotingResults,
      setTelephoneDraw,
      setTelephoneGuess,
      setTelephonePrompt,
      setTelephoneReveal,
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
