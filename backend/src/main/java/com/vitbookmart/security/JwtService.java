package com.vitbookmart.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;

    private static final long ACCESS_TOKEN_EXPIRATION =
            15 * 60 * 1000L;

    private static final long REFRESH_TOKEN_EXPIRATION =
            30L * 24 * 60 * 60 * 1000L;

    public JwtService(@Value("${jwt.secret}") String secret) {

        this.secretKey = Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(secret)
        );
    }


    // ============================================================
    // USER ACCESS TOKEN
    // ============================================================

    public String generateAccessToken(
            String userId,
            String email
    ) {

        Date now = new Date();

        return Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .claim("type", "ACCESS")
                .issuedAt(now)
                .expiration(
                        new Date(
                                now.getTime()
                                        + ACCESS_TOKEN_EXPIRATION
                        )
                )
                .signWith(secretKey)
                .compact();
    }


    // ============================================================
    // USER REFRESH TOKEN
    // ============================================================

    public String generateRefreshToken(String userId) {

        Date now = new Date();

        return Jwts.builder()
                .subject(userId)
                .claim("type", "REFRESH")
                .issuedAt(now)
                .expiration(
                        new Date(
                                now.getTime()
                                        + REFRESH_TOKEN_EXPIRATION
                        )
                )
                .signWith(secretKey)
                .compact();
    }


    // ============================================================
    // ADMIN ACCESS TOKEN
    // ============================================================

    public String generateAdminAccessToken(
            String adminId,
            String username
    ) {

        Date now = new Date();

        return Jwts.builder()
                .subject(adminId)
                .claim("username", username)
                .claim("role", "ADMIN")
                .claim("type", "ADMIN_ACCESS")
                .issuedAt(now)
                .expiration(
                        new Date(
                                now.getTime()
                                        + ACCESS_TOKEN_EXPIRATION
                        )
                )
                .signWith(secretKey)
                .compact();
    }


    // ============================================================
    // ADMIN REFRESH TOKEN
    // ============================================================

    public String generateAdminRefreshToken(
            String adminId
    ) {

        Date now = new Date();

        return Jwts.builder()
                .subject(adminId)
                .claim("type", "ADMIN_REFRESH")
                .issuedAt(now)
                .expiration(
                        new Date(
                                now.getTime()
                                        + REFRESH_TOKEN_EXPIRATION
                        )
                )
                .signWith(secretKey)
                .compact();
    }


    // ============================================================
    // PARSE TOKEN
    // ============================================================

    public Claims parseToken(String token) {

        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }


    // ============================================================
    // EXTRACT USER ID / SUBJECT
    // ============================================================

    public String extractUserId(String token) {

        return parseToken(token).getSubject();
    }


    // ============================================================
    // TOKEN TYPE
    // ============================================================

    public String extractTokenType(String token) {

        return parseToken(token)
                .get("type", String.class);
    }


    public boolean isRefreshToken(String token) {

        return "REFRESH".equals(
                extractTokenType(token)
        );
    }


    public boolean isAdminRefreshToken(String token) {

        return "ADMIN_REFRESH".equals(
                extractTokenType(token)
        );
    }


    public boolean isAccessToken(String token) {

        return "ACCESS".equals(
                extractTokenType(token)
        );
    }


    public boolean isAdminAccessToken(String token) {

        return "ADMIN_ACCESS".equals(
                extractTokenType(token)
        );
    }
}