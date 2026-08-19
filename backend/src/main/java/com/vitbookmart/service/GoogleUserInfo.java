package com.vitbookmart.service;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GoogleUserInfo {

    private String googleId;

    private String email;

    private String name;
}