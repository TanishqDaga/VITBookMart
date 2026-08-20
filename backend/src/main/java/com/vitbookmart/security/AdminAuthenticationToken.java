package com.vitbookmart.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collection;

public class AdminAuthenticationToken
        extends JwtAuthenticationToken {

    public AdminAuthenticationToken(
            Jwt jwt,
            Collection<? extends GrantedAuthority> authorities
    ) {

        super(jwt, authorities);
    }
}