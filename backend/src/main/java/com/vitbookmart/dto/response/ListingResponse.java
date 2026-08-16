package com.vitbookmart.dto.response;

import com.vitbookmart.entity.enums.ExamSlot;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingStatus;
import com.vitbookmart.entity.enums.ListingType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListingResponse {

    private String id;

    private String title;

    private String description;

    private String subject;

    private ListingCategory category;

    private ListingType type;

    private Double price;

    private String image;

    private List<ExamSlot> unavailableExamSlots;

    private ListingStatus status;

    private SellerInfo seller;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}