package com.vitbookmart.repository;

import com.vitbookmart.entity.Admin;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AdminRepository extends MongoRepository<Admin, ObjectId> {

    Optional<Admin> findByUsername(String username);

    boolean existsByUsername(String username);
}