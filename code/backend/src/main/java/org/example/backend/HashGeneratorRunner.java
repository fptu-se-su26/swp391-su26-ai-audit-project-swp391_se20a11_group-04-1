package org.example.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import java.nio.file.Files;
import java.nio.file.Paths;

@Component
public class HashGeneratorRunner implements CommandLineRunner {
    @Override
    public void run(String... args) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("Password123!");
        Files.write(Paths.get("C:\\Users\\tus\\.gemini\\antigravity\\brain\\c772e057-9290-4a9a-b902-53f9e6a0bff8\\scratch\\hash.txt"), hash.getBytes());
    }
}
