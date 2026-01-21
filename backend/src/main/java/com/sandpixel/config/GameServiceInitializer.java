package com.sandpixel.config;

import com.sandpixel.controller.GameWebSocketController;
import com.sandpixel.service.GameService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GameServiceInitializer {

    private final GameService gameService;
    private final GameWebSocketController webSocketController;

    @PostConstruct
    public void init() {
        // Wire up the circular dependency after construction
        gameService.setWebSocketController(webSocketController);
    }
}
