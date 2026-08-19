package com.vitbookmart.controller;

import com.vitbookmart.dto.request.GoogleAuthRequest;
import com.vitbookmart.entity.User;
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
    public ResponseEntity<User> googleLogin(@RequestBody @Valid GoogleAuthRequest request) {

        User user = authService.authenticateWithGoogle(request.getCode());

        return ResponseEntity.ok(user);
    }
}