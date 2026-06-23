package org.example.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.example.backend.service.SystemAdminService;

import java.util.Map;

@SpringBootTest
public class ManualTest {
    
    @Autowired
    private SystemAdminService systemAdminService;

    @Test
    public void testLogs() {
        try {
            Map<String, Object> result = systemAdminService.getAuditLogs(0, 20, null, "All", "All time");
            System.out.println("TEST SUCCESS! Total elements: " + result.get("totalElements"));
            System.out.println("First element: " + ((java.util.List<?>)result.get("content")).get(0));
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
