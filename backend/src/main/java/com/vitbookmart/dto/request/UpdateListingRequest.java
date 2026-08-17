package com.vitbookmart.dto.request;

import com.vitbookmart.entity.enums.ExamSlot;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingType;
import jakarta.validation.constraints.DecimalMin;

import java.util.List;

public record UpdateListingRequest(

        String title,

        String description,

        String subject,

        ListingCategory category,

        ListingType type,

        @DecimalMin(value = "0.0", message = "Price cannot be negative")
        Double price,

        String image,

        List<ExamSlot> unavailableExamSlots
) {
}