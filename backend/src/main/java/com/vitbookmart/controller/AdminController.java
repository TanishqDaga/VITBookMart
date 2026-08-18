package com.vitbookmart.controller;

import com.vitbookmart.entity.Admin;
import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.User;
import com.vitbookmart.service.AdminService;
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
    @PostMapping
    public ResponseEntity<Admin> createAdmin(@RequestBody Admin admin) {

        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createAdmin(admin));
    }

    // Get admin by ID
    @GetMapping("/{adminId}")
    public ResponseEntity<Admin> getAdminById(@PathVariable ObjectId adminId) {

        return ResponseEntity.ok(adminService.getById(adminId));
    }

    // Get admin by email
    @GetMapping("/email")
    public ResponseEntity<Admin> getAdminByEmail(@RequestParam String email) {

        return ResponseEntity.ok(adminService.getByEmail(email));
    }

    // Get all admins
    @GetMapping
    public ResponseEntity<List<Admin>> getAllAdmins() {

        return ResponseEntity.ok(adminService.getAll());
    }


    // Update admin profile
    @PutMapping("/{adminId}")
    public ResponseEntity<Admin> updateAdminProfile(
            @PathVariable ObjectId adminId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email
    ) {

        return ResponseEntity.ok(adminService.updateProfile(adminId, name, email));
    }


    // Delete admin
    @DeleteMapping("/{adminId}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable ObjectId adminId) {

        adminService.deleteAdmin(adminId);

        return ResponseEntity.noContent().build();
    }


    // USER MANAGEMENT

    // Get user
    @GetMapping("/users/{userId}")
    public ResponseEntity<User> getUser(@PathVariable ObjectId userId) {

        return ResponseEntity.ok(adminService.getUser(userId));
    }


    // Get all users
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {

        return ResponseEntity.ok(adminService.getAllUsers());
    }

    // Terminate user
    @PatchMapping("/users/{userId}/terminate")
    public ResponseEntity<User> terminateUser(@PathVariable ObjectId userId) {

        return ResponseEntity.ok(adminService.terminateUser(userId));
    }

    // Make user paid
    @PatchMapping("/users/makePaid/{userId}")
    public ResponseEntity<User> makeUserPaid(@PathVariable ObjectId userId) {

        return ResponseEntity.ok(adminService.makeUserPaid(userId));
    }


    // Make user free
    @PatchMapping("/users/{userId}/free")
    public ResponseEntity<User> makeUserFree(@PathVariable ObjectId userId) {

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
    public ResponseEntity<Listing> getListing(@PathVariable ObjectId listingId) {

        return ResponseEntity.ok(adminService.getListing(listingId));
    }

    // Get all listings
    @GetMapping("/listings")
    public ResponseEntity<List<Listing>> getAllListings() {

        return ResponseEntity.ok(adminService.getAllListings());
    }


    // Get available listings
    @GetMapping("/listings/available")
    public ResponseEntity<List<Listing>> getAvailableListings() {

        return ResponseEntity.ok(adminService.getAvailableListings());
    }


    // Get sold listings
    @GetMapping("/listings/sold")
    public ResponseEntity<List<Listing>> getSoldListings() {

        return ResponseEntity.ok(adminService.getSoldListings());
    }


    // Update any listing
    @PutMapping("/listings/{listingId}")
    public ResponseEntity<Listing> updateListing(@PathVariable ObjectId listingId, @RequestBody Listing updatedListing) {

        return ResponseEntity.ok(adminService.updateListing(listingId, updatedListing));
    }


    // Delete any listing
    @DeleteMapping("/listings/{listingId}")
    public ResponseEntity<Void> deleteListing(@PathVariable ObjectId listingId) {

        adminService.deleteListing(listingId);

        return ResponseEntity.noContent().build();
    }
}