package com.vitbookmart.controller;

import com.vitbookmart.dto.request.CreateListingRequest;
import com.vitbookmart.dto.request.UpdateListingRequest;
import com.vitbookmart.dto.response.ListingDetailResponse;
import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    // CREATE LISTING


    @PostMapping(value = "/create/{sellerId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ListingResponse> createListing(
            @PathVariable ObjectId sellerId,
            @RequestPart("listing") @Valid CreateListingRequest request,
            @RequestPart("image") MultipartFile image) throws IOException {

        ListingResponse response = listingService.createListing(sellerId, request, image);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }



    // GET ALL LISTINGS
    @GetMapping
    public ResponseEntity<List<ListingResponse>> getAllListings() {

        return ResponseEntity.ok(listingService.getAllAvailableListings());
    }



    // GET LISTING BY ID

    @GetMapping("/{listingId}")
    public ResponseEntity<ListingDetailResponse> getListingById(@PathVariable ObjectId listingId) {

        return ResponseEntity.ok(listingService.getById(listingId));
    }



    // GET LISTINGS OF A SELLER


    @GetMapping("/my/{sellerId}")
    public ResponseEntity<List<ListingResponse>> getListingsBySeller(@PathVariable ObjectId sellerId) {

        return ResponseEntity.ok(listingService.getBySeller(sellerId));
    }



    // SEARCH BY TITLE

    @GetMapping("/search/title")
    public ResponseEntity<List<ListingResponse>> searchByTitle(@RequestParam String title) {

        return ResponseEntity.ok(listingService.searchByTitle(title));
    }



    // SEARCH BY SUBJECT

    @GetMapping("/search/subject")
    public ResponseEntity<List<ListingResponse>> searchBySubject(
            @RequestParam String subject
    ) {

        return ResponseEntity.ok(listingService.searchBySubject(subject));
    }



    // UPDATE LISTING

    @PutMapping("/{listingId}/seller/{sellerId}")
    public ResponseEntity<ListingResponse> updateListing(
            @PathVariable ObjectId listingId,
            @PathVariable ObjectId sellerId,
            @RequestBody UpdateListingRequest request
    ) {
        return ResponseEntity.ok(listingService.updateListing(listingId, sellerId, request));
    }



    // MARK LISTING AS SOLD

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



    // DELETE LISTING

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