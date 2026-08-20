package com.vitbookmart.controller;

import com.vitbookmart.dto.request.UpdateUserProfileRequest;
import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.dto.response.UserResponse;
import com.vitbookmart.security.AuthenticatedUserService;
import com.vitbookmart.service.ListingService;
import com.vitbookmart.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthenticatedUserService authenticatedUserService;
    private final ListingService listingService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(Authentication authentication) {

        ObjectId userId = authenticatedUserService.getCurrentUserId(authentication);

        return ResponseEntity.ok(userService.getById(userId));
    }

    @PutMapping("/me/update")
    public ResponseEntity<UserResponse> updateMyProfile(Authentication authentication,
            @Valid @RequestBody UpdateUserProfileRequest request
    ) {

        ObjectId userId = authenticatedUserService.getCurrentUserId(authentication);

        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }


    // GET LISTINGS OF A SELLER
    @GetMapping("/my/listings")
    public ResponseEntity<List<ListingResponse>> getListingsBySeller(Authentication authentication) {

        ObjectId sellerId=authenticatedUserService.getCurrentUserId(authentication);

        return ResponseEntity.ok(listingService.getBySeller(sellerId));
    }
}