package org.example.backend.entity.enums;

public enum TestExecutionStatus {
    PENDING,    // chờ chạy
    RUNNING,    // Playwright đang chạy test case này
    PASSED,     // test case pass
    FAILED,     // test case fail (assertion, timeout, exception trong test logic)
    SKIPPED,    // bị bỏ qua (dependency failed, explicit skip trong test)
    ABORTED;    // bị force-stop do TestRun CANCELLED hoặc TIMED_OUT

    public boolean isTerminal() {
        return this == PASSED || this == FAILED
            || this == SKIPPED || this == ABORTED;
    }

    // Dùng để tính completedCount — TẤT CẢ terminal statuses đều count
    public boolean countsAsCompleted() {
        return isTerminal();
    }
}
