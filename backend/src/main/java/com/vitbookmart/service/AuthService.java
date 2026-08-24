package com.vitbookmart.service;

import com.vitbookmart.dto.response.AuthResponse;
import com.vitbookmart.dto.response.UserResponse;
import com.vitbookmart.entity.User;
import com.vitbookmart.entity.enums.UserStatus;
import com.vitbookmart.exception.ResourceNotFoundException;
import com.vitbookmart.exception.TerminatedUserException;
import com.vitbookmart.mapper.UserMapper;
import com.vitbookmart.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final GoogleOAuthService googleOAuthService;
    private final UserService userService;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    public AuthResponse authenticateWithGoogle(String code) {

        GoogleUserInfo googleUser = googleOAuthService.authenticate(code);

        // Only VIT student accounts
        if (googleUser.getEmail() == null || !googleUser.getEmail().toLowerCase().endsWith("@vitstudent.ac.in")) {

            throw new IllegalArgumentException("Only VIT student accounts are allowed");
        }

        User user;

        try {

            // Existing user
            user = userService.getEntityByGoogleId(googleUser.getGoogleId());
            if (user.getStatus() == UserStatus.TERMINATED) {
                throw new TerminatedUserException("You are terminated");
            }

        } catch (ResourceNotFoundException e){

            // First Google login
            user = new User();

            user.setGoogleId(googleUser.getGoogleId());

            user.setEmail(googleUser.getEmail());

            user.setName(googleUser.getName());

            user = userService.createUser(user);
        }

        String accessToken = jwtService.generateAccessToken(user.getId().toString(), user.getEmail());

        String refreshToken = jwtService.generateRefreshToken(user.getId().toString());

        UserResponse userResponse = userMapper.toResponse(user);

        return new AuthResponse(accessToken, refreshToken, userResponse);
    }
    public AuthResponse refreshAccessToken(String refreshToken) {

        try {

            if (!jwtService.isRefreshToken(refreshToken)) {
                throw new IllegalArgumentException("Invalid refresh token");
            }

            String userId = jwtService.extractUserId(refreshToken);

            User user = userService.getEntityById(new ObjectId(userId));

            if (user.getStatus() == UserStatus.TERMINATED) {
                throw new TerminatedUserException("You are terminated");
            }

            String newAccessToken = jwtService.generateAccessToken(user.getId().toString(), user.getEmail());

            UserResponse userResponse = userMapper.toResponse(user);

            return new AuthResponse(newAccessToken, refreshToken, userResponse);

        } catch (TerminatedUserException e) {
            throw e;

        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }
    }
}
