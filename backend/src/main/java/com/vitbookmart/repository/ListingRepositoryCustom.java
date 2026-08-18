package com.vitbookmart.repository;

import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingType;

import java.util.List;

public interface ListingRepositoryCustom {

    List<Listing> search(String query, ListingType type, ListingCategory category, String sort);
}