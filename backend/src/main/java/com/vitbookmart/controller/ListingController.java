package com.vitbookmart.controller;

import com.vitbookmart.dto.request.CreateListingRequest;
import com.vitbookmart.dto.request.UpdateListingRequest;
import com.vitbookmart.dto.response.ListingDetailResponse;
import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    // =========================================================
    // CREATE LISTING
    // =========================================================

    /*
     * User must have a complete profile to create a listing.
     *
     * Authentication will later provide sellerId automatically.
     * For now, sellerId is passed in the URL so we can test
     * the service without authentication.
     */
    @PostMapping("/seller/{sellerId}")
    public ResponseEntity<ListingResponse> createListing(
            @PathVariable ObjectId sellerId,
            @RequestBody CreateListingRequest request
    ) {

        ListingResponse response =
                listingService.createListing(sellerId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================================
    // GET ALL LISTINGS
    // =========================================================

    /*
     * Public endpoint.
     *
     * Login is NOT required to view listings.
     */
    @GetMapping
    public ResponseEntity<List<ListingResponse>> getAllListings() {

        return ResponseEntity.ok(
                listingService.getAllAvailableListings()
        );
    }


    // =========================================================
    // GET LISTING BY ID
    // =========================================================

    /*
     * Public endpoint.
     *
     * Returns detailed information including seller information.
     * Seller contact information is NOT returned here.
     *
     * Frontend can use the contact button separately when
     * the user is logged in.
     */
    @GetMapping("/{listingId}")
    public ResponseEntity<ListingDetailResponse> getListingById(
            @PathVariable ObjectId listingId
    ) {

        return ResponseEntity.ok(
                listingService.getById(listingId)
        );
    }


    // =========================================================
    // GET LISTINGS OF A SELLER
    // =========================================================

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<ListingResponse>> getListingsBySeller(
            @PathVariable ObjectId sellerId
    ) {

        return ResponseEntity.ok(
                listingService.getBySeller(sellerId)
        );
    }


    // =========================================================
    // SEARCH BY TITLE
    // =========================================================

    /*
     * Example:
     * GET /api/listings/search/title?title=DBMS
     */
    @GetMapping("/search/title")
    public ResponseEntity<List<ListingResponse>> searchByTitle(
            @RequestParam String title
    ) {

        return ResponseEntity.ok(
                listingService.searchByTitle(title)
        );
    }


    // =========================================================
    // SEARCH BY SUBJECT
    // =========================================================

    /*
     * Example:
     * GET /api/listings/search/subject?subject=DBMS
     */
    @GetMapping("/search/subject")
    public ResponseEntity<List<ListingResponse>> searchBySubject(
            @RequestParam String subject
    ) {

        return ResponseEntity.ok(
                listingService.searchBySubject(subject)
        );
    }


    // =========================================================
    // UPDATE LISTING
    // =========================================================

    /*
     * Only the seller who owns the listing can update it.
     *
     * sellerId is passed separately for now.
     * Later authentication will provide the logged-in user's ID.
     */
    @PutMapping("/{listingId}/seller/{sellerId}")
    public ResponseEntity<ListingResponse> updateListing(
            @PathVariable ObjectId listingId,
            @PathVariable ObjectId sellerId,
            @RequestBody UpdateListingRequest request
    ) {

        return ResponseEntity.ok(
                listingService.updateListing(
                        listingId,
                        sellerId,
                        request
                )
        );
    }


    // =========================================================
    // MARK LISTING AS SOLD
    // =========================================================

    /*
     * Only the seller can mark their listing as sold.
     */
    @PatchMapping("/{listingId}/seller/{sellerId}/sold")
    public ResponseEntity<ListingResponse> markAsSold(
            @PathVariable ObjectId listingId,
            @PathVariable ObjectId sellerId
    ) {

        return ResponseEntity.ok(
                listingService.markAsSold(
                        listingId,
                        sellerId
                )
        );
    }


    // =========================================================
    // DELETE LISTING
    // =========================================================

    /*
     * Only the owner can delete their listing.
     *
     * Both listingId and sellerId are intentionally passed.
     */
    @DeleteMapping("/{listingId}/seller/{sellerId}")
    public ResponseEntity<Void> deleteListing(
            @PathVariable ObjectId listingId,
            @PathVariable ObjectId sellerId
    ) {

        listingService.deleteListing(
                listingId,
                sellerId
        );

        return ResponseEntity.noContent().build();
    }
}