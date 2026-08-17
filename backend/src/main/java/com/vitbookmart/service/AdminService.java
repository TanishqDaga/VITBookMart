package com.vitbookmart.service;

import com.vitbookmart.entity.Admin;
import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.User;
import com.vitbookmart.entity.enums.ListingStatus;
import com.vitbookmart.entity.enums.UserStatus;
import com.vitbookmart.repository.AdminRepository;
import com.vitbookmart.repository.ListingRepository;
import com.vitbookmart.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    // ---------------- ADMIN ----------------

    public Admin createAdmin(Admin admin) {

        if (adminRepository.existsByEmail(admin.getEmail())) {
            throw new IllegalArgumentException("Admin already exists");
        }

        return adminRepository.save(admin);
    }

    public Admin getById(ObjectId adminId) {

        return adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
    }

    public Admin getByEmail(String email) {

        return adminRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
    }

    public List<Admin> getAll() {
        return adminRepository.findAll();
    }

    public Admin updateProfile(ObjectId adminId, String name, String email) {

        Admin admin = getById(adminId);

        if (name != null && !name.isBlank()) {
            admin.setName(name);
        }

        if (email != null && !email.isBlank() && !email.equals(admin.getEmail())) {

            if (adminRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Email already belongs to another admin");
            }

            admin.setEmail(email);
        }

        return adminRepository.save(admin);
    }

    public void deleteAdmin(ObjectId adminId) {

        if (!adminRepository.existsById(adminId)) {
            throw new IllegalArgumentException("Admin not found");
        }

        adminRepository.deleteById(adminId);
    }

    // ---------------- USER MANAGEMENT ----------------

    public User getUser(ObjectId userId) {

        return userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User terminateUser(ObjectId userId) {

        User user = getUser(userId);

        user.setStatus(UserStatus.TERMINATED);

        return userRepository.save(user);
    }

    public User makeUserPaid(ObjectId userId) {

        User user = getUser(userId);

        user.setStatus(UserStatus.PAID);

        return userRepository.save(user);
    }

    public User makeUserFree(ObjectId userId) {

        User user = getUser(userId);

        user.setStatus(UserStatus.FREE);

        return userRepository.save(user);
    }

    public void deleteUser(ObjectId userId) {

        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found");
        }

        userRepository.deleteById(userId);
    }

    // ---------------- LISTING MANAGEMENT ----------------

    public Listing getListing(ObjectId listingId) {

        return listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));
    }

    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }

    public List<Listing> getAvailableListings() {
        return listingRepository.findByStatus(ListingStatus.AVAILABLE);
    }

    public List<Listing> getSoldListings() {
        return listingRepository.findByStatus(ListingStatus.SOLD);
    }

    public Listing updateListing(
            ObjectId listingId,
            Listing updatedListing
    ) {

        Listing existingListing = getListing(listingId);

        existingListing.setTitle(updatedListing.getTitle());
        existingListing.setDescription(updatedListing.getDescription());
        existingListing.setSubject(updatedListing.getSubject());
        existingListing.setCategory(updatedListing.getCategory());
        existingListing.setType(updatedListing.getType());
        existingListing.setPrice(updatedListing.getPrice());
        existingListing.setImageUrl(updatedListing.getImageUrl());
        existingListing.setUnavailableExamSlots(
                updatedListing.getUnavailableExamSlots()
        );
        existingListing.setStatus(updatedListing.getStatus());

        return listingRepository.save(existingListing);
    }

    public void deleteListing(ObjectId listingId) {

        if (!listingRepository.existsById(listingId)) {
            throw new IllegalArgumentException("Listing not found");
        }

        listingRepository.deleteById(listingId);
    }
}