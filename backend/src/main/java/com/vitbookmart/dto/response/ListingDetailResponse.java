package com.vitbookmart.dto.response;


import com.vitbookmart.entity.enums.ExamSlot;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingStatus;
import com.vitbookmart.entity.enums.ListingType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.time.LocalDateTime;
import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListingDetailResponse {

    @JsonSerialize(using = ToStringSerializer.class)
    private ObjectId id;

    private String title;

    private String description;

    private String subject;

    private ListingCategory category;

    private ListingType type;

    private Double price;

    private String imageUrl;

    private List<ExamSlot> unavailableExamSlots;

    private ListingStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private SellerInfo seller;
}
