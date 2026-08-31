package com.vitbookmart.dto.request;

import com.vitbookmart.entity.enums.ExamSlot;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateListingRequest(

        @NotBlank(message = "Title is required")
        String title,

        @NotBlank(message = "Description is required")
        String description,


        String subject,

        @NotNull(message = "Category is required")
        ListingCategory category,

        @NotNull(message = "Listing type is required")
        ListingType type,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", message = "Price cannot be negative")
        Double price,

        List<ExamSlot> unavailableExamSlots
) {
}