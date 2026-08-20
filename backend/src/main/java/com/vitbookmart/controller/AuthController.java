package com.vitbookmart.controller;

import com.vitbookmart.dto.request.GoogleAuthRequest;
import com.vitbookmart.dto.request.RefreshTokenRequest;
import com.vitbookmart.dto.response.AuthResponse;
import com.vitbookmart.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody @Valid GoogleAuthRequest request) {

        return ResponseEntity.ok(authService.authenticateWithGoogle(request.getCode()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody @Valid RefreshTokenRequest request) {

        return ResponseEntity.ok(authService.refreshAccessToken(request.getRefreshToken()));
    }
}