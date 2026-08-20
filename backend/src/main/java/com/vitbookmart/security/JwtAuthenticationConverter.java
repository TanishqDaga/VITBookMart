package com.vitbookmart.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.List;

public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {

        String tokenType = jwt.getClaimAsString("type");

        // ADMIN ACCESS TOKEN

        if ("ADMIN_ACCESS".equals(tokenType)) {

            String role = jwt.getClaimAsString("role");

            if (!"ADMIN".equals(role)) {
                throw new IllegalArgumentException("Invalid admin token");
            }

            return new AdminAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        }

        // NORMAL USER ACCESS TOKEN

        if ("ACCESS".equals(tokenType)) {

            return new JwtAuthenticationToken(jwt, List.of());
        }


        
        // EVERYTHING ELSE
        throw new IllegalArgumentException("Invalid token type");
    }
}