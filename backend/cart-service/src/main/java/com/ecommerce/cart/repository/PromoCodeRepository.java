package com.ecommerce.cart.repository;

import com.ecommerce.cart.entity.PromoCode;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PromoCodeRepository extends CrudRepository<PromoCode, String> {
    // Redis auto-implements CRUD methods
}

