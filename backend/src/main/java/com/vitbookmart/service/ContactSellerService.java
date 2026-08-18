package com.vitbookmart.service;

import com.vitbookmart.dto.response.ContactSellerResponse;
import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.User;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ContactSellerService {

    private final ListingService listingService;
    private final UserService userService;

    public ContactSellerResponse getContactUrl(ObjectId listingId) {

        // Make sure listing exists
        Listing listing = listingService.getEntityById(listingId);

        // Get seller
        User seller = userService.getEntityById(listing.getSellerId());

        // Get WhatsApp number
        String whatsappNumber = seller.getWhatsappNumber();

        if (whatsappNumber == null || whatsappNumber.isBlank()) {
            throw new IllegalStateException("Seller has not provided a WhatsApp number");
        }

        String whatsappUrl = "https://wa.me/91" + whatsappNumber;

        return new ContactSellerResponse(whatsappUrl);
    }
}