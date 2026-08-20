package com.vitbookmart.service;

import com.vitbookmart.dto.request.CreateListingRequest;
import com.vitbookmart.dto.request.UpdateListingRequest;
import com.vitbookmart.dto.response.ListingDetailResponse;
import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.dto.response.SellerInfo;
import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.User;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingStatus;
import com.vitbookmart.entity.enums.ListingType;
import com.vitbookmart.exception.BadRequestException;
import com.vitbookmart.exception.ResourceNotFoundException;
import com.vitbookmart.mapper.ListingMapper;
import com.vitbookmart.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ListingService {

    private final ListingRepository listingRepository;
    private final UserService userService;
    private final ListingMapper listingMapper;
    private final ImageService imageService;
    private final WishlistService wishlistService;

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    private void validateImage(MultipartFile image) {

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Image is required");
        }

        if (image.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException(
                    "Image size must be less than 5 MB"
            );
        }

        String contentType = image.getContentType();

        if (contentType == null ||
                !(contentType.equals("image/jpeg") || contentType.equals("image/png") || contentType.equals("image/webp"))) {

            throw new IllegalArgumentException(
                    "Only JPG, PNG and WEBP images are allowed"
            );
        }
    }

    public ListingResponse createListing(ObjectId sellerId, CreateListingRequest request,MultipartFile image) throws IOException {
        log.info("validate user");
        userService.validateProfileComplete(sellerId);
        log.info("user validate");
        Listing listing = listingMapper.toEntity(request, sellerId);

        validateListing(listing);
        log.info("listing validated");
        validateImage(image);
        log.info("image validated");

        String imageUrl = imageService.uploadImage(image);

        listing.setImageUrl(imageUrl);

        listing.setStatus(ListingStatus.AVAILABLE);

        return toListingResponse(listingRepository.save(listing));
    }

    public ListingDetailResponse getById(ObjectId listingId) {

        Listing listing = getEntityById(listingId);

        User seller = userService.getEntityById(listing.getSellerId());

        SellerInfo sellerInfo = new SellerInfo(seller.getName(), seller.getHostel());

        return listingMapper.toDetailResponse(listing, sellerInfo);
    }

    public List<ListingResponse> getAll() {

        return listingRepository.findAll()
                .stream()
                .map(this::toListingResponse)
                .toList();
    }

    public List<ListingResponse> getAllAvailableListings() {

        return listingRepository.findByStatus(ListingStatus.AVAILABLE)
                .stream()
                .map(this::toListingResponse)
                .toList();
    }

    public List<ListingResponse> getBySeller(ObjectId sellerId) {

        return listingRepository.findBySellerId(sellerId)
                .stream()
                .map(this::toListingResponse)
                .toList();
    }

    public ListingResponse updateListing(ObjectId listingId, ObjectId sellerId, UpdateListingRequest request) {

        Listing listing = getEntityById(listingId);

        validateOwnership(listing, sellerId);

        listingMapper.updateEntity(listing, request);

        validateListing(listing);

        return toListingResponse(listingRepository.save(listing));
    }

    public ListingResponse markAsSold(ObjectId listingId, ObjectId sellerId) {

        Listing listing = getEntityById(listingId);

        validateOwnership(listing, sellerId);

        listing.setStatus(ListingStatus.SOLD);

        return toListingResponse(listingRepository.save(listing));
    }

    public void deleteListing(ObjectId listingId, ObjectId sellerId) {

        Listing listing = getEntityById(listingId);

        validateOwnership(listing, sellerId);

        listingRepository.deleteById(listingId);

        wishlistService.removeListingFromAllWishlists(listingId);
    }

    public Listing getEntityById(ObjectId listingId) {

        return listingRepository.findById(listingId).orElseThrow(() -> new ResourceNotFoundException("Listing not found"));
    }

    private ListingResponse toListingResponse(Listing listing) {

        return listingMapper.toResponse(listing);
    }

    private void validateListing(Listing listing) {

        if (listing.getTitle() == null || listing.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }

        if (listing.getDescription() == null || listing.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }

        if (listing.getSubject() == null || listing.getSubject().isBlank()) {
            throw new IllegalArgumentException("Subject is required");
        }

        if (listing.getCategory() == null) {
            throw new IllegalArgumentException("Category is required");
        }

        if (listing.getType() == null) {
            throw new IllegalArgumentException("Listing type is required");
        }

        if (listing.getPrice() == null || listing.getPrice() < 0) {
            throw new IllegalArgumentException("Price must be zero or greater");
        }

        validateExamSlots(listing);
    }

    private void validateExamSlots(Listing listing) {

        if (listing.getType() == ListingType.SALE) {
            listing.setUnavailableExamSlots(List.of());
        }
    }

    private void validateOwnership(Listing listing, ObjectId sellerId) {

        if (listing.getSellerId() == null || !listing.getSellerId().equals(sellerId)) {

            throw new BadRequestException("You are not the owner of this listing");
        }
    }
    public List<ListingResponse> getLatestListings() {

        return listingRepository
                .findByStatusOrderByCreatedAtDesc(ListingStatus.AVAILABLE)
                .stream()
                .map(this::toListingResponse)
                .toList();
    }

    public List<ListingResponse> searchListings(String query, ListingType type, ListingCategory category, String sort) {

        return listingRepository
                .search(query, type, category, sort)
                .stream()
                .map(this::toListingResponse)
                .toList();
    }

}