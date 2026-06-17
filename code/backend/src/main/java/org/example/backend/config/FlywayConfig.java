package org.example.backend.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

@Component
public class FlywayConfig implements BeanPostProcessor {

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof Flyway flyway) {
            // Automatically repair the database schema history table to resolve checksum/version mismatches
            flyway.repair();
        }
        return bean;
    }
}
