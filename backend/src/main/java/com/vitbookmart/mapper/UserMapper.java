package com.vitbookmart.mapper;

import com.vitbookmart.dto.response.UserResponse;
import com.vitbookmart.dto.request.UpdateUserProfileRequest;
import com.vitbookmart.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getWhatsappNumber(),
                user.getHostel(),
                user.getStatus()
        );
    }

    public void updateEntity(
            User user,
            UpdateUserProfileRequest request
    ) {
        user.setName(request.name());
        user.setWhatsappNumber(request.whatsappNumber());
        user.setHostel(request.hostel());
    }
}