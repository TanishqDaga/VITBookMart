package com.vitbookmart.controller;

import com.vitbookmart.dto.request.UpdateUserProfileRequest;
import com.vitbookmart.dto.response.UserResponse;
import com.vitbookmart.entity.User;
import com.vitbookmart.service.UserService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;


    // =========================================================
    // GET USER BY ID
    // =========================================================

    /*
     * Public for now.
     *
     * Later, depending on authentication requirements,
     * we can restrict profile information.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable ObjectId userId
    ) {

        return ResponseEntity.ok(
                userService.getById(userId)
        );
    }


    // =========================================================
    // GET USER BY EMAIL
    // =========================================================

    /*
     * Mainly useful for testing before Google authentication.
     *
     * Later this should generally NOT be exposed publicly.
     */
    @GetMapping("/email")
    public ResponseEntity<UserResponse> getUserByEmail(
            @RequestParam String email
    ) {

        return ResponseEntity.ok(
                userService.getByEmail(email)
        );
    }


    // =========================================================
    // GET ALL USERS
    // =========================================================

    /*
     * ADMIN operation.
     *
     * For now no authentication is implemented,
     * so it can be tested directly.
     *
     * Later this endpoint will be protected with ADMIN role.
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {

        return ResponseEntity.ok(
                userService.getAll()
        );
    }


    // =========================================================
    // UPDATE USER PROFILE
    // =========================================================

    /*
     * User can update:
     * - Name
     * - WhatsApp number
     * - Hostel information
     * - Other fields present in UpdateUserProfileRequest
     *
     * Google ID / email should NOT be changed through this endpoint.
     */
    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> updateProfile(
            @PathVariable ObjectId userId,
            @RequestBody UpdateUserProfileRequest request
    ) {

        return ResponseEntity.ok(
                userService.updateProfile(
                        userId,
                        request
                )
        );
    }


    // =========================================================
    // DELETE USER
    // =========================================================

    /*
     * ADMIN operation.
     *
     * Later this endpoint will be protected with ADMIN role.
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable ObjectId userId
    ) {

        userService.delete(userId);

        return ResponseEntity.noContent().build();
    }
}