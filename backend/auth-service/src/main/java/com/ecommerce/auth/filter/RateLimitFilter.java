package com.ecommerce.auth.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final ProxyManager<String> proxyManager;

    @Value("${rate-limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    @Value("${rate-limiting.requests-per-minute:100}")
    private int requestsPerMinute;

    private int getRateLimitForPath(String path) {
        if (path.contains("/auth/login")) {
            return 20; // 20 tentatives de login/min (protection brute force)
        }
        if (path.contains("/auth/register")) {
            return 10; // 10 inscriptions/min (protection spam)
        }
        if (path.contains("/auth/refresh")) {
            return 50; // 50 refresh token/min
        }
        return requestsPerMinute; // Default 100
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!rateLimitingEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String key = "rate_limit:" + clientIp;

        // UNE SEULE déclaration ici
        int limit = getRateLimitForPath(request.getRequestURI());

        Supplier<BucketConfiguration> configSupplier = () -> {
            Refill refill = Refill.intervally(limit, Duration.ofMinutes(1));
            Bandwidth bandwidth = Bandwidth.classic(limit, refill);
            return BucketConfiguration.builder()
                    .addLimit(bandwidth)
                    .build();
        };

        Bucket bucket = proxyManager.builder().build(key, configSupplier);

        if (bucket.tryConsume(1)) {
            long remainingTokens = bucket.getAvailableTokens();
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(remainingTokens));
            response.setHeader("X-Rate-Limit-Limit", String.valueOf(limit));

            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            response.setStatus(429);
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", "60");
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded. Try again in 1 minute.\"}");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

