package com.vitbookmart.service;

import com.vitbookmart.entity.User;
import com.vitbookmart.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final GoogleOAuthService googleOAuthService;
    private final UserService userService;

    public User authenticateWithGoogle(String code) {

        // Get verified information from Google
        GoogleUserInfo googleUser = googleOAuthService.authenticate(code);

        // VIT email restriction
        if (googleUser.getEmail() == null )
               // || !googleUser.getEmail().toLowerCase().endsWith("@vitstudent.ac.in"))
        {

            throw new IllegalArgumentException("Only VIT student accounts are allowed");
        }

        // Check whether user already exists
        try {

            return userService.getEntityByGoogleId(googleUser.getGoogleId());

        } catch (ResourceNotFoundException e) {

            // First Google login → create user

            User user = new User();

            user.setGoogleId(googleUser.getGoogleId());
            user.setEmail(googleUser.getEmail());
            user.setName(googleUser.getName());

            return userService.createUser(user);
        }
    }
}