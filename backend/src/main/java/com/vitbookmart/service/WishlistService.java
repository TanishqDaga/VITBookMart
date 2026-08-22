package com.vitbookmart.service;

import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.dto.response.WishlistResponse;
import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.Wishlist;
import com.vitbookmart.exception.ResourceNotFoundException;
import com.vitbookmart.mapper.ListingMapper;
import com.vitbookmart.mapper.WishlistMapper;
import com.vitbookmart.repository.ListingRepository;
import com.vitbookmart.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ListingRepository listingRepository;
    private final ListingMapper listingMapper;
    private final WishlistMapper wishlistMapper;
    private final MongoTemplate mongoTemplate;

    public WishlistResponse getWishlist(ObjectId userId) {

        Wishlist wishlist = wishlistRepository.findByUserId(userId).orElseGet(() -> createWishlist(userId));

        return toResponse(wishlist);
    }

    public void addToWishlist(ObjectId userId, ObjectId listingId) {

        if (!listingRepository.existsById(listingId)) {
            throw new ResourceNotFoundException("Listing not found");
        }

        Wishlist wishlist = wishlistRepository.findByUserId(userId).orElseGet(() -> createWishlist(userId));

        if (!wishlist.getListingIds().contains(listingId)) {
            wishlist.getListingIds().add(listingId);
            wishlistRepository.save(wishlist);
        }
    }

    public void removeFromWishlist(ObjectId userId, ObjectId listingId) {

        Wishlist wishlist = wishlistRepository.findByUserId(userId).orElseThrow(() -> new ResourceNotFoundException("Wishlist not found"));

        if (wishlist.getListingIds().remove(listingId)) {
            wishlistRepository.save(wishlist);
        }
    }

    public boolean isWishlisted(ObjectId userId, ObjectId listingId) {

        Wishlist wishlist = wishlistRepository
                .findByUserId(userId)
                .orElse(null);

        return wishlist != null && wishlist.getListingIds().contains(listingId);
    }

    public WishlistResponse clearWishlist(ObjectId userId) {

        Wishlist wishlist = getEntityByUserId(userId);

        wishlist.setListingIds(new ArrayList<>());

        wishlist = wishlistRepository.save(wishlist);

        return toResponse(wishlist);
    }

    private Wishlist getEntityByUserId(ObjectId userId) {

        return wishlistRepository.findByUserId(userId).orElseGet(() -> createWishlist(userId));
    }

    private Wishlist createWishlist(ObjectId userId) {

        Wishlist wishlist = new Wishlist();

        wishlist.setUserId(userId);
        wishlist.setListingIds(new ArrayList<>());

        return wishlistRepository.save(wishlist);
    }

    private WishlistResponse toResponse(Wishlist wishlist) {

        List<Listing> listings = listingRepository.findAllById(wishlist.getListingIds());

        List<ListingResponse> listingResponses = listings.stream()
                .map(listingMapper::toResponse)
                .toList();

        return wishlistMapper.toResponse(wishlist, listingResponses);
    }

    public void removeListingFromAllWishlists(ObjectId listingId) {

        Query query = new Query(Criteria.where("listingIds").is(listingId));

        Update update = new Update().pull("listingIds", listingId);

        mongoTemplate.updateMulti(query, update, Wishlist.class);
    }
}