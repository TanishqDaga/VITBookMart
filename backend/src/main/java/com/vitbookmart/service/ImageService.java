package com.vitbookmart.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class ImageService {

    private final Cloudinary cloudinary;

    public ImageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadImage(MultipartFile file) throws IOException {

        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "vitbookmart/listings"
                )
        );

        return result.get("secure_url").toString();
    }

    public String getThumbnailUrl(String imageUrl) {

        if (imageUrl == null || imageUrl.isBlank()) {
            return imageUrl;
        }

        return imageUrl.replace(
                "/upload/",
                "/upload/w_200,h_400,c_limit,q_auto,f_auto/"
        );
    }
}