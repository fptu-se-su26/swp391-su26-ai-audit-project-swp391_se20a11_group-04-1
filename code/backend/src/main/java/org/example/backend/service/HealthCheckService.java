package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ComponentHealth;
import org.example.backend.dto.HealthSummaryResponse;
import org.example.backend.entity.SystemHealthCheck;
import org.example.backend.repository.SystemHealthCheckRepository;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.File;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HealthCheckService {

    private final DataSource dataSource;
    private final SystemHealthCheckRepository systemHealthCheckRepository;

    public SystemHealthCheck checkDatabase() {
        long start = System.currentTimeMillis();
        try (Connection conn = dataSource.getConnection()) {
            boolean valid = conn.isValid(2); // 2 seconds timeout
            long durationMs = System.currentTimeMillis() - start;
            if (valid) {
                return SystemHealthCheck.builder()
                        .component("DATABASE")
                        .status("UP")
                        .responseTimeMs(durationMs)
                        .build();
            } else {
                return SystemHealthCheck.builder()
                        .component("DATABASE")
                        .status("DOWN")
                        .message("Connection is not valid")
                        .responseTimeMs(durationMs)
                        .build();
            }
        } catch (Exception e) {
            long durationMs = System.currentTimeMillis() - start;
            return SystemHealthCheck.builder()
                    .component("DATABASE")
                    .status("DOWN")
                    .message(e.getMessage())
                    .responseTimeMs(durationMs)
                    .build();
        }
    }

    public SystemHealthCheck checkDiskSpace() {
        long start = System.currentTimeMillis();
        try {
            File root = new File("/");
            long usableSpace = root.getUsableSpace();
            long totalSpace = root.getTotalSpace();
            long durationMs = System.currentTimeMillis() - start;

            if (totalSpace == 0) {
                return SystemHealthCheck.builder()
                        .component("DISK")
                        .status("DOWN")
                        .message("Could not read disk space")
                        .responseTimeMs(durationMs)
                        .build();
            }

            double remainingPercentage = (double) usableSpace / totalSpace * 100;
            String message = String.format("Usable: %.2f%% remaining", remainingPercentage);

            if (remainingPercentage < 2) {
                return SystemHealthCheck.builder()
                        .component("DISK")
                        .status("DOWN")
                        .message(message)
                        .responseTimeMs(durationMs)
                        .build();
            } else if (remainingPercentage < 10) {
                return SystemHealthCheck.builder()
                        .component("DISK")
                        .status("WARN")
                        .message(message)
                        .responseTimeMs(durationMs)
                        .build();
            } else {
                return SystemHealthCheck.builder()
                        .component("DISK")
                        .status("UP")
                        .message(message)
                        .responseTimeMs(durationMs)
                        .build();
            }
        } catch (Exception e) {
            long durationMs = System.currentTimeMillis() - start;
            return SystemHealthCheck.builder()
                    .component("DISK")
                    .status("DOWN")
                    .message(e.getMessage())
                    .responseTimeMs(durationMs)
                    .build();
        }
    }

    public SystemHealthCheck checkMemory() {
        long start = System.currentTimeMillis();
        try {
            Runtime rt = Runtime.getRuntime();
            long usedMb = (rt.totalMemory() - rt.freeMemory()) / 1024 / 1024;
            long durationMs = System.currentTimeMillis() - start;

            String message = String.format("Used: %dmb", usedMb);

            if (usedMb > 1200) {
                return SystemHealthCheck.builder()
                        .component("MEMORY")
                        .status("DOWN")
                        .message(message)
                        .responseTimeMs(durationMs)
                        .build();
            } else if (usedMb > 800) {
                return SystemHealthCheck.builder()
                        .component("MEMORY")
                        .status("WARN")
                        .message(message)
                        .responseTimeMs(durationMs)
                        .build();
            } else {
                return SystemHealthCheck.builder()
                        .component("MEMORY")
                        .status("UP")
                        .message(message)
                        .responseTimeMs(durationMs)
                        .build();
            }
        } catch (Exception e) {
            long durationMs = System.currentTimeMillis() - start;
            return SystemHealthCheck.builder()
                    .component("MEMORY")
                    .status("DOWN")
                    .message(e.getMessage())
                    .responseTimeMs(durationMs)
                    .build();
        }
    }

    public List<SystemHealthCheck> checkAll() {
        List<SystemHealthCheck> results = Arrays.asList(
                checkDatabase(),
                checkDiskSpace(),
                checkMemory()
        );
        systemHealthCheckRepository.saveAll(results);
        return results;
    }

    public HealthSummaryResponse getLatestSummary() {
        List<String> components = Arrays.asList("DATABASE", "DISK", "MEMORY");
        List<ComponentHealth> componentHealths = new ArrayList<>();
        boolean hasDown = false;
        boolean hasWarn = false;

        for (String component : components) {
            List<SystemHealthCheck> checks = systemHealthCheckRepository.findTop1ByComponentOrderByCheckedAtDesc(component);
            if (!checks.isEmpty()) {
                SystemHealthCheck check = checks.get(0);
                componentHealths.add(ComponentHealth.builder()
                        .component(check.getComponent())
                        .status(check.getStatus())
                        .message(check.getMessage())
                        .responseTimeMs(check.getResponseTimeMs())
                        .checkedAt(check.getCheckedAt())
                        .build());

                if ("DOWN".equals(check.getStatus())) {
                    hasDown = true;
                } else if ("WARN".equals(check.getStatus())) {
                    hasWarn = true;
                }
            } else {
                componentHealths.add(ComponentHealth.builder()
                        .component(component)
                        .status("UNKNOWN")
                        .message("No data")
                        .responseTimeMs(0L)
                        .build());
            }
        }

        String overallStatus = "UP";
        if (hasDown) {
            overallStatus = "DOWN";
        } else if (hasWarn) {
            overallStatus = "WARN";
        }

        return HealthSummaryResponse.builder()
                .overallStatus(overallStatus)
                .components(componentHealths)
                .lastCheckedAt(LocalDateTime.now())
                .build();
    }
}
