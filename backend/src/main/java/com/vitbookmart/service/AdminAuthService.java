package com.vitbookmart.service;

import com.vitbookmart.dto.request.AdminLoginRequest;
import com.vitbookmart.dto.response.AdminAuthResponse;
import com.vitbookmart.entity.Admin;
import com.vitbookmart.exception.ResourceNotFoundException;
import com.vitbookmart.repository.AdminRepository;
import com.vitbookmart.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;


    public AdminAuthResponse login(AdminLoginRequest request) {

        Admin admin = adminRepository
                .findByUsername(request.username()).orElseThrow(() ->
                        new IllegalArgumentException("Invalid username or password")
                );


        if (!admin.isActive()) {

            throw new IllegalArgumentException("Admin account is inactive");
        }


        if (!passwordEncoder.matches(request.password(), admin.getPassword())) {

            throw new IllegalArgumentException("Invalid username or password");
        }


        String accessToken = jwtService.generateAdminAccessToken(admin.getId().toHexString(), admin.getUsername());

        String refreshToken = jwtService.generateAdminRefreshToken(admin.getId().toHexString());;


        return new AdminAuthResponse(accessToken,refreshToken);
    }

    public AdminAuthResponse refreshAdminToken(
            String refreshToken
    ) {

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException(
                    "Refresh token is required"
            );
        }

        // Make sure this is an ADMIN refresh token
        if (!jwtService.isAdminRefreshToken(refreshToken)) {
            throw new IllegalArgumentException(
                    "Invalid admin refresh token"
            );
        }

        String adminId =
                jwtService.extractUserId(refreshToken);

        Admin admin = adminRepository.findById(
                new ObjectId(adminId)
        ).orElseThrow(() ->
                new IllegalArgumentException(
                        "Admin not found"
                )
        );

        // Important: deleted/deactivated admin cannot refresh
        if (!admin.isActive()) {
            throw new IllegalArgumentException(
                    "Admin account is inactive"
            );
        }

        String accessToken =
                jwtService.generateAdminAccessToken(
                        admin.getId().toHexString(),
                        admin.getUsername()
                );

        return new AdminAuthResponse(
                accessToken,
                refreshToken
        );
    }
}