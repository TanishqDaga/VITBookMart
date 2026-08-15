package com.vitbookmart.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Hostel {

    private String type;   // MH or LH

    private String block;

    private String room;
}