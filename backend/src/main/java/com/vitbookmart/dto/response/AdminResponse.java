package com.vitbookmart.dto.response;

import com.vitbookmart.entity.enums.AdminRole;
import org.bson.types.ObjectId;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

public record AdminResponse(

        @JsonSerialize(using = ToStringSerializer.class)
        ObjectId id,
        String username,
        AdminRole role,
        boolean active
) {
}