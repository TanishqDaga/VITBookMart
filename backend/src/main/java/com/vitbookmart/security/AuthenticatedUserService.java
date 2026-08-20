package com.vitbookmart.security;

import com.vitbookmart.entity.User;
import com.vitbookmart.service.UserService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticatedUserService {

    private final UserService userService;

    public ObjectId getCurrentUserId(Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();

        return new ObjectId(jwt.getSubject());
    }

    public User getCurrentUser(Authentication authentication) {

        return userService.getEntityById(getCurrentUserId(authentication));
    }
}