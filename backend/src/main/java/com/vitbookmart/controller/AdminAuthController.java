package com.vitbookmart.controller;

import com.vitbookmart.dto.request.AdminLoginRequest;
import com.vitbookmart.dto.request.RefreshTokenRequest;
import com.vitbookmart.dto.response.AdminAuthResponse;
import com.vitbookmart.service.AdminAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;


    @PostMapping("/login")
    public ResponseEntity<AdminAuthResponse> login(@RequestBody @Valid AdminLoginRequest request) {

        return ResponseEntity.ok(adminAuthService.login(request));
    }
    @PostMapping("/refresh")
    public ResponseEntity<AdminAuthResponse> refreshAdminToken(@RequestBody RefreshTokenRequest request) {

        return ResponseEntity.ok(adminAuthService.refreshAdminToken(request.getRefreshToken()));
    }
}