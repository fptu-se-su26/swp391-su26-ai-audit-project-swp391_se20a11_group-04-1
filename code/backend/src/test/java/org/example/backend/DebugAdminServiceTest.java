package org.example.backend;

import org.example.backend.service.SystemAdminService;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Debug-only smoke test that writes local alert files and depends on mutable seeded data.")
public class DebugAdminServiceTest {

    @Autowired
    private SystemAdminService systemAdminService;

    @Test
    public void testGetGrowth() throws Exception {
        try {
            java.nio.file.Files.writeString(java.nio.file.Paths.get("alerts_output.txt"), "ALERTS: " + systemAdminService.getCriticalAlerts());
        } catch (Exception e) {
            java.io.StringWriter sw = new java.io.StringWriter();
            e.printStackTrace(new java.io.PrintWriter(sw));
            java.nio.file.Files.writeString(java.nio.file.Paths.get("alerts_error.txt"), sw.toString());
            throw e;
        }
    }
}
