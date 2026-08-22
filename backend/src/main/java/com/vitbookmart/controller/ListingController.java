package com.vitbookmart.controller;

import com.vitbookmart.dto.request.CreateListingRequest;
import com.vitbookmart.dto.request.UpdateListingRequest;
import com.vitbookmart.dto.response.ListingDetailResponse;
import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.dto.response.PaginatedResponse;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingType;
import com.vitbookmart.security.AuthenticatedUserService;
import com.vitbookmart.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;
    private final AuthenticatedUserService authenticatedUserService;


    // CREATE LISTING
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ListingResponse> createListing(
            Authentication authentication,
            @RequestPart("listing") @Valid CreateListingRequest request,
            @RequestPart("image") MultipartFile image) throws IOException {

        ObjectId sellerId=authenticatedUserService.getCurrentUserId(authentication);

        ListingResponse response = listingService.createListing(sellerId, request, image);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // GET ALL LISTINGS
    @GetMapping
    public ResponseEntity<List<ListingResponse>> getAllAvailableListings() {

        return ResponseEntity.ok(listingService.getAllAvailableListings());
    }


    // GET LISTING BY ID
    @GetMapping("/{listingId}")
    public ResponseEntity<ListingDetailResponse> getListingById(@PathVariable ObjectId listingId) {

        return ResponseEntity.ok(listingService.getById(listingId));
    }

    // UPDATE LISTING
    @PutMapping("/update/{listingId}")
    public ResponseEntity<ListingResponse> updateListing(
            Authentication authentication,
            @PathVariable ObjectId listingId,
            @RequestBody @Valid UpdateListingRequest request
    ) {

        ObjectId sellerId=authenticatedUserService.getCurrentUserId(authentication);

        return ResponseEntity.ok(listingService.updateListing(listingId, sellerId, request));
    }


    // MARK LISTING AS SOLD

    @PatchMapping("markSold/{listingId}")
    public ResponseEntity<ListingResponse> markAsSold(Authentication authentication, @PathVariable ObjectId listingId) {

        ObjectId sellerId=authenticatedUserService.getCurrentUserId(authentication);
        return ResponseEntity.ok(listingService.markAsSold(listingId, sellerId));
    }

    //GET LATEST LISTINGS
    @GetMapping("/latest")
    public ResponseEntity<PaginatedResponse<ListingResponse>> getLatestListings(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(listingService.getLatestListings(pageable));
    }

    //SEARCH WITH FILTERS
    @GetMapping("/search")
    public ResponseEntity<PaginatedResponse<ListingResponse>> searchListings(

            @RequestParam(required = false)
            String query,

            @RequestParam(required = false)
            ListingType type,

            @RequestParam(required = false)
            ListingCategory category,

            @RequestParam(required = false, defaultValue = "latest")
            String sort,

            @PageableDefault(size = 20)
            Pageable pageable
    ) {

        return ResponseEntity.ok(listingService.searchListings(query, type, category, sort, pageable));
    }
}