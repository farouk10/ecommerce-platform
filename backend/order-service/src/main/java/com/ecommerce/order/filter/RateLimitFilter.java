package com.ecommerce.order.filter;

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

    private int getRateLimitForPath(String path, String method) {
        if (path.contains("/orders") && method.equals("POST")) {
            return 30; // 30 commandes/min
        }
        if (path.contains("/orders") && method.equals("GET")) {
            return 100; // 100 lectures/min
        }
        if (path.contains("/orders") && (method.equals("PUT") || method.equals("DELETE"))) {
            return 50; // 50 modifications/min
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
        int limit = getRateLimitForPath(request.getRequestURI(), request.getMethod());

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
