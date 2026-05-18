package org.example.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BackendApplication {

    public static void main(String[] args) {
        // Fix: Windows JVM trả về "Asia/Saigon" — PostgreSQL không nhận.
        // Override sang "Asia/Ho_Chi_Minh" trước khi JDBC driver kết nối.
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));

        SpringApplication.run(BackendApplication.class, args);
    }

}
