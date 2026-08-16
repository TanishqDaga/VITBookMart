package com.vitbookmart.dto.response;

import com.vitbookmart.entity.Hostel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerInfo {

    private String name;

    private Hostel hostel;

}