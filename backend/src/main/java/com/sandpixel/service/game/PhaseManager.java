package com.sandpixel.service.game;

import com.sandpixel.model.game.GamePhase;
import com.sandpixel.model.game.GameState;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
@Slf4j
public class PhaseManager {

    /**
     * Valid phase transitions:
     * LOBBY -> COUNTDOWN -> WORD_SELECTION -> DRAWING -> REVEAL -> RESULTS
     *                                                                 |
     *                                                           WORD_SELECTION (next round)
     *                                                                 |
     *                                                           GAME_OVER -> LOBBY
     */
    private static final Map<GamePhase, Set<GamePhase>> VALID_TRANSITIONS = Map.of(
        GamePhase.LOBBY, Set.of(GamePhase.COUNTDOWN),
        GamePhase.COUNTDOWN, Set.of(GamePhase.WORD_SELECTION),
        GamePhase.WORD_SELECTION, Set.of(GamePhase.DRAWING),
        GamePhase.DRAWING, Set.of(GamePhase.REVEAL),
        GamePhase.REVEAL, Set.of(GamePhase.RESULTS),
        GamePhase.RESULTS, Set.of(GamePhase.WORD_SELECTION, GamePhase.GAME_OVER),
        GamePhase.GAME_OVER, Set.of(GamePhase.LOBBY)
    );

    public boolean canTransition(GamePhase from, GamePhase to) {
        Set<GamePhase> validTargets = VALID_TRANSITIONS.get(from);
        return validTargets != null && validTargets.contains(to);
    }

    public boolean validateAndTransition(GameState state, GamePhase targetPhase) {
        GamePhase currentPhase = state.getPhase();

        if (!canTransition(currentPhase, targetPhase)) {
            log.warn("Invalid phase transition attempted: {} -> {}", currentPhase, targetPhase);
            return false;
        }

        state.setPhase(targetPhase);
        log.debug("Phase transition: {} -> {}", currentPhase, targetPhase);
        return true;
    }

    public boolean isInPhase(GameState state, GamePhase... validPhases) {
        GamePhase currentPhase = state.getPhase();
        for (GamePhase phase : validPhases) {
            if (currentPhase == phase) {
                return true;
            }
        }
        return false;
    }

    public boolean isGameActive(GameState state) {
        return isInPhase(state,
            GamePhase.COUNTDOWN,
            GamePhase.WORD_SELECTION,
            GamePhase.DRAWING,
            GamePhase.REVEAL,
            GamePhase.RESULTS
        );
    }
}
