package com.vitbookmart.service;

import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.Wishlist;
import com.vitbookmart.repository.ListingRepository;
import com.vitbookmart.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ListingRepository listingRepository;

    public Wishlist getWishlist(ObjectId userId) {

        return wishlistRepository.findByUserId(userId)
                .orElseGet(() -> createWishlist(userId));
    }

    public Wishlist addToWishlist(ObjectId userId, ObjectId listingId) {

        // Make sure listing exists
        if (!listingRepository.existsById(listingId)) {
            throw new IllegalArgumentException("Listing not found");
        }

        Wishlist wishlist = getWishlist(userId);

        if (wishlist.getListingIds().contains(listingId)) {
            return wishlist;
        }

        wishlist.getListingIds().add(listingId);

        return wishlistRepository.save(wishlist);
    }

    public Wishlist removeFromWishlist(
            ObjectId userId,
            ObjectId listingId
    ) {

        Wishlist wishlist = getWishlist(userId);

        wishlist.getListingIds().remove(listingId);

        return wishlistRepository.save(wishlist);
    }

    public boolean isWishlisted(
            ObjectId userId,
            ObjectId listingId
    ) {

        return getWishlist(userId)
                .getListingIds()
                .contains(listingId);
    }

    public void clearWishlist(ObjectId userId) {

        Wishlist wishlist = getWishlist(userId);

        wishlist.setListingIds(new ArrayList<>());

        wishlistRepository.save(wishlist);
    }

    private Wishlist createWishlist(ObjectId userId) {

        Wishlist wishlist = new Wishlist();

        wishlist.setUserId(userId);
        wishlist.setListingIds(new ArrayList<>());

        return wishlistRepository.save(wishlist);
    }
}