package com.vitbookmart.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WishlistResponse {

    private ObjectId id;

    private ObjectId userId;

    private List<ListingResponse> listings;
}