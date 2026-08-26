package com.vitbookmart.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // CORS PREFLIGHT
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // ADMIN LOGIN
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/admin/auth/login",
                                "/api/admin/auth/refresh"
                        ).permitAll()

                        // ADMIN APIs
                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")

                        // USER AUTHENTICATION
                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()

                        // PUBLIC LISTING APIs
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/listings/search",
                                "/api/listings/latest",
                                "/api/listings",
                                "/api/listings/{listingId}"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/health"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/listings/*"
                        ).permitAll()

                        // EVERYTHING ELSE
                        .anyRequest().authenticated()
                )

                // JWT authentication
                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(jwt ->
                                jwt.jwtAuthenticationConverter(
                                        new JwtAuthenticationConverter()
                                )
                        )
                );

        return http.build();
    }
}