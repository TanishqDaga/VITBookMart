package com.vitbookmart.service;

import com.vitbookmart.dto.request.UpdateUserProfileRequest;
import com.vitbookmart.dto.response.UserResponse;
import com.vitbookmart.entity.User;
import com.vitbookmart.entity.enums.UserStatus;
import com.vitbookmart.mapper.UserMapper;
import com.vitbookmart.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public User createUser(User user) {

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("User already exists");
        }

        if (user.getStatus() == null) {
            user.setStatus(UserStatus.FREE);
        }

        return userRepository.save(user);
    }

    public User getEntityById(ObjectId userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));
    }

    public User getEntityByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));
    }

    public User getEntityByGoogleId(String googleId) {
        return userRepository.findByGoogleId(googleId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));
    }

    public UserResponse getById(ObjectId userId) {
        return userMapper.toResponse(getEntityById(userId));
    }

    public UserResponse getByEmail(String email) {
        return userMapper.toResponse(getEntityByEmail(email));
    }

    public List<UserResponse> getAll() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .toList();
    }

    public UserResponse updateProfile(
            ObjectId userId,
            UpdateUserProfileRequest request
    ) {

        User user = getEntityById(userId);

        userMapper.updateEntity(user, request);

        return userMapper.toResponse(
                userRepository.save(user)
        );
    }

    public boolean isProfileComplete(User user) {

        return hasText(user.getName())
                && hasText(user.getEmail())
                && hasText(user.getWhatsappNumber())
                && user.getHostel() != null
                && hasText(user.getHostel().getType())
                && hasText(user.getHostel().getBlock())
                && hasText(user.getHostel().getRoom());
    }

    public void validateProfileComplete(ObjectId userId) {

        User user = getEntityById(userId);

        if (!isProfileComplete(user)) {
            throw new IllegalStateException(
                    "Complete your profile before creating a listing"
            );
        }
    }

    public void delete(ObjectId userId) {

        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found");
        }

        userRepository.deleteById(userId);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}