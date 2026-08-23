package com.vitbookmart.dto.request;

import com.vitbookmart.entity.enums.ListingStatus;
import com.vitbookmart.entity.enums.ListingType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record UpdateAdminListingRequest(

        @NotBlank(message = "Title is required")
        String title,

        @NotBlank(message = "Description is required")
        String description,

        @NotBlank(message = "Subject is required")
        String subject,

        @NotBlank(message = "Category is required")
        String category,

        @NotNull(message = "Listing type is required")
        ListingType type,

        @NotNull(message = "Price is required")
        @Positive(message = "Price must be greater than zero")
        Double price,

        List<String> unavailableExamSlots,

        @NotNull(message = "Listing status is required")
        ListingStatus status
) {
}