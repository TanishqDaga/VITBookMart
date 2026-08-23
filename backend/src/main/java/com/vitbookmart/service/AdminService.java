package com.vitbookmart.service;

import com.vitbookmart.dto.request.CreateAdminRequest;
import com.vitbookmart.dto.request.UpdateAdminListingRequest;
import com.vitbookmart.dto.request.UpdateAdminRequest;
import com.vitbookmart.dto.response.AdminResponse;
import com.vitbookmart.dto.response.ListingDetailResponse;
import com.vitbookmart.dto.response.SellerInfo;
import com.vitbookmart.dto.response.UserResponse;
import com.vitbookmart.entity.Admin;
import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.User;
import com.vitbookmart.entity.enums.*;
import com.vitbookmart.exception.ResourceNotFoundException;
import com.vitbookmart.mapper.ListingMapper;
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
    private final WishlistRepository wishlistRepository;
    private final PasswordEncoder passwordEncoder;
    private final ListingMapper listingMapper;
    private final ListingCacheService listingCacheService;


    
    // ADMIN MANAGEMENT
    

    public AdminResponse createAdmin(CreateAdminRequest request) {

        if (adminRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Admin already exists");
        }

        Admin admin = new Admin();

        admin.setUsername(request.username());
        admin.setPassword(passwordEncoder.encode(request.password()));
        admin.setRole(AdminRole.ADMIN);
        admin.setActive(true);

        Admin savedAdmin = adminRepository.save(admin);

        return toAdminResponse(savedAdmin);
    }


    public AdminResponse getById(ObjectId adminId) {

        Admin admin = getAdminEntity(adminId);

        return toAdminResponse(admin);
    }


    public AdminResponse getByUsername(String username) {

        Admin admin = adminRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        return toAdminResponse(admin);
    }


    public List<AdminResponse> getAll() {

        return adminRepository.findAll()
                .stream()
                .map(this::toAdminResponse)
                .toList();
    }


    public AdminResponse updateProfile(ObjectId adminId, UpdateAdminRequest request) {

        Admin admin = getAdminEntity(adminId);

        String username = request.username();

        if (username != null && !username.isBlank() && !username.equals(admin.getUsername())) {

            if (adminRepository.findByUsername(username).isPresent()) {
                throw new IllegalArgumentException("Username already belongs to another admin");
            }

            admin.setUsername(username);
        }

        Admin savedAdmin = adminRepository.save(admin);

        return toAdminResponse(savedAdmin);
    }


    public void deleteAdmin(ObjectId adminId) {

        if (!adminRepository.existsById(adminId)) {
            throw new ResourceNotFoundException("Admin not found");
        }

        adminRepository.deleteById(adminId);
    }


    
    // USER MANAGEMENT
    

    public UserResponse getUser(ObjectId userId) {

        User user = getUserEntity(userId);

        return toUserResponse(user);
    }


    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::toUserResponse)
                .toList();
    }


    public UserResponse terminateUser(ObjectId userId) {

        User user = getUserEntity(userId);

        user.setStatus(UserStatus.TERMINATED);

        User savedUser = userRepository.save(user);

        return toUserResponse(savedUser);
    }


    public UserResponse makeUserPaid(ObjectId userId) {

        User user = getUserEntity(userId);

        user.setStatus(UserStatus.PAID);

        User savedUser = userRepository.save(user);

        return toUserResponse(savedUser);
    }


    public UserResponse makeUserFree(ObjectId userId) {

        User user = getUserEntity(userId);

        user.setStatus(UserStatus.FREE);

        User savedUser = userRepository.save(user);

        return toUserResponse(savedUser);
    }


    public void deleteUser(ObjectId userId) {

        // Check user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }

        // Find all listings created by this user
        List<Listing> userListings = listingRepository.findBySellerId(userId);

        // Remove listings from all wishlists
        for (Listing listing : userListings) {

            wishlistService.removeListingFromAllWishlists(listing.getId());

            // Invalidate Redis cache for each listing
            listingCacheService.invalidateListingCaches(listing.getId().toHexString());
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
    

    public ListingDetailResponse getListing(ObjectId listingId) {

        Listing listing = getListingEntity(listingId);

        return toListingDetailResponse(listing);
    }


    public List<ListingDetailResponse> getAllListings() {

        return listingRepository.findAll()
                .stream()
                .map(this::toListingDetailResponse)
                .toList();
    }


    public List<ListingDetailResponse> getAvailableListings() {

        return listingRepository
                .findByStatus(ListingStatus.AVAILABLE)
                .stream()
                .map(this::toListingDetailResponse)
                .toList();
    }


    public List<ListingDetailResponse> getSoldListings() {

        return listingRepository
                .findByStatus(ListingStatus.SOLD)
                .stream()
                .map(this::toListingDetailResponse)
                .toList();
    }


    public ListingDetailResponse updateListing(ObjectId listingId, UpdateAdminListingRequest request) {

        Listing existingListing = getListingEntity(listingId);

        // Update basic listing fields
        existingListing.setTitle(request.title());
        existingListing.setDescription(request.description());
        existingListing.setSubject(request.subject());

        // Convert String -> ListingCategory
        existingListing.setCategory(ListingCategory.valueOf(request.category().toUpperCase()));

        existingListing.setType(request.type());
        existingListing.setPrice(request.price());

        // Convert String -> ExamSlot
        if (request.unavailableExamSlots() != null) {

            List<ExamSlot> examSlots = request.unavailableExamSlots()
                    .stream()
                    .map(slot -> ExamSlot.valueOf(slot.toUpperCase()))
                    .toList();

            existingListing.setUnavailableExamSlots(examSlots);

        }
        else {

            existingListing.setUnavailableExamSlots(List.of());
        }

        // Update status
        existingListing.setStatus(request.status());

        // Save
        Listing savedListing = listingRepository.save(existingListing);

        // Invalidate listing-related caches
        listingCacheService.invalidateListingCaches(listingId.toHexString());

        // Return existing ListingDetailResponse
        return toListingDetailResponse(savedListing);
    }

    public void deleteListing(ObjectId listingId) {


        Listing listing = getListingEntity(listingId);

        listingRepository.deleteById(listing.getId());

        wishlistService.removeListingFromAllWishlists(listingId);

        listingCacheService.invalidateListingCaches(listingId.toHexString());
    }

    // ENTITY HELPERS

    private Admin getAdminEntity(ObjectId adminId) {

        return adminRepository.findById(adminId).orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
    }


    private User getUserEntity(ObjectId userId) {

        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }


    private Listing getListingEntity(ObjectId listingId) {

        return listingRepository.findById(listingId).orElseThrow(() -> new ResourceNotFoundException("Listing not found"));
    }


    
    // RESPONSE MAPPERS
    

    private AdminResponse toAdminResponse(Admin admin) {


        return new AdminResponse(
                admin.getId(),
                admin.getUsername(),
                admin.getRole(),
                admin.isActive()
        );
    }


    private UserResponse toUserResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getWhatsappNumber(),
                user.getHostel(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }


    private ListingDetailResponse toListingDetailResponse(Listing listing) {

        SellerInfo sellerInfo = null;

        if (listing.getSellerId() != null) {

            User seller = userRepository.findById(listing.getSellerId()).orElse(null);

            if (seller != null) {

                sellerInfo = new SellerInfo(seller.getName(), seller.getHostel());
            }
        }

        return listingMapper.toDetailResponse(listing, sellerInfo);
    }
}