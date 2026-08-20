package com.vitbookmart.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminAuthResponse {

    private String accessToken;

    private String refreshToken;
}