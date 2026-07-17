package org.example.backend;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptGeneratorTest {
    @Test
    public void generateHash() {
        String hash = new BCryptPasswordEncoder().encode("Admin@123");
        System.out.println("GENERATED_BCRYPT_HASH: " + hash);
    }
}
