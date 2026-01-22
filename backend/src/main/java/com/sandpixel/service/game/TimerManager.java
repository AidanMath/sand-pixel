package com.sandpixel.service.game;

import com.sandpixel.model.game.GamePhase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimerManager {

    private final TaskScheduler taskScheduler;

    private final Map<String, ScheduledFuture<?>> roomTimers = new ConcurrentHashMap<>();
    private final Map<String, GamePhase> expectedPhases = new ConcurrentHashMap<>();

    public void scheduleTask(String roomId, GamePhase expectedPhase, Runnable task, int delaySeconds) {
        cancelTimer(roomId);
        expectedPhases.put(roomId, expectedPhase);

        ScheduledFuture<?> future = taskScheduler.schedule(
            () -> {
                GamePhase expected = expectedPhases.get(roomId);
                if (expected != expectedPhase) {
                    log.debug("Skipping stale timer for room {}: expected {} but timer was for {}",
                        roomId, expected, expectedPhase);
                    return;
                }
                task.run();
            },
            Instant.now().plusSeconds(delaySeconds)
        );
        roomTimers.put(roomId, future);
        log.debug("Scheduled timer for room {} in {} seconds (phase: {})", roomId, delaySeconds, expectedPhase);
    }

    public void scheduleTask(String roomId, Runnable task, int delaySeconds) {
        cancelTimer(roomId);
        ScheduledFuture<?> future = taskScheduler.schedule(
            task,
            Instant.now().plusSeconds(delaySeconds)
        );
        roomTimers.put(roomId, future);
    }

    public void cancelTimer(String roomId) {
        ScheduledFuture<?> existing = roomTimers.remove(roomId);
        if (existing != null) {
            existing.cancel(false);
            log.debug("Cancelled timer for room {}", roomId);
        }
    }

    public void notifyPhaseChange(String roomId, GamePhase newPhase) {
        expectedPhases.put(roomId, newPhase);
    }

    public void cleanup(String roomId) {
        cancelTimer(roomId);
        expectedPhases.remove(roomId);
    }
}
