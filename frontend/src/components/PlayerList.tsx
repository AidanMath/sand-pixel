import { motion, AnimatePresence } from 'motion/react';
import { playerItemVariants, springGentle } from '../utils/animations';
import type { Player } from '../types/game.types';
import { StreakIndicator } from './ui/StreakIndicator';

interface PlayerListProps {
  players: Player[];
  hostId: string;
  currentDrawerId: string | null;
  currentDrawerIds?: string[];
  myPlayerId?: string;
  showScores?: boolean;
}

export function PlayerList({
  players,
  hostId,
  currentDrawerId,
  currentDrawerIds = [],
  myPlayerId,
  showScores = false,
}: PlayerListProps) {
  const sortedPlayers = showScores
    ? [...players].sort((a, b) => b.score - a.score)
    : players;

  return (
    <div className="bg-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-zinc-700/50 border-b border-zinc-700">
        <h3 className="font-semibold">Players ({players.length})</h3>
      </div>
      <div className="divide-y divide-zinc-700/50">
        <AnimatePresence mode="popLayout">
          {sortedPlayers.map((player, index) => {
            const isHost = player.sessionId === hostId;
            const drawerIdsList = currentDrawerIds.length > 0 ? currentDrawerIds : (currentDrawerId ? [currentDrawerId] : []);
            const isDrawer = drawerIdsList.includes(player.id);
            const isMe = player.id === myPlayerId;

            return (
              <motion.div
                key={player.id}
                variants={playerItemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ ...springGentle, delay: index * 0.05 }}
                layout={!currentDrawerId}
                className={`px-4 py-3 flex items-center justify-between ${
                  isMe ? 'bg-blue-900/20' : ''
                } ${!player.connected ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {showScores && (
                    <span className="w-6 text-center text-zinc-500 text-sm">
                      #{index + 1}
                    </span>
                  )}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={isMe ? 'font-semibold' : ''}>
                        {player.name}
                      </span>
                      {isMe && (
                        <span className="text-xs text-blue-400">(you)</span>
                      )}
                      {isHost && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                          Host
                        </span>
                      )}
                      {isDrawer && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                          Drawing
                        </span>
                      )}
                      {showScores && player.currentStreak >= 2 && (
                        <StreakIndicator streak={player.currentStreak} />
                      )}
                    </div>
                    {!player.connected && (
                      <span className="text-xs text-zinc-500">Disconnected</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {showScores && (
                    <span className="font-mono text-lg">{player.score}</span>
                  )}
                  {!showScores && (
                    <div
                      className={`w-3 h-3 rounded-full ${
                        player.ready ? 'bg-green-500' : 'bg-zinc-600'
                      }`}
                      title={player.ready ? 'Ready' : 'Not ready'}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
