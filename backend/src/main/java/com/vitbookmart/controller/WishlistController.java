package com.vitbookmart.controller;

import com.vitbookmart.dto.response.WishlistResponse;
import com.vitbookmart.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;


    // =========================================================
    // GET WISHLIST
    // =========================================================

    /*
     * If the user does not have a wishlist yet,
     * WishlistService creates an empty one.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<WishlistResponse> getWishlist(@PathVariable ObjectId userId) {

        return ResponseEntity.ok(wishlistService.getWishlist(userId));
    }


    // =========================================================
    // ADD LISTING TO WISHLIST
    // =========================================================

    @PostMapping("/{userId}/listings/{listingId}")
    public ResponseEntity<WishlistResponse> addToWishlist(@PathVariable ObjectId userId, @PathVariable ObjectId listingId) {

        return ResponseEntity.ok(wishlistService.addToWishlist(userId, listingId));
    }


    // =========================================================
    // REMOVE LISTING FROM WISHLIST
    // =========================================================

    @DeleteMapping("/{userId}/listings/{listingId}")
    public ResponseEntity<WishlistResponse> removeFromWishlist(
            @PathVariable ObjectId userId,
            @PathVariable ObjectId listingId
    ) {

        return ResponseEntity.ok(
                wishlistService.removeFromWishlist(
                        userId,
                        listingId
                )
        );
    }


    // =========================================================
    // CHECK IF LISTING IS WISHLISTED
    // =========================================================

    @GetMapping("/{userId}/listings/{listingId}")
    public ResponseEntity<Boolean> isWishlisted(
            @PathVariable ObjectId userId,
            @PathVariable ObjectId listingId
    ) {

        return ResponseEntity.ok(
                wishlistService.isWishlisted(
                        userId,
                        listingId
                )
        );
    }


    // =========================================================
    // CLEAR WISHLIST
    // =========================================================

    @DeleteMapping("/{userId}")
    public ResponseEntity<WishlistResponse> clearWishlist(
            @PathVariable ObjectId userId
    ) {

        return ResponseEntity.ok(
                wishlistService.clearWishlist(userId)
        );
    }
}