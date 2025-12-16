package com.ecommerce.auth.service;

import com.ecommerce.auth.dto.*;
import com.ecommerce.auth.entity.User;
import com.ecommerce.auth.entity.RevokedToken;
import com.ecommerce.auth.repository.UserRepository;
import com.ecommerce.auth.repository.RevokedTokenRepository;
import com.ecommerce.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RevokedTokenRepository revokedTokenRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Vérifier si l'email existe déjà
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Créer le nouvel utilisateur
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.CUSTOMER)
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        // Générer les tokens
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        // Créer la réponse
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(900000L) // 15 minutes
                .user(convertToUserDto(user))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Trouver l'utilisateur
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // Vérifier le mot de passe
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        log.info("User logged in: {}", user.getEmail());

        // Générer les tokens
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(900000L)
                .user(convertToUserDto(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToUserDto(user);
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToUserDto(user);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();

        // 1. Valider le token
        if (!jwtUtil.validateToken(token)) {
            throw new RuntimeException("Invalid refresh token");
        }

        // 2. Vérifier si le token a été révoqué
        if (revokedTokenRepository.existsByToken(token)) {
            throw new RuntimeException("Refresh token has been revoked");
        }

        // 3. Extraire l'email
        String email = jwtUtil.extractEmail(token);

        // 4. Trouver l'utilisateur
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 5. Révoquer l'ancien refresh token (rotation)
        revokeToken(token, user.getId(), "TOKEN_ROTATION");

        // 6. Générer de nouveaux tokens
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail()); // Rotation du refresh token

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(900000L)
                .user(convertToUserDto(user))
                .build();
    }

    @Transactional
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null)
            user.setName(request.getName());

        if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
            try {
                PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();
                Phonenumber.PhoneNumber number = phoneUtil.parse(request.getPhoneNumber(), null);
                if (phoneUtil.isValidNumber(number)) {
                    user.setPhoneNumber(phoneUtil.format(number, PhoneNumberUtil.PhoneNumberFormat.E164));
                } else {
                    throw new IllegalArgumentException("Invalid phone number");
                }
            } catch (NumberParseException e) {
                throw new IllegalArgumentException("Invalid phone number format: " + e.getMessage());
            }
        } else if (request.getPhoneNumber() != null) {
            // Allow clearing phone number if empty string passed?
            // If field is optional.
            if (request.getPhoneNumber().isEmpty())
                user.setPhoneNumber("");
        }

        if (request.getAddress() != null)
            user.setAddress(request.getAddress());
        if (request.getAvatarUrl() != null)
            user.setAvatarUrl(request.getAvatarUrl());
        if (request.getBio() != null)
            user.setBio(request.getBio());

        user.setUpdatedAt(java.time.LocalDateTime.now());
        user = userRepository.save(user);

        return convertToUserDto(user);
    }

    private final org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String resetToken = jwtUtil.generateResetToken(email);

        com.ecommerce.common.event.PasswordResetEvent event = new com.ecommerce.common.event.PasswordResetEvent(
                user.getEmail(),
                resetToken,
                user.getName());

        kafkaTemplate.send("password-reset-topic", event);
        log.info("Password reset requested for {}. Event published.", email);
    }

    @Transactional
    public void resetPassword(PasswordResetRequest request) {
        if (!jwtUtil.validateToken(request.getToken())) {
            throw new RuntimeException("Invalid or expired reset token");
        }

        String email = jwtUtil.extractEmail(request.getToken());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        log.info("Password successfully reset for {}", email);
    }

    /**
     * Révoquer un refresh token
     */
    @Transactional
    public void revokeToken(String token, UUID userId, String reason) {
        if (token == null || token.isEmpty()) {
            return;
        }

        // Ne révoquer que si pas déjà révoqué
        if (!revokedTokenRepository.existsByToken(token)) {
            RevokedToken revokedToken = RevokedToken.builder()
                    .token(token)
                    .userId(userId)
                    .reason(reason)
                    .build();

            revokedTokenRepository.save(revokedToken);
            log.info("Token revoked for user: {} - Reason: {}", userId, reason);
        }
    }

    /**
     * Déconnexion - Révoquer le refresh token
     */
    @Transactional
    public void logout(String refreshToken, UUID userId) {
        revokeToken(refreshToken, userId, "LOGOUT");
        log.info("User logged out: {}", userId);
    }

    /**
     * Nettoyer les tokens révoqués expirés (à appeler périodiquement)
     */
    @Transactional
    public void cleanupExpiredRevokedTokens() {
        // Supprimer les tokens révoqués il y a plus de 30 jours
        java.time.LocalDateTime cutoffDate = java.time.LocalDateTime.now().minusDays(30);
        revokedTokenRepository.deleteByRevokedAtBefore(cutoffDate);
        log.info("Cleaned up revoked tokens older than {}", cutoffDate);
    }

    private UserDto convertToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .oauthProvider(user.getOauthProvider())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .build();
    }

    /**
     * Déconnexion par email - Récupérer userId depuis la base
     */
    @Transactional
    public void logoutByEmail(String refreshToken, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        logout(refreshToken, user.getId());
    }
}
