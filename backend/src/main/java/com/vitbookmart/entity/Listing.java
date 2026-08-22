package com.vitbookmart.entity;

import com.vitbookmart.entity.enums.ExamSlot;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingStatus;
import com.vitbookmart.entity.enums.ListingType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(
        name = "idx_listing_status_createdAt",
        def = "{'status': 1, 'createdAt': -1}"
)
@CompoundIndex(
        name = "idx_listing_status_type_category_createdAt",
        def = "{'status': 1, 'type': 1, 'category': 1, 'createdAt': -1}"
)
@CompoundIndex(
        name = "idx_listing_status_type_category_price",
        def = "{'status': 1, 'type': 1, 'category': 1, 'price': 1}"
)
@Document(collection = "listings")
public class Listing {

    @Id
    private ObjectId id;

    // ID of the user who created this listing
    private ObjectId sellerId;

    private String title;

    private String description;

    private String subject;

    private ListingType type;

    private List<ExamSlot> unavailableExamSlots = new ArrayList<>();

    private ListingCategory category;

    private Double price;

    private String imageUrl;

    private ListingStatus status;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}