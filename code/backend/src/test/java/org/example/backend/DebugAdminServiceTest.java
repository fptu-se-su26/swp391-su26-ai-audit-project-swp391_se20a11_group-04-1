package org.example.backend;

import org.example.backend.service.SystemAdminService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.nio.file.Path;

@SpringBootTest
public class DebugAdminServiceTest {

    @Autowired
    private SystemAdminService systemAdminService;

    @TempDir
    Path tempDir;

    @Test
    public void testGetGrowth() throws Exception {
        try {
            java.nio.file.Files.writeString(tempDir.resolve("alerts_output.txt"), "ALERTS: " + systemAdminService.getCriticalAlerts());
        } catch (Exception e) {
            java.io.StringWriter sw = new java.io.StringWriter();
            e.printStackTrace(new java.io.PrintWriter(sw));
            java.nio.file.Files.writeString(tempDir.resolve("alerts_error.txt"), sw.toString());
            throw e;
        }
    }
}
