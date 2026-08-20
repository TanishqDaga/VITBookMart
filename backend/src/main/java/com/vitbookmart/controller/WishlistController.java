package com.vitbookmart.controller;

import com.vitbookmart.dto.response.WishlistResponse;
import com.vitbookmart.security.AuthenticatedUserService;
import com.vitbookmart.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final AuthenticatedUserService authenticatedUserService;

    // GET WISHLIST

    @GetMapping("/my")
    public ResponseEntity<WishlistResponse> getWishlist(Authentication authentication) {

        ObjectId userId=authenticatedUserService.getCurrentUserId(authentication);

        return ResponseEntity.ok(wishlistService.getWishlist(userId));
    }


    // ADD LISTING TO WISHLIST

    @PostMapping("/add/{listingId}")
    public ResponseEntity<WishlistResponse> addToWishlist(Authentication authentication, @PathVariable ObjectId listingId) {

        ObjectId userId=authenticatedUserService.getCurrentUserId(authentication);
        return ResponseEntity.ok(wishlistService.addToWishlist(userId, listingId));
    }


    // REMOVE LISTING FROM WISHLIST

    @DeleteMapping("remove/{listingId}")
    public ResponseEntity<WishlistResponse> removeFromWishlist(Authentication authentication, @PathVariable ObjectId listingId) {

        ObjectId userId=authenticatedUserService.getCurrentUserId(authentication);

        return ResponseEntity.ok(wishlistService.removeFromWishlist(userId, listingId));
    }


    // CHECK IF LISTING IS WISHLISTED
    @GetMapping("isWishlisted/{listingId}")
    public ResponseEntity<Boolean> isWishlisted(Authentication authentication, @PathVariable ObjectId listingId) {

        ObjectId userId=authenticatedUserService.getCurrentUserId(authentication);

        return ResponseEntity.ok(wishlistService.isWishlisted(userId, listingId));
    }


    // CLEAR WISHLIST

    @DeleteMapping("/clear")
    public ResponseEntity<WishlistResponse> clearWishlist(Authentication authentication) {

        ObjectId userId=authenticatedUserService.getCurrentUserId(authentication);

        return ResponseEntity.ok(wishlistService.clearWishlist(userId));
    }
}