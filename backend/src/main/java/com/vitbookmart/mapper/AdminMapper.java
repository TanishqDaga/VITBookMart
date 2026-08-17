package com.vitbookmart.mapper;

import com.vitbookmart.dto.response.AdminResponse;
import com.vitbookmart.entity.Admin;
import org.springframework.stereotype.Component;

@Component
public class AdminMapper {

    public AdminResponse toResponse(Admin admin) {

        return new AdminResponse(
                admin.getId(),
                admin.getName(),
                admin.getEmail()
        );
    }
}