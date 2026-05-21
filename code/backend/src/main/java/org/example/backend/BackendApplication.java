package org.example.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BackendApplication {

    public static void main(String[] args) {
        // Sửa ở đây: Dùng "GMT+7" thay vì "Asia/Ho_Chi_Minh"
        // để đảm bảo bất kỳ phiên bản PostgreSQL nào cũng hiểu được.
        TimeZone.setDefault(TimeZone.getTimeZone("GMT+7"));

        SpringApplication.run(BackendApplication.class, args);
    }

}