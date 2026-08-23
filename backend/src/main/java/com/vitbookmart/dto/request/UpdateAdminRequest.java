package com.vitbookmart.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateAdminRequest(

        @Size(
                min = 3,
                max = 50,
                message = "Username must be between 3 and 50 characters"
        )
        String username
) {
}