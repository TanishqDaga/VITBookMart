package com.vitbookmart.service;

import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.dto.response.WishlistResponse;
import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.Wishlist;
import com.vitbookmart.mapper.ListingMapper;
import com.vitbookmart.mapper.WishlistMapper;
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
    private final ListingMapper listingMapper;
    private final WishlistMapper wishlistMapper;

    public WishlistResponse getWishlist(ObjectId userId) {

        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseGet(() -> createWishlist(userId));

        return toResponse(wishlist);
    }

    public WishlistResponse addToWishlist(
            ObjectId userId,
            ObjectId listingId
    ) {

        if (!listingRepository.existsById(listingId)) {
            throw new IllegalArgumentException("Listing not found");
        }

        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseGet(() -> createWishlist(userId));

        if (!wishlist.getListingIds().contains(listingId)) {
            wishlist.getListingIds().add(listingId);
            wishlist = wishlistRepository.save(wishlist);
        }

        return toResponse(wishlist);
    }

    public WishlistResponse removeFromWishlist(
            ObjectId userId,
            ObjectId listingId
    ) {

        Wishlist wishlist = getEntityByUserId(userId);

        wishlist.getListingIds().remove(listingId);

        wishlist = wishlistRepository.save(wishlist);

        return toResponse(wishlist);
    }

    public boolean isWishlisted(
            ObjectId userId,
            ObjectId listingId
    ) {

        Wishlist wishlist = wishlistRepository
                .findByUserId(userId)
                .orElse(null);

        return wishlist != null
                && wishlist.getListingIds().contains(listingId);
    }

    public WishlistResponse clearWishlist(ObjectId userId) {

        Wishlist wishlist = getEntityByUserId(userId);

        wishlist.setListingIds(new ArrayList<>());

        wishlist = wishlistRepository.save(wishlist);

        return toResponse(wishlist);
    }

    private Wishlist getEntityByUserId(ObjectId userId) {

        return wishlistRepository.findByUserId(userId)
                .orElseGet(() -> createWishlist(userId));
    }

    private Wishlist createWishlist(ObjectId userId) {

        Wishlist wishlist = new Wishlist();

        wishlist.setUserId(userId);
        wishlist.setListingIds(new ArrayList<>());

        return wishlistRepository.save(wishlist);
    }

    private WishlistResponse toResponse(Wishlist wishlist) {

        List<Listing> listings = listingRepository.findAllById(
                wishlist.getListingIds()
        );

        List<ListingResponse> listingResponses = listings.stream()
                .map(listingMapper::toResponse)
                .toList();

        return wishlistMapper.toResponse(
                wishlist,
                listingResponses
        );
    }
}