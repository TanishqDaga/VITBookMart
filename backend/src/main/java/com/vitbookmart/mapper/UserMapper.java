package com.vitbookmart.mapper;

import com.vitbookmart.dto.response.UserResponse;
import com.vitbookmart.dto.request.UpdateUserProfileRequest;
import com.vitbookmart.entity.Hostel;
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
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public void updateEntity(User user, UpdateUserProfileRequest request) {

        if (request.name() != null) {
            user.setName(request.name());
        }

        if (request.whatsappNumber() != null) {
            user.setWhatsappNumber(request.whatsappNumber());
        }

        if (request.hostel() != null) {

            if (user.getHostel() == null) {
                user.setHostel(new Hostel());
            }

            if (request.hostel().getType() != null) {
                user.getHostel().setType(request.hostel().getType());
            }

            if (request.hostel().getBlock() != null) {
                user.getHostel().setBlock(request.hostel().getBlock());
            }

            if (request.hostel().getRoom() != null) {
                user.getHostel().setRoom(request.hostel().getRoom());
            }
        }
    }
}