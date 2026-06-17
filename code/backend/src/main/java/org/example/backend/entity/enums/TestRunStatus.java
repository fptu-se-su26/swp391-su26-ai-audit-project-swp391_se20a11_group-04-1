package org.example.backend.entity.enums;

public enum TestRunStatus {
    PENDING,        // vừa tạo, chờ Playwright worker pick up
    RUNNING,        // Playwright đang thực thi
    COMPLETED,      // run hoàn thành bình thường (dù test pass hay fail)
    CANCELLED,      // user chủ động huỷ
    SYSTEM_ERROR,   // Playwright crash hoặc fatal exception không recover được
    TIMED_OUT;      // watchdog phát hiện run không phản hồi > 30 phút

    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED
            || this == SYSTEM_ERROR || this == TIMED_OUT;
    }
}
