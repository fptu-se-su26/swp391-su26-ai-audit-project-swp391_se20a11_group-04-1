package org.example.backend.service;

import org.example.backend.entity.SystemHealthCheck;
import org.example.backend.repository.SystemHealthCheckRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.anyInt;

@ExtendWith(MockitoExtension.class)
public class HealthCheckServiceTest {

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private SystemHealthCheckRepository repository;

    @InjectMocks
    private HealthCheckService healthCheckService;

    @Test
    void testCheckDatabase_ReturnsUp_WhenConnectionValid() throws SQLException {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(anyInt())).thenReturn(true);

        SystemHealthCheck result = healthCheckService.checkDatabase();

        assertNotNull(result);
        assertEquals("DATABASE", result.getComponent());
        assertEquals("UP", result.getStatus());
        assertTrue(result.getResponseTimeMs() >= 0);
    }

    @Test
    void testCheckDatabase_ReturnsDown_WhenConnectionFails() throws SQLException {
        when(dataSource.getConnection()).thenThrow(new SQLException("Connection failed"));

        SystemHealthCheck result = healthCheckService.checkDatabase();

        assertNotNull(result);
        assertEquals("DATABASE", result.getComponent());
        assertEquals("DOWN", result.getStatus());
        assertEquals("Connection failed", result.getMessage());
        assertTrue(result.getResponseTimeMs() >= 0);
    }
}
