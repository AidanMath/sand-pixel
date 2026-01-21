package com.sandpixel.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
@Slf4j
public class WordBankService {

    private Map<String, List<String>> wordsByDifficulty = new HashMap<>();
    private final Random random = new Random();
    private final Set<String> usedWords = new HashSet<>();

    @PostConstruct
    public void loadWords() {
        try {
            ClassPathResource resource = new ClassPathResource("words.json");
            InputStream is = resource.getInputStream();
            ObjectMapper mapper = new ObjectMapper();
            WordBank wordBank = mapper.readValue(is, WordBank.class);

            wordsByDifficulty.put("easy", wordBank.getEasy());
            wordsByDifficulty.put("medium", wordBank.getMedium());
            wordsByDifficulty.put("hard", wordBank.getHard());

            log.info("Loaded words: easy={}, medium={}, hard={}",
                wordBank.getEasy().size(),
                wordBank.getMedium().size(),
                wordBank.getHard().size());
        } catch (IOException e) {
            log.warn("Could not load words.json, using defaults");
            loadDefaultWords();
        }
    }

    private void loadDefaultWords() {
        wordsByDifficulty.put("easy", Arrays.asList(
            "cat", "dog", "sun", "moon", "tree", "house", "car", "fish", "bird", "boat",
            "ball", "book", "cake", "door", "eye", "fire", "gift", "hand", "ice", "jump",
            "key", "lamp", "mouse", "nose", "orange", "pig", "queen", "rain", "star", "table"
        ));

        wordsByDifficulty.put("medium", Arrays.asList(
            "airplane", "basketball", "butterfly", "computer", "dinosaur", "elephant",
            "fireworks", "giraffe", "hamburger", "iceberg", "jellyfish", "kangaroo",
            "lightning", "mushroom", "newspaper", "octopus", "penguin", "rainbow",
            "sandwich", "telescope", "umbrella", "volcano", "waterfall", "xylophone"
        ));

        wordsByDifficulty.put("hard", Arrays.asList(
            "astronaut", "bluetooth", "camouflage", "democracy", "ecosystem",
            "flashlight", "graduation", "hibernate", "infinity", "jigsaw",
            "kaleidoscope", "labyrinth", "metamorphosis", "nightmare", "orchestra",
            "parachute", "quicksand", "reflection", "silhouette", "trampoline"
        ));
    }

    public String[] getWordOptions(String difficulty, int count) {
        List<String> words = wordsByDifficulty.getOrDefault(difficulty,
            wordsByDifficulty.get("medium"));

        List<String> available = new ArrayList<>(words);
        available.removeAll(usedWords);

        // Reset if too few words available
        if (available.size() < count) {
            usedWords.clear();
            available = new ArrayList<>(words);
        }

        Collections.shuffle(available, random);

        String[] options = new String[Math.min(count, available.size())];
        for (int i = 0; i < options.length; i++) {
            options[i] = available.get(i);
        }

        return options;
    }

    public void markWordUsed(String word) {
        usedWords.add(word);
    }

    public void resetUsedWords() {
        usedWords.clear();
    }

    @Data
    private static class WordBank {
        private List<String> easy;
        private List<String> medium;
        private List<String> hard;
    }
}
