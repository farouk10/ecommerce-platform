package com.ecommerce.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    private Integer totalOrders;
    private BigDecimal totalRevenue;
    private Integer totalProducts;
    private Integer totalUsers;
    private Integer pendingOrders;
    private Integer confirmedOrders;
    private Integer processingOrders;
    private Integer shippedOrders;
    private Integer deliveredOrders;
    private Integer ordersThisMonth;
    private BigDecimal revenueThisMonth;
    private Integer newUsersThisMonth;
}
