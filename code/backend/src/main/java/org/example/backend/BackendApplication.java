package org.example.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableKafka
@EnableJpaRepositories(
    basePackages = "org.example.backend.repository",
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "org\\.example\\.backend\\.repository\\.mongo\\..*"
    )
)
@EnableMongoRepositories(
    basePackages = "org.example.backend.repository.mongo"
)
@EnableRedisRepositories(
    basePackages = "org.example.backend.repository.redis"
)
public class BackendApplication {

    public static void main(String[] args) {
        // Sửa ở đây: Fix lỗi "Asia/Saigon" của PostgreSQL JDBC Driver
        System.setProperty("user.timezone", "Asia/Ho_Chi_Minh");
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));

        SpringApplication.run(BackendApplication.class, args);
    }

}
