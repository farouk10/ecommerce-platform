package com.ecommerce.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class JwtUtil {

    private final SecretKey key;

    @Value("${jwt.expiration:900000}")
    private Long expiration;

    @Value("${jwt.refresh-expiration:2592000000}")
    private Long refreshExpiration;

    public JwtUtil(@Value("${jwt.secret:mySuperSecretKeyForIntegrationTesting1234567890}") String secret) {
        log.info("🔹 Auth Service Secret: length={}, content='{}...{}'", secret.length(), secret.substring(0, 5),
                secret.substring(secret.length() - 5));
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(UUID userId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId.toString());
        claims.put("email", email);
        claims.put("role", role);

        return createToken(claims, email, expiration);
    }

    public String generateRefreshToken(String email) {
        return createToken(new HashMap<>(), email, refreshExpiration);
    }

    public String generateResetToken(String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "RESET");
        return createToken(claims, email, expiration); // 15 mins
    }

    private String createToken(Map<String, Object> claims, String subject, Long validityPeriod) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + validityPeriod);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key, Jwts.SIG.HS512)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public UUID extractUserId(String token) {
        String userId = (String) extractClaims(token).get("userId");
        return userId != null ? UUID.fromString(userId) : null;
    }

    public String extractRole(String token) {
        return (String) extractClaims(token).get("role");
    }

    public Date extractExpiration(String token) {
        return extractClaims(token).getExpiration();
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException ex) {
            log.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty");
        }
        return false;
    }
}
