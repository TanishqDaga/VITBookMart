package com.vitbookmart.dto.response;

import com.vitbookmart.entity.Hostel;
import com.vitbookmart.entity.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    @JsonSerialize(using = ToStringSerializer.class)
    private ObjectId id;

    private String name;

    private String email;

    private String whatsappNumber;

    private Hostel hostel;

    private UserStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}