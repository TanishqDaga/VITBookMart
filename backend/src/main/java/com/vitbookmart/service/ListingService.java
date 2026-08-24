package com.vitbookmart.service;

import com.vitbookmart.dto.request.CreateListingRequest;
import com.vitbookmart.dto.request.UpdateListingRequest;
import com.vitbookmart.dto.response.ListingDetailResponse;
import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.dto.response.PaginatedResponse;
import com.vitbookmart.dto.response.SellerInfo;
import com.vitbookmart.entity.Listing;
import com.vitbookmart.entity.User;
import com.vitbookmart.entity.enums.ListingCategory;
import com.vitbookmart.entity.enums.ListingStatus;
import com.vitbookmart.entity.enums.ListingType;
import com.vitbookmart.exception.BadRequestException;
import com.vitbookmart.exception.ResourceNotFoundException;
import com.vitbookmart.mapper.ListingMapper;
import com.vitbookmart.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ListingService {

    @Value("${vitbookmart.cache.listing.ttl-hours}")
    private long listingCacheTtlHours;

    @Value("${vitbookmart.cache.latest.ttl-hours}")
    private long latestCacheTtlHours;

    @Value("${vitbookmart.cache.search.ttl-hours}")
    private long searchCacheTtlHours;

    private final ListingRepository listingRepository;
    private final UserService userService;
    private final ListingMapper listingMapper;
    private final ImageService imageService;
    private final WishlistService wishlistService;
    private final ListingCacheService listingCacheService;

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    private void validateImage(MultipartFile image) {

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Image is required");
        }

        if (image.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException(
                    "Image size must be less than 5 MB"
            );
        }

        String contentType = image.getContentType();

        if (contentType == null ||
                !(contentType.equals("image/jpeg") || contentType.equals("image/png") || contentType.equals("image/webp"))) {

            throw new IllegalArgumentException(
                    "Only JPG, PNG and WEBP images are allowed"
            );
        }
    }

    public ListingResponse createListing(ObjectId sellerId, CreateListingRequest request,MultipartFile image) throws IOException {
        log.info("validate user");
        userService.validateProfileComplete(sellerId);
        log.info("user validate");
        Listing listing = listingMapper.toEntity(request, sellerId);

        validateListing(listing);
        log.info("listing validated");
        validateImage(image);
        log.info("image validated");

        String imageUrl = imageService.uploadImage(image);

        listing.setImageUrl(imageUrl);

        listing.setStatus(ListingStatus.AVAILABLE);

        Listing savedListing = listingRepository.save(listing);

        listingCacheService.evictLatestListings();
        listingCacheService.invalidateSearchCaches();

        return toListingResponse(savedListing);
    }

    public ListingDetailResponse getById(ObjectId listingId) {

        String cacheKey = listingId.toHexString();

        // 1. Check Redis first
        ListingDetailResponse cached = listingCacheService.getListing(cacheKey);

        if (cached != null) {
            log.info("Listing cache HIT: {}", listingId);
            return cached;
        }

        log.info("Listing cache MISS: {}", listingId);

        // 2. Redis miss → MongoDB
        Listing listing = getEntityById(listingId);

        User seller = userService.getEntityById(listing.getSellerId());

        SellerInfo sellerInfo = new SellerInfo(seller.getName(), seller.getHostel());

        ListingDetailResponse response = listingMapper.toDetailResponse(listing, sellerInfo);

        // 3. Store result in Redis
        listingCacheService.cacheListing(cacheKey, response, listingCacheTtlHours);

        // 4. Return response
        return response;
    }

    public List<ListingResponse> getAllAvailableListings() {

        return listingRepository.findByStatus(ListingStatus.AVAILABLE)
                .stream()
                .map(this::toListingResponse)
                .toList();
    }

    public List<ListingResponse> getBySeller(ObjectId sellerId) {

        return listingRepository.findBySellerId(sellerId)
                .stream()
                .map(this::toListingResponse)
                .toList();
    }

    public ListingResponse updateListing(ObjectId listingId, ObjectId sellerId, UpdateListingRequest request) {

        Listing listing = getEntityById(listingId);

        validateOwnership(listing, sellerId);

        listingMapper.updateEntity(listing, request);

        validateListing(listing);

        Listing savedListing = listingRepository.save(listing);

        listingCacheService.invalidateListingCaches(listingId.toHexString());

        return toListingResponse(savedListing);
    }

    public ListingResponse markAsSold(ObjectId listingId, ObjectId sellerId) {

        Listing listing = getEntityById(listingId);

        validateOwnership(listing, sellerId);

        listing.setStatus(ListingStatus.SOLD);

        Listing savedListing = listingRepository.save(listing);

        listingCacheService.invalidateListingCaches(listingId.toHexString());

        return toListingResponse(savedListing);
    }

    public Listing getEntityById(ObjectId listingId) {

        return listingRepository.findById(listingId).orElseThrow(() -> new ResourceNotFoundException("Listing not found"));
    }

    private ListingResponse toListingResponse(Listing listing) {

        return listingMapper.toResponse(listing);
    }

    private void validateListing(Listing listing) {

        if (listing.getTitle() == null || listing.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }

        if (listing.getDescription() == null || listing.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }

        if (listing.getSubject() == null || listing.getSubject().isBlank()) {
            throw new IllegalArgumentException("Subject is required");
        }

        if (listing.getCategory() == null) {
            throw new IllegalArgumentException("Category is required");
        }

        if (listing.getType() == null) {
            throw new IllegalArgumentException("Listing type is required");
        }

        if (listing.getPrice() == null || listing.getPrice() < 0) {
            throw new IllegalArgumentException("Price must be zero or greater");
        }

        validateExamSlots(listing);
    }

    private void validateExamSlots(Listing listing) {

        if (listing.getType() == ListingType.SALE) {
            listing.setUnavailableExamSlots(List.of());
        }
    }

    private void validateOwnership(Listing listing, ObjectId sellerId) {

        if (listing.getSellerId() == null || !listing.getSellerId().equals(sellerId)) {

            throw new BadRequestException("You are not the owner of this listing");
        }
    }
    public PaginatedResponse<ListingResponse> getLatestListings(Pageable pageable) {

        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();

        // Redis
        PaginatedResponse<ListingResponse> cached =
                listingCacheService.getLatestListings(page, size);

        if (cached != null) {

            log.info("Latest listings cache HIT: page={}, size={}", page, size);

            return cached;
        }

        log.info("Latest listings cache MISS: page={}, size={}", page, size);

        // MongoDB
        Page<Listing> listingPage = listingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.AVAILABLE, pageable);

        List<ListingResponse> listings =
                listingPage.getContent()
                        .stream()
                        .map(this::toListingResponse)
                        .toList();

        PaginatedResponse<ListingResponse> response =
                new PaginatedResponse<>(
                        listings,
                        listingPage.getNumber(),
                        listingPage.getSize(),
                        listingPage.getTotalElements(),
                        listingPage.getTotalPages(),
                        listingPage.isFirst(),
                        listingPage.isLast()
                );

        // Redis
        listingCacheService.cacheLatestListings(response, latestCacheTtlHours);

        return response;
    }
    public PaginatedResponse<ListingResponse> searchListings(
            String query,
            ListingType type,
            ListingCategory category,
            String sort,
            Pageable pageable) {

        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();

        // Build pagination-aware cache key
        String cacheKey = listingCacheService.buildSearchKey(
                        query,
                        type != null ? type.name() : null,
                        category != null ? category.name() : null,
                        sort,
                        page,
                        size
                );

        // Redis
        PaginatedResponse<ListingResponse> cached = listingCacheService.getSearchResults(cacheKey);

        if (cached != null) {

            log.info("Search cache HIT: page={}, size={}, key={}", page, size, cacheKey);

            return cached;
        }

        log.info("Search cache MISS: page={}, size={}, key={}", page, size, cacheKey);

        // MongoDB
        Page<Listing> listingPage = listingRepository.search(query, type, category, sort, pageable);

        List<ListingResponse> listings =
                listingPage.getContent()
                        .stream()
                        .map(this::toListingResponse)
                        .toList();

        PaginatedResponse<ListingResponse> response =
                new PaginatedResponse<>(
                        listings,
                        listingPage.getNumber(),
                        listingPage.getSize(),
                        listingPage.getTotalElements(),
                        listingPage.getTotalPages(),
                        listingPage.isFirst(),
                        listingPage.isLast()
                );

        // Redis
        listingCacheService.cacheSearchResults(cacheKey, response, searchCacheTtlHours);

        return response;
    }
}