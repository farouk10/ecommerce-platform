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
}
