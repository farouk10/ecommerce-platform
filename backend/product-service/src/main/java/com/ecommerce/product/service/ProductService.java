package com.ecommerce.product.service;

import com.ecommerce.product.dto.CreateProductRequest;
import com.ecommerce.product.dto.ProductDto;
import com.ecommerce.product.dto.UpdateProductRequest;
import com.ecommerce.product.entity.Category;
import com.ecommerce.product.entity.Product;
import com.ecommerce.product.repository.CategoryRepository;
import com.ecommerce.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    // @Cacheable(value = "products", key = "#pageable.pageNumber + '-' +
    // #pageable.pageSize")
    public Page<ProductDto> getAllProducts(
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String search,
            Pageable pageable) {
        log.info("Fetching products from database (not cached) with filters");

        org.springframework.data.jpa.domain.Specification<Product> spec = com.ecommerce.product.repository.ProductSpecification
                .getProductsByFilter(categoryId, minPrice, maxPrice, search);

        return productRepository.findAll(spec, pageable)
                .map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public long countProducts() {
        return productRepository.count();
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "searchResults", key = "#keyword")
    public List<ProductDto> searchProducts(String keyword) {
        log.info("Searching products for keyword: {} (not cached)", keyword);
        return productRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "productDetails", key = "#id")
    public ProductDto getProductById(Long id) {
        log.info("Fetching product {} from database (not cached)", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        return convertToDto(product);
    }

    @Transactional
    @CacheEvict(value = { "products", "popularProducts", "searchResults" }, allEntries = true)
    public ProductDto createProduct(CreateProductRequest request) {
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .category(category)
                .images(request.getImages())
                .build();

        product = productRepository.save(product);
        log.info("Product created and cache cleared: {}", product.getName());
        return convertToDto(product);
    }

    @Transactional
    @CachePut(value = "productDetails", key = "#id")
    @CacheEvict(value = { "products", "searchResults", "popularProducts" }, allEntries = true)
    public ProductDto updateProduct(Long id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(request.getStockQuantity());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }
        if (request.getImages() != null) {
            product.setImages(request.getImages());
        }

        product = productRepository.save(product);
        log.info("Product updated and cache refreshed: {}", product.getName());
        return convertToDto(product);
    }

    @Transactional
    @CacheEvict(value = { "products", "productDetails", "popularProducts", "searchResults" }, allEntries = true)
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found");
        }
        productRepository.deleteById(id);
        log.info("Product deleted and cache cleared: {}", id);
    }

    @Transactional
    @CachePut(value = "productDetails", key = "#productId")
    public void updateStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        int newStock = product.getStockQuantity() + quantity;
        if (newStock < 0) {
            throw new RuntimeException("Insufficient stock");
        }

        product.setStockQuantity(newStock);
        productRepository.save(product);
        log.info("Stock updated for product {}: new quantity = {}", productId, newStock);
    }

    // Nouvelle méthode: Produits populaires (cachés 30 min)
    @Transactional(readOnly = true)
    @Cacheable(value = "popularProducts")
    public List<ProductDto> getPopularProducts() {
        log.info("Fetching popular products from database (not cached)");
        return productRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void reduceStock(Long productId, Integer quantity) {
        // CORRECTION : Utiliser findById directement pour avoir l'Entité, pas le DTO
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if (product.getStockQuantity() < quantity) {
            throw new IllegalArgumentException("Stock insuffisant pour le produit " + product.getName());
        }

        int newStock = product.getStockQuantity() - quantity;
        product.setStockQuantity(newStock);

        productRepository.save(product);
        log.info("📉 Stock reduced for product {}: {} -> {}", productId, product.getStockQuantity() + quantity,
                newStock);
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByIds(List<Long> ids) {
        return productRepository.findAllById(ids).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private ProductDto convertToDto(Product product) {
        // Safely copy images list while in transaction
        List<String> imagesList = new ArrayList<>();
        try {
            if (product.getImages() != null) {
                imagesList.addAll(product.getImages()); // Force load and copy
            }
        } catch (Exception e) {
            log.warn("Could not load images for product {}: {}", product.getId(), e.getMessage());
        }

        return ProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .images(imagesList) // Use the copied list
                .build();
    }

}
