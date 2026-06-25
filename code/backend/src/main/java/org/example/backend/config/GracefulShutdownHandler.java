package org.example.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import java.util.concurrent.Executor;

@Component
@Slf4j
public class GracefulShutdownHandler implements ApplicationListener<ContextClosedEvent> {

    private final ThreadPoolTaskExecutor defaultAsyncExecutor;
    private final ThreadPoolTaskExecutor slaJobExecutor;
    private final ThreadPoolTaskExecutor apiTestExecutor;
    private final ThreadPoolTaskExecutor auditExecutor;

    public GracefulShutdownHandler(
            @Qualifier("defaultAsyncExecutor") Executor defaultAsyncExecutor,
            @Qualifier("slaJobExecutor") Executor slaJobExecutor,
            @Qualifier("apiTestExecutor") Executor apiTestExecutor,
            @Qualifier("auditExecutor") Executor auditExecutor) {
        this.defaultAsyncExecutor = (defaultAsyncExecutor instanceof ThreadPoolTaskExecutor) ? (ThreadPoolTaskExecutor) defaultAsyncExecutor : null;
        this.slaJobExecutor = (slaJobExecutor instanceof ThreadPoolTaskExecutor) ? (ThreadPoolTaskExecutor) slaJobExecutor : null;
        this.apiTestExecutor = (apiTestExecutor instanceof ThreadPoolTaskExecutor) ? (ThreadPoolTaskExecutor) apiTestExecutor : null;
        this.auditExecutor = (auditExecutor instanceof ThreadPoolTaskExecutor) ? (ThreadPoolTaskExecutor) auditExecutor : null;
    }

    @Override
    public void onApplicationEvent(ContextClosedEvent event) {
        log.info("ContextClosedEvent received. Starting graceful shutdown of executors.");
        shutdownExecutor(defaultAsyncExecutor, "defaultAsyncExecutor");
        shutdownExecutor(slaJobExecutor, "slaJobExecutor");
        shutdownExecutor(apiTestExecutor, "apiTestExecutor");
        shutdownExecutor(auditExecutor, "auditExecutor");
    }

    private void shutdownExecutor(ThreadPoolTaskExecutor executor, String name) {
        if (executor != null) {
            log.info("Shutting down executor: {}", name);
            executor.setWaitForTasksToCompleteOnShutdown(true);
            executor.setAwaitTerminationSeconds(20);
            executor.shutdown();
            log.info("Executor {} shutdown completed.", name);
        } else {
            log.warn("Executor {} is not a ThreadPoolTaskExecutor, skipping shutdown.", name);
        }
    }
}
