package com.vitbookmart.repository;

import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ListingRepositoryCustom {

    Page<Listing> search(
            String query,
            ListingType type,
            ListingCategory category,
            String sort,
            Pageable pageable
    );
}