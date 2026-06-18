package org.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:80}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(request -> {
                    var config = new org.springframework.web.cors.CorsConfiguration();
                    config.setAllowedOrigins(java.util.Arrays.asList(allowedOrigins.split(",")));
                    config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(java.util.List.of("*"));
                    config.setAllowCredentials(true);
                    return config;
                }))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/classrooms/join").permitAll()
                        .requestMatchers("/api/v1/github/webhook").permitAll()
                        .requestMatchers("/api/v1/evidence/test-evidence").permitAll()
                        .requestMatchers("/api/v1/test-cases/**", "/api/v1/test-runs/**").permitAll()
                        .requestMatchers("/internal/test-runs/**").permitAll()
                        .requestMatchers("/internal/agent-tasks/**").permitAll()
                        .requestMatchers("/api/v1/agent-tasks/**").permitAll()
                        .requestMatchers("/api/ws/**", "/ws/notifications/**").permitAll()
                        .requestMatchers("/api/ai/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}
