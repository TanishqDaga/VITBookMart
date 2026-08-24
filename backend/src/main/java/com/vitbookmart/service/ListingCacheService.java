package com.vitbookmart.service;

import com.vitbookmart.dto.response.ListingDetailResponse;
import com.vitbookmart.dto.response.ListingResponse;
import com.vitbookmart.dto.response.PaginatedResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;

@Slf4j
@Service
public class ListingCacheService {

    private static final String LISTING_KEY_PREFIX = "listing:";

    private static final String LATEST_KEY_PREFIX = "listings:latest:";
    private static final String LATEST_VERSION_KEY = "listings:latest:version";

    private static final String SEARCH_KEY_PREFIX = "listings:search:";
    private static final String SEARCH_VERSION_KEY = "listings:search:version";

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public ListingCacheService(
            RedisTemplate<String, String> redisTemplate,
            ObjectMapper objectMapper) {

        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }


    // Individual Listing

    public ListingDetailResponse getListing(String listingId) {

        String key = LISTING_KEY_PREFIX + listingId;

        String cachedValue = redisTemplate.opsForValue().get(key);

        if (cachedValue == null) {
            return null;
        }

        try {
            return objectMapper.readValue(cachedValue, ListingDetailResponse.class);

        }
        catch (Exception e) {

            log.warn("Invalid listing cache found. Deleting key: {}", key);

            redisTemplate.delete(key);

            return null;
        }
    }

    public void cacheListing(String listingId, ListingDetailResponse response, long ttlHours) {

        String key = LISTING_KEY_PREFIX + listingId;

        try {

            String json = objectMapper.writeValueAsString(response);

            redisTemplate.opsForValue().set(key, json, Duration.ofHours(ttlHours));

        } catch (Exception e) {

            log.error("Failed to cache listing: {}", listingId, e);
        }
    }

    
    // Latest Listings

    public PaginatedResponse<ListingResponse> getLatestListings(int page, int size) {

        String key = buildLatestKey(page, size);

        String cachedValue = redisTemplate.opsForValue().get(key);

        if (cachedValue == null) {
            return null;
        }

        try {

            return objectMapper.readValue(cachedValue, new TypeReference<PaginatedResponse<ListingResponse>>() {});

        } catch (Exception e) {

            log.warn("Invalid latest listings cache. Deleting key: {}", key);

            redisTemplate.delete(key);

            return null;
        }
    }

    public void cacheLatestListings(PaginatedResponse<ListingResponse> response, long ttlHours) {

        int page = response.getPage();
        int size = response.getSize();

        String key = buildLatestKey(page, size);

        try {

            String json = objectMapper.writeValueAsString(response);

            redisTemplate.opsForValue().set(key, json, Duration.ofHours(ttlHours));

        } catch (Exception e) {

            log.error("Failed to cache latest listings: {}", key, e);
        }
    }

    private String buildLatestKey(int page, int size) {

        String version = getLatestVersion();

        return LATEST_KEY_PREFIX
                + version
                + ":"
                + page
                + ":"
                + size;
    }

    private String getLatestVersion() {

        String version = redisTemplate.opsForValue().get(LATEST_VERSION_KEY);

        if (version == null) {

            Boolean created = redisTemplate.opsForValue().setIfAbsent(LATEST_VERSION_KEY, "1");

            if (Boolean.TRUE.equals(created)) {
                return "1";
            }

            version = redisTemplate.opsForValue().get(LATEST_VERSION_KEY);
        }

        return version;
    }

    public void evictLatestListings() {

        Long newVersion = redisTemplate.opsForValue().increment(LATEST_VERSION_KEY);

        log.info("Latest listings cache invalidated. New version: {}", newVersion);
    }


    
    // Search Listings
    

    public PaginatedResponse<ListingResponse> getSearchResults(String cacheKey) {

        String cachedValue = redisTemplate.opsForValue().get(cacheKey);

        if (cachedValue == null) {
            return null;
        }

        try {

            return objectMapper.readValue(cachedValue, new TypeReference<PaginatedResponse<ListingResponse>>() {});

        } catch (Exception e) {

            log.warn("Invalid search cache. Deleting key: {}", cacheKey);

            redisTemplate.delete(cacheKey);

            return null;
        }
    }

    public void cacheSearchResults(
            String cacheKey,
            PaginatedResponse<ListingResponse> response,
            long ttlHours) {

        // Do not cache empty search results
        if (response == null
                || response.getContent() == null
                || response.getContent().isEmpty()) {

            log.debug("Skipping search cache because result is empty: {}", cacheKey);

            return;
        }

        try {

            String json = objectMapper.writeValueAsString(response);

            redisTemplate.opsForValue().set(cacheKey, json, Duration.ofHours(ttlHours));

        } catch (Exception e) {

            log.error("Failed to cache search results: {}", cacheKey, e);
        }
    }


    
    // Search Cache Key
    

    public String buildSearchKey(
            String query,
            String type,
            String category,
            String sort,
            int page,
            int size) {

        String normalizedQuery = normalize(query);
        String normalizedType = normalize(type);
        String normalizedCategory = normalize(category);
        String normalizedSort = normalize(sort);

        String searchParameters =
                normalizedQuery
                        + "|"
                        + normalizedType
                        + "|"
                        + normalizedCategory
                        + "|"
                        + normalizedSort
                        + "|"
                        + page
                        + "|"
                        + size;

        String hash = sha256(searchParameters);

        String version = getSearchVersion();

        return SEARCH_KEY_PREFIX
                + version
                + ":"
                + hash;
    }

    private String normalize(String value) {

        if (value == null || value.isBlank()) {
            return "null";
        }

        return value.trim().toLowerCase();
    }

    private String sha256(String value) {

        try {

            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();

            for (byte b : hash) {

                hex.append(String.format("%02x", b));
            }

            return hex.toString();

        } catch (Exception e) {

            throw new IllegalStateException("Unable to generate search cache key", e);
        }
    }


    
    // Search Cache Version
    

    private String getSearchVersion() {

        String version = redisTemplate.opsForValue().get(SEARCH_VERSION_KEY);

        if (version == null) {

            Boolean created = redisTemplate.opsForValue().setIfAbsent(SEARCH_VERSION_KEY, "1");

            if (Boolean.TRUE.equals(created)) {
                return "1";
            }

            version = redisTemplate.opsForValue().get(SEARCH_VERSION_KEY);
        }

        return version;
    }

    public void invalidateSearchCaches() {

        Long newVersion = redisTemplate.opsForValue().increment(SEARCH_VERSION_KEY);

        log.info("Search cache invalidated. New version: {}", newVersion);
    }


    
    // Complete Listing Cache Invalidation
    

    public void invalidateListingCaches(String listingId) {

        // Individual listing
        evictListing(listingId);

        // Latest listings
        evictLatestListings();

        // Search listings
        invalidateSearchCaches();
    }

    public void evictListing(String listingId) {

        String key = LISTING_KEY_PREFIX + listingId;

        Boolean deleted = redisTemplate.delete(key);

        if (Boolean.TRUE.equals(deleted)) {

            log.info("Deleted listing cache: {}", key);
        }
    }
}