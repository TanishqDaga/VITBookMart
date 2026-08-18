package com.vitbookmart.controller;

import com.vitbookmart.dto.response.ContactSellerResponse;
import com.vitbookmart.service.ContactSellerService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ContactSellerController {

    private final ContactSellerService contactSellerService;

    @GetMapping("contact/{listingId}")
    public ResponseEntity<ContactSellerResponse> contactSeller(@PathVariable ObjectId listingId) {

        return ResponseEntity.ok(contactSellerService.getContactUrl(listingId));
    }
}