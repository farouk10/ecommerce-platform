package com.ecommerce.auth.repository;

import com.ecommerce.auth.entity.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface RevokedTokenRepository extends JpaRepository<RevokedToken, Long> {

    /**
     * Check if a token has been revoked
     */
    boolean existsByToken(String token);

    /**
     * Delete tokens revoked before a certain date (cleanup old entries)
     * Tokens older than refresh token expiration can be safely deleted
     */
    @Modifying
    @Query("DELETE FROM RevokedToken r WHERE r.revokedAt < :date")
    void deleteByRevokedAtBefore(LocalDateTime date);

    /**
     * Revoke all tokens for a specific user (e.g., password change)
     */
    @Query("SELECT COUNT(r) FROM RevokedToken r WHERE r.userId = :userId")
    long countByUserId(UUID userId);
}
