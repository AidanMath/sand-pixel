package com.sandpixel.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory broker for broadcasting to clients
        // /topic - for broadcast messages to all subscribers
        // /queue - for user-specific messages
        config.enableSimpleBroker("/topic", "/queue");

        // Prefix for messages bound for @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");

        // Prefix for user-specific destinations
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint that clients connect to
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS()
                .setStreamBytesLimit(512 * 1024)        // 512KB for streaming
                .setHttpMessageCacheSize(1000)          // Cache size
                .setDisconnectDelay(30 * 1000);         // 30 second disconnect delay

        // Also register without SockJS for native WebSocket clients
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        // Increase message size limits to handle base64 encoded drawings
        // Default is 64KB, increase to 512KB
        registration.setMessageSizeLimit(512 * 1024);      // 512KB
        registration.setSendBufferSizeLimit(1024 * 1024);  // 1MB
        registration.setSendTimeLimit(60 * 1000);          // 60 seconds
    }
}
