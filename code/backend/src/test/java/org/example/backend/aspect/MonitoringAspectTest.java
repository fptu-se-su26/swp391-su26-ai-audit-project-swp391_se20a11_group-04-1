package org.example.backend.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.example.backend.annotation.MonitoredJob;
import org.example.backend.entity.MonitoredJobStat;
import org.example.backend.repository.MonitoredJobStatRepository;
import org.example.backend.service.MonitoringAlertService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class MonitoringAspectTest {

    @Mock
    private MonitoredJobStatRepository repository;

    @Mock
    private MonitoringAlertService alertService;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MonitoredJob monitoredJob;

    @InjectMocks
    private MonitoringAspect aspect;

    @Test
    void testMonitoringAspect_SendsAlert_AfterConsecutiveFailures() throws Throwable {
        when(monitoredJob.name()).thenReturn("TestJob");
        when(monitoredJob.alertAfterFailures()).thenReturn(3);

        when(joinPoint.proceed()).thenThrow(new RuntimeException("Job failed"));

        MonitoredJobStat prevStat = MonitoredJobStat.builder().consecutiveFailures(2).build();
        when(repository.findTop1ByJobNameOrderByExecutedAtDesc("TestJob")).thenReturn(List.of(prevStat));

        assertThrows(RuntimeException.class, () -> aspect.monitor(joinPoint, monitoredJob));

        verify(repository, times(1)).save(any(MonitoredJobStat.class));
        verify(alertService, times(1)).sendJobFailureAlert("TestJob", 3, "Job failed");
    }
}
