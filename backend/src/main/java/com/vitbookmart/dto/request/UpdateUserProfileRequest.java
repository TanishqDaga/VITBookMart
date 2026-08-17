package com.vitbookmart.dto.request;

import com.vitbookmart.entity.Hostel;
import jakarta.validation.constraints.NotBlank;

public record UpdateUserProfileRequest(

        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "WhatsApp number is required")
        String whatsappNumber,

        Hostel hostel
) {
}