package com.vitbookmart.controller;

import com.vitbookmart.dto.request.CreateAdminRequest;
import com.vitbookmart.dto.request.UpdateAdminListingRequest;
import com.vitbookmart.dto.request.UpdateAdminRequest;
import com.vitbookmart.dto.response.AdminResponse;
import com.vitbookmart.dto.response.ListingDetailResponse;
import com.vitbookmart.dto.response.UserResponse;
import com.vitbookmart.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    
    // ADMIN MANAGEMENT

    // Create admin
    @PostMapping("/create")
    public ResponseEntity<AdminResponse> createAdmin(@RequestBody @Valid CreateAdminRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createAdmin(request));
    }


    // Get admin by ID
    @GetMapping("/{adminId}")
    public ResponseEntity<AdminResponse> getAdminById(@PathVariable ObjectId adminId) {

        return ResponseEntity.ok(adminService.getById(adminId));
    }


    // Get admin by username
    @GetMapping("/username")
    public ResponseEntity<AdminResponse> getAdminByUsername(@RequestParam String username) {

        return ResponseEntity.ok(adminService.getByUsername(username));
    }


    // Get all admins
    @GetMapping("/admins")
    public ResponseEntity<List<AdminResponse>> getAllAdmins() {

        return ResponseEntity.ok(adminService.getAll());
    }


    // Update admin username
    @PutMapping("/update/{adminId}")
    public ResponseEntity<AdminResponse> updateAdminProfile(@PathVariable ObjectId adminId, @RequestBody @Valid UpdateAdminRequest request) {

        return ResponseEntity.ok(adminService.updateProfile(adminId, request));
    }


    // Delete admin
    @DeleteMapping("/admins/{adminId}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable ObjectId adminId) {

        adminService.deleteAdmin(adminId);

        return ResponseEntity.noContent().build();
    }


    
    // USER MANAGEMENT
    

    // Get user
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable ObjectId userId) {

        return ResponseEntity.ok(adminService.getUser(userId));
    }


    // Get all users
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {

        return ResponseEntity.ok(adminService.getAllUsers());
    }


    // Terminate user
    @PatchMapping("/users/terminate/{userId}")
    public ResponseEntity<UserResponse> terminateUser(@PathVariable ObjectId userId) {

        return ResponseEntity.ok(adminService.terminateUser(userId));
    }


    // Make user paid
    @PatchMapping("/users/paid/{userId}")
    public ResponseEntity<UserResponse> makeUserPaid(@PathVariable ObjectId userId) {

        return ResponseEntity.ok(adminService.makeUserPaid(userId));
    }


    // Make user free
    @PatchMapping("/users/free/{userId}")
    public ResponseEntity<UserResponse> makeUserFree(@PathVariable ObjectId userId) {

        return ResponseEntity.ok(adminService.makeUserFree(userId));
    }


    // Delete user
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable ObjectId userId) {

        adminService.deleteUser(userId);

        return ResponseEntity.noContent().build();
    }


    
    // LISTING MANAGEMENT
    

    // Get listing
    @GetMapping("/listings/{listingId}")
    public ResponseEntity<ListingDetailResponse> getListing(@PathVariable ObjectId listingId) {

        return ResponseEntity.ok(adminService.getListing(listingId));
    }


    // Get all listings
    @GetMapping("/listings")
    public ResponseEntity<List<ListingDetailResponse>> getAllListings() {

        return ResponseEntity.ok(adminService.getAllListings());
    }


    // Get available listings
    @GetMapping("/listings/available")
    public ResponseEntity<List<ListingDetailResponse>> getAvailableListings() {

        return ResponseEntity.ok(adminService.getAvailableListings());
    }


    // Get sold listings
    @GetMapping("/listings/sold")
    public ResponseEntity<List<ListingDetailResponse>> getSoldListings() {

        return ResponseEntity.ok(adminService.getSoldListings());
    }


    // Update any listing
    @PutMapping("/listings/{listingId}")
    public ResponseEntity<ListingDetailResponse> updateListing(
            @PathVariable ObjectId listingId,
            @RequestBody @Valid UpdateAdminListingRequest request) {

        return ResponseEntity.ok(adminService.updateListing(listingId, request));
    }


    // Delete any listing
    @DeleteMapping("/listings/{listingId}")
    public ResponseEntity<Void> deleteListing(@PathVariable ObjectId listingId) {

        adminService.deleteListing(listingId);

        return ResponseEntity.noContent().build();
    }
}