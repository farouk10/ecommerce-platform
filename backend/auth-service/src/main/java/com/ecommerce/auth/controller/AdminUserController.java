package com.ecommerce.auth.controller;

import com.ecommerce.auth.dto.UserDto;
import com.ecommerce.auth.entity.User;
import com.ecommerce.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;

    @GetMapping
    // @PreAuthorize("hasRole('ADMIN')") // Ensure security config allows this or
    // handles it via Gateway/Filter
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> toggleUserStatus(@PathVariable UUID id, @RequestBody StatusUpdateDto statusUpdate) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setEnabled(statusUpdate.isEnabled());
                    userRepository.save(user);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt().toString())
                .build();
    }

    // Inner DTO for status update
    public static class StatusUpdateDto {
        private boolean enabled;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }
}
