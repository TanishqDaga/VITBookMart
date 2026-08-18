package com.vitbookmart.mapper;

import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.dto.response.WishlistResponse;
import com.vitbookmart.entity.Wishlist;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WishlistMapper {

    public WishlistResponse toResponse(
            Wishlist wishlist,
            List<ListingResponse> listings
    ) {

        return new WishlistResponse(
                listings
        );
    }
}