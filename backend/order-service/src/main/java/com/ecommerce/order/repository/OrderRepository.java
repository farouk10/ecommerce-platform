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

        // ✅ MÉTHODE MANQUANTE (Pour les clients)
        @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.userId = :userId ORDER BY o.createdAt DESC")
        List<Order> findByUserId(@Param("userId") String userId);

        // --- MÉTHODES ADMIN (Stats) ---

        // Compter par statut
        long countByStatus(OrderStatus status);

        // Somme totale des revenus
        @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o")
        BigDecimal sumTotalRevenue();

        // Commandes du mois en cours
        @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startDate")
        long countOrdersSince(@Param("startDate") LocalDateTime startDate);

        // Revenus du mois en cours
        // Revenus du mois en cours
        @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt >= :startDate")
        BigDecimal sumRevenueSince(@Param("startDate") LocalDateTime startDate);

        // Récupérer les adresses uniques d'un utilisateur
        @Query("SELECT DISTINCT o.shippingAddress FROM Order o WHERE o.userId = :userId")
        List<String> findDistinctShippingAddressesByUserId(@Param("userId") String userId);

        // --- AGGREGATION STATS ---

        @Query("SELECT new com.ecommerce.order.dto.TopProductDto(oi.productId, oi.productName, SUM(oi.quantity), SUM(oi.priceAtPurchase * oi.quantity)) "
                        +
                        "FROM OrderItem oi JOIN oi.order o " +
                        "WHERE o.status != com.ecommerce.order.enums.OrderStatus.CANCELLED " +
                        "GROUP BY oi.productId, oi.productName " +
                        "ORDER BY SUM(oi.quantity) DESC")
        List<com.ecommerce.order.dto.TopProductDto> findTopSellingProducts(
                        org.springframework.data.domain.Pageable pageable);

        @Query("SELECT new com.ecommerce.order.dto.MonthlyRevenueDto(YEAR(o.createdAt), MONTH(o.createdAt), SUM(o.totalAmount)) "
                        +
                        "FROM Order o " +
                        "WHERE o.status != com.ecommerce.order.enums.OrderStatus.CANCELLED AND o.createdAt >= :startDate "
                        +
                        "GROUP BY YEAR(o.createdAt), MONTH(o.createdAt) " +
                        "ORDER BY YEAR(o.createdAt) ASC, MONTH(o.createdAt) ASC")
        List<com.ecommerce.order.dto.MonthlyRevenueDto> findMonthlyRevenueSince(
                        @Param("startDate") LocalDateTime startDate);

        @Query("SELECT new com.ecommerce.order.dto.DailyRevenueDto(YEAR(o.createdAt), MONTH(o.createdAt), DAY(o.createdAt), SUM(o.totalAmount)) "
                        +
                        "FROM Order o " +
                        "WHERE o.status != com.ecommerce.order.enums.OrderStatus.CANCELLED AND o.createdAt BETWEEN :startDate AND :endDate "
                        +
                        "GROUP BY YEAR(o.createdAt), MONTH(o.createdAt), DAY(o.createdAt) " +
                        "ORDER BY YEAR(o.createdAt) ASC, MONTH(o.createdAt) ASC, DAY(o.createdAt) ASC")
        List<com.ecommerce.order.dto.DailyRevenueDto> findDailyRevenueBetween(
                        @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
