package com.vitbookmart.service;

import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.enums.ListingStatus;
import com.vitbookmart.entity.enums.ListingType;
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

    public Listing createListing(Listing listing, ObjectId sellerId) {

        userService.validateProfileComplete(sellerId);

        validateListing(listing);

        listing.setSellerId(sellerId);

        if (listing.getStatus() == null) {
            listing.setStatus(ListingStatus.AVAILABLE);
        }

        return listingRepository.save(listing);
    }

    public Listing getById(ObjectId listingId) {

        return listingRepository.findById(listingId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Listing not found"));
    }

    public List<Listing> getAll() {
        return listingRepository.findAll();
    }

    public List<Listing> getBySeller(ObjectId sellerId) {
        return listingRepository.findBySellerId(sellerId);
    }

    public List<Listing> getAvailableListings() {
        return listingRepository.findByStatus(ListingStatus.AVAILABLE);
    }

    public List<Listing> searchByTitle(String title) {
        return listingRepository.findByTitleContainingIgnoreCase(title);
    }

    public List<Listing> searchBySubject(String subject) {
        return listingRepository.findBySubjectContainingIgnoreCase(subject);
    }

    public Listing updateListing(
            ObjectId listingId,
            ObjectId sellerId,
            Listing updatedListing
    ) {

        Listing existingListing = getById(listingId);

        validateOwnership(existingListing, sellerId);
        validateListing(updatedListing);

        existingListing.setTitle(updatedListing.getTitle());
        existingListing.setDescription(updatedListing.getDescription());
        existingListing.setSubject(updatedListing.getSubject());
        existingListing.setCategory(updatedListing.getCategory());
        existingListing.setType(updatedListing.getType());
        existingListing.setPrice(updatedListing.getPrice());
        existingListing.setImage(updatedListing.getImage());
        existingListing.setStatus(updatedListing.getStatus());
        existingListing.setUnavailableExamSlots(
                updatedListing.getUnavailableExamSlots()
        );

        return listingRepository.save(existingListing);
    }

    public Listing markAsSold(
            ObjectId listingId,
            ObjectId sellerId
    ) {

        Listing listing = getById(listingId);

        validateOwnership(listing, sellerId);

        listing.setStatus(ListingStatus.SOLD);

        return listingRepository.save(listing);
    }

    public void deleteListing(
            ObjectId listingId,
            ObjectId sellerId
    ) {

        Listing listing = getById(listingId);

        validateOwnership(listing, sellerId);

        listingRepository.deleteById(listingId);
    }

    private void validateOwnership(
            Listing listing,
            ObjectId sellerId
    ) {

        if (!listing.getSellerId().equals(sellerId)) {
            throw new IllegalArgumentException(
                    "You are not the owner of this listing"
            );
        }
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

            if (listing.getUnavailableExamSlots() != null
                    && !listing.getUnavailableExamSlots().isEmpty()) {

                throw new IllegalArgumentException(
                        "Unavailable exam slots are only allowed for rental listings"
                );
            }

            return;
        }

        if (listing.getUnavailableExamSlots() == null) {
            return;
        }

        long uniqueSlots = listing.getUnavailableExamSlots()
                .stream()
                .distinct()
                .count();

        if (uniqueSlots != listing.getUnavailableExamSlots().size()) {
            throw new IllegalArgumentException(
                    "Duplicate exam slots are not allowed"
            );
        }
    }
}