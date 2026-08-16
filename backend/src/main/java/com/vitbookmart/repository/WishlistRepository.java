package com.vitbookmart.repository;

import com.vitbookmart.entity.Wishlist;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface WishlistRepository extends MongoRepository<Wishlist, ObjectId> {

    Optional<Wishlist> findByUserId(ObjectId userId);

    boolean existsByUserId(ObjectId userId);
}