package com.ecommerce.order.repository;

import com.ecommerce.order.entity.Order;
import com.ecommerce.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

        // ✅ RÉCUPÉRER COMMANDES CLIENT (Explicit Valid Statuses + CANCELLED)
        @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.userId = :userId AND o.status IN (com.ecommerce.order.enums.OrderStatus.CONFIRMED, com.ecommerce.order.enums.OrderStatus.PROCESSING, com.ecommerce.order.enums.OrderStatus.SHIPPED, com.ecommerce.order.enums.OrderStatus.DELIVERED, com.ecommerce.order.enums.OrderStatus.REFUNDED, com.ecommerce.order.enums.OrderStatus.CANCELLED) ORDER BY o.createdAt DESC")
        List<Order> findByUserId(@Param("userId") String userId);

        // ✅ RECHERCHE ADMIN GLOBALE (Explicit Valid Statuses + CANCELLED)
        @Query("SELECT o FROM Order o WHERE o.status IN (com.ecommerce.order.enums.OrderStatus.CONFIRMED, com.ecommerce.order.enums.OrderStatus.PROCESSING, com.ecommerce.order.enums.OrderStatus.SHIPPED, com.ecommerce.order.enums.OrderStatus.DELIVERED, com.ecommerce.order.enums.OrderStatus.REFUNDED, com.ecommerce.order.enums.OrderStatus.CANCELLED) ORDER BY o.createdAt DESC")
        List<Order> findAllValidOrders();

        // ✅ DASHBOARD RECENT (Explicit Valid Statuses + CANCELLED)
        @Query("SELECT o FROM Order o WHERE o.status IN (com.ecommerce.order.enums.OrderStatus.CONFIRMED, com.ecommerce.order.enums.OrderStatus.PROCESSING, com.ecommerce.order.enums.OrderStatus.SHIPPED, com.ecommerce.order.enums.OrderStatus.DELIVERED, com.ecommerce.order.enums.OrderStatus.REFUNDED, com.ecommerce.order.enums.OrderStatus.CANCELLED) ORDER BY o.createdAt DESC")
        org.springframework.data.domain.Page<Order> findRecentValidOrders(
                        org.springframework.data.domain.Pageable pageable);

        // --- MÉTHODES ADMIN (Stats) ---

        // Compter par statut
        long countByStatus(OrderStatus status);

        // Count valid orders (Explicitly IN Valid Statuses)
        // Count valid orders (Explicitly IN Valid Statuses)
        @Query("SELECT COUNT(o) FROM Order o WHERE o.status IN (com.ecommerce.order.enums.OrderStatus.CONFIRMED, com.ecommerce.order.enums.OrderStatus.PROCESSING, com.ecommerce.order.enums.OrderStatus.SHIPPED, com.ecommerce.order.enums.OrderStatus.DELIVERED, com.ecommerce.order.enums.OrderStatus.REFUNDED)")
        long countValidOrders();

        // Somme totale des revenus (Explicitly IN Valid Statuses)
        @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status IN (com.ecommerce.order.enums.OrderStatus.CONFIRMED, com.ecommerce.order.enums.OrderStatus.PROCESSING, com.ecommerce.order.enums.OrderStatus.SHIPPED, com.ecommerce.order.enums.OrderStatus.DELIVERED, com.ecommerce.order.enums.OrderStatus.REFUNDED)")
        BigDecimal sumTotalRevenue();

        // Commandes du mois en cours (Explicit Valid Statuses)
        @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startDate AND o.status IN (com.ecommerce.order.enums.OrderStatus.CONFIRMED, com.ecommerce.order.enums.OrderStatus.PROCESSING, com.ecommerce.order.enums.OrderStatus.SHIPPED, com.ecommerce.order.enums.OrderStatus.DELIVERED, com.ecommerce.order.enums.OrderStatus.REFUNDED)")
        long countOrdersSince(@Param("startDate") LocalDateTime startDate);

        // Revenus du mois en cours (Explicit Valid Statuses)
        @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt >= :startDate AND o.status IN (com.ecommerce.order.enums.OrderStatus.CONFIRMED, com.ecommerce.order.enums.OrderStatus.PROCESSING, com.ecommerce.order.enums.OrderStatus.SHIPPED, com.ecommerce.order.enums.OrderStatus.DELIVERED, com.ecommerce.order.enums.OrderStatus.REFUNDED)")
        BigDecimal sumRevenueSince(@Param("startDate") LocalDateTime startDate);

        // Récupérer les adresses uniques d'un utilisateur
        @Query("SELECT DISTINCT o.shippingAddress FROM Order o WHERE o.userId = :userId")
        List<String> findDistinctShippingAddressesByUserId(@Param("userId") String userId);

        // --- AGGREGATION STATS ---

        @Query("SELECT new com.ecommerce.order.dto.TopProductDto(oi.productId, oi.productName, SUM(oi.quantity), SUM(oi.priceAtPurchase * oi.quantity)) "
                        +
                        "FROM OrderItem oi JOIN oi.order o " +
                        "WHERE o.status IN (com.ecommerce.order.enums.OrderStatus.CONFIRMED, com.ecommerce.order.enums.OrderStatus.PROCESSING, com.ecommerce.order.enums.OrderStatus.SHIPPED, com.ecommerce.order.enums.OrderStatus.DELIVERED, com.ecommerce.order.enums.OrderStatus.REFUNDED) "
                        +
                        "GROUP BY oi.productId, oi.productName " +
                        "ORDER BY SUM(oi.quantity) DESC")
        List<com.ecommerce.order.dto.TopProductDto> findTopSellingProducts(
                        org.springframework.data.domain.Pageable pageable);

        @Query("SELECT new com.ecommerce.order.dto.MonthlyRevenueDto(YEAR(o.createdAt), MONTH(o.createdAt), SUM(o.totalAmount)) "
                        +
                        "FROM Order o " +
                        "WHERE o.status IN (com.ecommerce.order.enums.OrderStatus.CONFIRMED, com.ecommerce.order.enums.OrderStatus.PROCESSING, com.ecommerce.order.enums.OrderStatus.SHIPPED, com.ecommerce.order.enums.OrderStatus.DELIVERED, com.ecommerce.order.enums.OrderStatus.REFUNDED) AND o.createdAt >= :startDate "
                        +
                        "GROUP BY YEAR(o.createdAt), MONTH(o.createdAt) " +
                        "ORDER BY YEAR(o.createdAt) ASC, MONTH(o.createdAt) ASC")
        List<com.ecommerce.order.dto.MonthlyRevenueDto> findMonthlyRevenueSince(
                        @Param("startDate") LocalDateTime startDate);

        @Query("SELECT new com.ecommerce.order.dto.DailyRevenueDto(YEAR(o.createdAt), MONTH(o.createdAt), DAY(o.createdAt), SUM(o.totalAmount)) "
                        +
                        "FROM Order o " +
                        "WHERE o.status IN (com.ecommerce.order.enums.OrderStatus.CONFIRMED, com.ecommerce.order.enums.OrderStatus.PROCESSING, com.ecommerce.order.enums.OrderStatus.SHIPPED, com.ecommerce.order.enums.OrderStatus.DELIVERED, com.ecommerce.order.enums.OrderStatus.REFUNDED) AND o.createdAt BETWEEN :startDate AND :endDate "
                        +
                        "GROUP BY YEAR(o.createdAt), MONTH(o.createdAt), DAY(o.createdAt) " +
                        "ORDER BY YEAR(o.createdAt) ASC, MONTH(o.createdAt) ASC, DAY(o.createdAt) ASC")
        List<com.ecommerce.order.dto.DailyRevenueDto> findDailyRevenueBetween(
                        @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
