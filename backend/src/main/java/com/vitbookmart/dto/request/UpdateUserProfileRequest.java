package com.vitbookmart.dto.request;

import com.vitbookmart.entity.Hostel;
import jakarta.validation.constraints.Pattern;

public record UpdateUserProfileRequest(

        String name,

        @Pattern(regexp = "^[6-9][0-9]{9}$", message = "WhatsApp number must be a valid 10 digit Indian mobile number")
        String whatsappNumber,

        Hostel hostel
) {
}