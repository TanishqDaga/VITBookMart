package com.vitbookmart.service;

import com.vitbookmart.dto.request.CreateAdminRequest;
import com.vitbookmart.entity.Admin;
import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.User;
import com.vitbookmart.entity.enums.AdminRole;
import com.vitbookmart.entity.enums.ListingStatus;
import com.vitbookmart.entity.enums.UserStatus;
import com.vitbookmart.exception.ResourceNotFoundException;
import com.vitbookmart.repository.AdminRepository;
import com.vitbookmart.repository.ListingRepository;
import com.vitbookmart.repository.UserRepository;
import com.vitbookmart.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final WishlistService wishlistService;
    private final PasswordEncoder passwordEncoder;
    private final WishlistRepository wishlistRepository;


    
    // ADMIN MANAGEMENT

    public Admin createAdmin(CreateAdminRequest request) {

        if (adminRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Admin already exists");
        }

        Admin admin = new Admin();

        admin.setUsername(request.username());

        admin.setPassword(passwordEncoder.encode(request.password()));
        admin.setRole(AdminRole.ADMIN);
        admin.setActive(true);

        return adminRepository.save(admin);
    }


    public Admin getById(ObjectId adminId) {

        return adminRepository.findById(adminId).orElseThrow(() -> new IllegalArgumentException("Admin not found"));
    }


    public Admin getByUsername(String username) {

        return adminRepository.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("Admin not found"));
    }


    public List<Admin> getAll() {

        return adminRepository.findAll();
    }


    public Admin updateProfile(ObjectId adminId, String username) {

        Admin admin = getById(adminId);

        if (username != null && !username.isBlank() && !username.equals(admin.getUsername())) {

            if (adminRepository.findByUsername(username).isPresent()) {
                throw new IllegalArgumentException("Username already belongs to another admin");
            }

            admin.setUsername(username);
        }

        return adminRepository.save(admin);
    }


    public void deleteAdmin(ObjectId adminId) {

        if (!adminRepository.existsById(adminId)) {throw new IllegalArgumentException("Admin not found");}

        adminRepository.deleteById(adminId);
    }


    
    // USER MANAGEMENT
    

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

        // Check user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }

        // Find all listings created by this user
        List<Listing> userListings = listingRepository.findBySellerId(userId);

        // Remove those listings from all wishlists
        for (Listing listing : userListings) {

            wishlistService.removeListingFromAllWishlists(listing.getId());
        }

        // Delete all listings created by the user
        if (!userListings.isEmpty()) {
            listingRepository.deleteAll(userListings);
        }

        // Delete the user's wishlist
        wishlistRepository.deleteByUserId(userId);

        // Finally delete the user
        userRepository.deleteById(userId);
    }


    
    // LISTING MANAGEMENT
    

    public Listing getListing(ObjectId listingId) {

        return listingRepository.findById(listingId).orElseThrow(() -> new IllegalArgumentException("Listing not found"));
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


    public Listing updateListing(ObjectId listingId, Listing updatedListing) {

        Listing existingListing = getListing(listingId);

        existingListing.setTitle(updatedListing.getTitle());
        existingListing.setDescription(updatedListing.getDescription());
        existingListing.setSubject(updatedListing.getSubject());
        existingListing.setCategory(updatedListing.getCategory());
        existingListing.setType(updatedListing.getType());
        existingListing.setPrice(updatedListing.getPrice());
        existingListing.setUnavailableExamSlots(updatedListing.getUnavailableExamSlots());
        existingListing.setStatus(updatedListing.getStatus());

        return listingRepository.save(existingListing);
    }


    public void deleteListing(ObjectId listingId) {

        listingRepository.deleteById(listingId);

        // Remove the deleted listing from every user's wishlist
        wishlistService.removeListingFromAllWishlists(listingId);
    }
}