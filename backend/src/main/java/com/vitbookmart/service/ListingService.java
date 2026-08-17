package com.vitbookmart.service;

import com.vitbookmart.dto.request.CreateListingRequest;
import com.vitbookmart.dto.request.UpdateListingRequest;
import com.vitbookmart.dto.response.ListingDetailResponse;
import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.dto.response.SellerInfo;
import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.User;
import com.vitbookmart.entity.enums.ListingStatus;
import com.vitbookmart.entity.enums.ListingType;
import com.vitbookmart.mapper.ListingMapper;
import com.vitbookmart.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final UserService userService;
    private final ListingMapper listingMapper;

    public ListingResponse createListing(
            ObjectId sellerId,
            CreateListingRequest request
    ) {

        userService.validateProfileComplete(sellerId);

        Listing listing = listingMapper.toEntity(request, sellerId);

        validateListing(listing);

        listing.setStatus(ListingStatus.AVAILABLE);

        return toListingResponse(listingRepository.save(listing));
    }

    public ListingDetailResponse getById(ObjectId listingId) {

        Listing listing = getEntityById(listingId);

        User seller = userService.getEntityById(listing.getSellerId());

        SellerInfo sellerInfo = new SellerInfo(
                seller.getName(),
                seller.getHostel()
        );

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

    public List<ListingResponse> searchByTitle(String title) {

        return listingRepository.findByTitleContainingIgnoreCase(title)
                .stream()
                .map(this::toListingResponse)
                .toList();
    }

    public List<ListingResponse> searchBySubject(String subject) {

        return listingRepository.findBySubjectContainingIgnoreCase(subject)
                .stream()
                .map(this::toListingResponse)
                .toList();
    }

    public ListingResponse updateListing(
            ObjectId listingId,
            ObjectId sellerId,
            UpdateListingRequest request
    ) {

        Listing listing = getEntityById(listingId);

        validateOwnership(listing, sellerId);

        listingMapper.updateEntity(listing, request);

        validateListing(listing);

        return toListingResponse(listingRepository.save(listing));
    }

    public ListingResponse markAsSold(
            ObjectId listingId,
            ObjectId sellerId
    ) {

        Listing listing = getEntityById(listingId);

        validateOwnership(listing, sellerId);

        listing.setStatus(ListingStatus.SOLD);

        return toListingResponse(listingRepository.save(listing));
    }

    public void deleteListing(
            ObjectId listingId,
            ObjectId sellerId
    ) {

        Listing listing = getEntityById(listingId);

        validateOwnership(listing, sellerId);

        listingRepository.deleteById(listingId);
    }

    public Listing getEntityById(ObjectId listingId) {

        return listingRepository.findById(listingId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Listing not found"));
    }

    private ListingResponse toListingResponse(Listing listing) {
        return listingMapper.toResponse(listing);
    }

    private void validateListing(Listing listing) {

        if (listing.getTitle() == null || listing.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }

        if (listing.getDescription() == null
                || listing.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }

        if (listing.getSubject() == null
                || listing.getSubject().isBlank()) {
            throw new IllegalArgumentException("Subject is required");
        }

        if (listing.getCategory() == null) {
            throw new IllegalArgumentException("Category is required");
        }

        if (listing.getType() == null) {
            throw new IllegalArgumentException("Listing type is required");
        }

        if (listing.getPrice() == null || listing.getPrice() < 0) {
            throw new IllegalArgumentException(
                    "Price must be zero or greater"
            );
        }

        validateExamSlots(listing);
    }

    private void validateExamSlots(Listing listing) {

        if (listing.getType() == ListingType.SALE) {
            listing.setUnavailableExamSlots(List.of());
        }
    }

    private void validateOwnership(
            Listing listing,
            ObjectId sellerId
    ) {

        if (listing.getSellerId() == null
                || !listing.getSellerId().equals(sellerId)) {

            throw new IllegalArgumentException(
                    "You are not the owner of this listing"
            );
        }
    }
}