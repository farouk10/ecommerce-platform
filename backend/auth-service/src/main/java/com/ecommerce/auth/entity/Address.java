package com.ecommerce.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.UUID;

@Entity
@Table(name = "addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    private String fullName;
    private String street;
    private String city;
    private String postalCode;
    private String country;
    private String phoneNumber;

    @Builder.Default
    private boolean isDefault = false; // To mark default address

    // Optional: Relationship back to User if we want to enforce FK constraints
    // But since User ID is UUID and might be managed, let's keep it loose or use
    // @ManyToOne if User is in same DB
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @JsonIgnore
    private User user;
}
