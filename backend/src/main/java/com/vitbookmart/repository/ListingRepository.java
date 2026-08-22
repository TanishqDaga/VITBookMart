package com.vitbookmart.repository;

import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.enums.ListingStatus;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ListingRepository extends MongoRepository<Listing, ObjectId>,ListingRepositoryCustom {

    List<Listing> findBySellerId(ObjectId sellerId);

    List<Listing> findByStatus(ListingStatus status);

    Page<Listing> findByStatusOrderByCreatedAtDesc(ListingStatus status, Pageable pageable);

}