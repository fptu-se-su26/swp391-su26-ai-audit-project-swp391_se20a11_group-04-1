package org.example.backend;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashTest {
    @Test
    public void testHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("HASH_START");
        System.out.println(encoder.encode("Password123!"));
        System.out.println(encoder.matches("Password123!", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyNjOkCPu"));
        System.out.println("HASH_END");
    }
}
