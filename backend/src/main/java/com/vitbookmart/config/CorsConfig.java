package com.vitbookmart.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        // Frontend origins allowed to call this backend
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "https://vitbookmart.in"
        ));

        // HTTP methods your frontend may use
        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        // Headers sent by the frontend
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept"
        ));

        // Expose these response headers to the browser if needed
        configuration.setExposedHeaders(List.of(
                "Authorization"
        ));

        // Your authentication uses JWT in the Authorization header,
        // not browser cookies.
        configuration.setAllowCredentials(false);

        // Cache browser's CORS preflight result for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}