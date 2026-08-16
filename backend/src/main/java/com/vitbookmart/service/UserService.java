package com.vitbookmart.service;

import com.vitbookmart.entity.Hostel;
import com.vitbookmart.entity.User;
import com.vitbookmart.entity.enums.UserStatus;
import com.vitbookmart.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User createUser(User user) {

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("User already exists");
        }

        if (user.getStatus() == null) {
            user.setStatus(UserStatus.FREE);
        }

        return userRepository.save(user);
    }

    public User getById(ObjectId userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public User getByGoogleId(String googleId) {
        return userRepository.findByGoogleId(googleId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User updateProfile(
            ObjectId userId,
            String name,
            String whatsappNumber,
            Hostel hostel
    ) {
        User user = getById(userId);

        user.setName(name);
        user.setWhatsappNumber(whatsappNumber);
        user.setHostel(hostel);

        return userRepository.save(user);
    }

    public boolean isProfileComplete(User user) {
        return hasText(user.getName())
                && hasText(user.getEmail())
                && hasText(user.getWhatsappNumber())
                && isValidHostel(user.getHostel());
    }

    public void validateProfileComplete(ObjectId userId) {

        User user = getById(userId);

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

    private boolean isValidHostel(Hostel hostel) {
        return hostel != null
                && hasText(hostel.getType())
                && hasText(hostel.getBlock())
                && hasText(hostel.getRoom());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}