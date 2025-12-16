package com.ecommerce.product.repository;

import com.ecommerce.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>,
        org.springframework.data.jpa.repository.JpaSpecificationExecutor<Product> {
    Page<Product> findAll(Pageable pageable);

    // Version avec List (sans pagination)
    List<Product> findByCategoryId(Long categoryId);

    // Version avec Page (avec pagination)
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    List<Product> findByNameContainingIgnoreCase(String keyword);

    List<Product> findTop10ByOrderByCreatedAtDesc();
}
