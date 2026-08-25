package com.vitbookmart.repository;

import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingStatus;
import com.vitbookmart.entity.enums.ListingType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.regex.Pattern;

@Repository
@RequiredArgsConstructor
public class ListingRepositoryCustomImpl implements ListingRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<Listing> search(
            String query,
            ListingType type,
            ListingCategory category,
            String sort,
            Pageable pageable) {

        Query mongoQuery = new Query();

        // Only show available listings
        mongoQuery.addCriteria(Criteria.where("status").is(ListingStatus.AVAILABLE));

        if (query != null && !query.isBlank()) {

            String searchTerm = query.trim();

            if (searchTerm.length() > 70) {
                throw new IllegalArgumentException("Search query is too long");
            }
            String escapedQuery = Pattern.quote(searchTerm);

            Criteria searchCriteria = new Criteria().orOperator(
                    Criteria.where("title").regex(escapedQuery, "i"),

                    Criteria.where("subject").regex(escapedQuery, "i")
            );
            mongoQuery.addCriteria(searchCriteria);
        }

        // Filter by type
        if (type != null) {
            mongoQuery.addCriteria(Criteria.where("type").is(type));
        }

        // Filter by category
        if (category != null) {
            mongoQuery.addCriteria(Criteria.where("category").is(category));
        }

        // Sorting
        if ("priceAsc".equals(sort)) {

            mongoQuery.with(
                    Sort.by(Sort.Direction.ASC, "price")
            );

        } else if ("priceDesc".equals(sort)) {

            mongoQuery.with(
                    Sort.by(Sort.Direction.DESC, "price")
            );

        } else {

            // Default = latest
            mongoQuery.with(
                    Sort.by(Sort.Direction.DESC, "createdAt")
            );
        }

        // Count BEFORE pagination
        long totalElements =
                mongoTemplate.count(mongoQuery, Listing.class);

        // Apply pagination
        mongoQuery.with(pageable);

        // Fetch only requested page
        List<Listing> listings =
                mongoTemplate.find(mongoQuery, Listing.class);

        return new PageImpl<>(
                listings,
                pageable,
                totalElements
        );
    }
}