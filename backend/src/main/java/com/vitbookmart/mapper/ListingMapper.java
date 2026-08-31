package com.vitbookmart.mapper;

import com.vitbookmart.dto.request.CreateListingRequest;
import com.vitbookmart.dto.request.UpdateListingRequest;
import com.vitbookmart.dto.response.ListingDetailResponse;
import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.dto.response.SellerInfo;
import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingType;
import com.vitbookmart.service.ImageService;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class ListingMapper {

    private final ImageService imageService;

    public ListingMapper(ImageService imageService) {
        this.imageService = imageService;
    }

    public Listing toEntity(CreateListingRequest request, ObjectId sellerId) {

        Listing listing = new Listing();

        listing.setSellerId(sellerId);
        listing.setTitle(request.title());
        listing.setDescription(request.description());
        listing.setCategory(request.category());
        if (request.category() == ListingCategory.CALCULATOR) {
            listing.setSubject(null);
        } else {
            listing.setSubject(request.subject());
        }
        listing.setType(request.type());
        listing.setPrice(request.price());

        if (request.type() == ListingType.RENT) {

            listing.setUnavailableExamSlots(
                    request.unavailableExamSlots() != null
                            ? new ArrayList<>(request.unavailableExamSlots())
                            : new ArrayList<>()
            );

        } else {

            listing.setUnavailableExamSlots(new ArrayList<>());
        }

        return listing;
    }

    public void updateEntity(Listing listing, UpdateListingRequest request) {

        if (request.title() != null) {
            listing.setTitle(request.title());
        }

        if (request.description() != null) {
            listing.setDescription(request.description());
        }

        if (request.category() != null) {
            listing.setCategory(request.category());

            if (request.category() == ListingCategory.CALCULATOR) {
                listing.setSubject(null);
            }
        }

        if (request.subject() != null
                && listing.getCategory() != ListingCategory.CALCULATOR) {

            listing.setSubject(request.subject());
        }

        if (request.type() != null) {
            listing.setType(request.type());
        }

        if (request.price() != null) {
            listing.setPrice(request.price());
        }

        /*
         * Exam slots are applicable only to RENT listings.
         */
        if (listing.getType() == ListingType.RENT) {

            if (request.unavailableExamSlots() != null) {
                listing.setUnavailableExamSlots(
                        new ArrayList<>(request.unavailableExamSlots())
                );
            }

        } else {

            listing.setUnavailableExamSlots(new ArrayList<>());
        }
    }

    //Lightweight Response
    public ListingResponse toResponse(Listing listing) {

        return new ListingResponse(
                listing.getId(),
                listing.getTitle(),
                listing.getSubject(),
                listing.getPrice(),
                listing.getType(),
                imageService.getThumbnailUrl(listing.getImageUrl()),
                listing.getStatus(),
                listing.getCreatedAt(),
                listing.getUpdatedAt()
        );
    }

    //Detailed Response
    public ListingDetailResponse toDetailResponse(Listing listing, SellerInfo sellerInfo) {

        ListingDetailResponse response = new ListingDetailResponse();

        response.setId(listing.getId());
        response.setTitle(listing.getTitle());
        response.setDescription(listing.getDescription());
        response.setSubject(listing.getSubject());
        response.setCategory(listing.getCategory());
        response.setType(listing.getType());
        response.setPrice(listing.getPrice());
        response.setImageUrl(listing.getImageUrl());
        response.setStatus(listing.getStatus());
        response.setCreatedAt(listing.getCreatedAt());
        response.setUpdatedAt(listing.getUpdatedAt());
        response.setSeller(sellerInfo);


         //Only RENT listings expose unavailable exam slots.

        if (listing.getType() == ListingType.RENT) {

            response.setUnavailableExamSlots(listing.getUnavailableExamSlots());
        }

        return response;
    }
}