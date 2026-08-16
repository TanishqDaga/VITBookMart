package com.vitbookmart.dto.response;

import com.vitbookmart.entity.Hostel;
import com.vitbookmart.entity.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private ObjectId id;

    private String name;

    private String email;

    private String whatsappNumber;

    private Hostel hostel;

    private UserStatus status;
}