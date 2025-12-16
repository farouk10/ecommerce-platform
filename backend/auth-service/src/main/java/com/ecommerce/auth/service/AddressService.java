package com.ecommerce.auth.service;

import com.ecommerce.auth.dto.AddressDto;
import com.ecommerce.auth.entity.Address;
import com.ecommerce.auth.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;

    public List<AddressDto> getUserAddresses(UUID userId) {
        return addressRepository.findAllByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public AddressDto addAddress(UUID userId, AddressDto addressDto) {
        String phoneNumber = addressDto.getPhoneNumber();
        if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
            try {
                PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();
                Phonenumber.PhoneNumber number = phoneUtil.parse(phoneNumber, null);
                if (phoneUtil.isValidNumber(number)) {
                    phoneNumber = phoneUtil.format(number, PhoneNumberUtil.PhoneNumberFormat.E164);
                }
            } catch (NumberParseException e) {
                // Should be caught by validation, but safe to ignore here if already validated
            }
        }

        Address address = Address.builder()
                .userId(userId)
                .fullName(addressDto.getFullName())
                .street(addressDto.getStreet())
                .city(addressDto.getCity())
                .postalCode(addressDto.getPostalCode())
                .country(addressDto.getCountry())
                .phoneNumber(phoneNumber)
                .isDefault(addressDto.isDefault())
                .build();

        // If this is default, unsettle others? (Optional logic, let's keep simple
        // first)

        Address saved = addressRepository.save(address);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteAddress(UUID userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        addressRepository.delete(address);
        addressRepository.delete(address);
    }

    @Transactional
    public AddressDto updateAddress(UUID userId, Long addressId, AddressDto addressDto) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        address.setFullName(addressDto.getFullName());
        address.setStreet(addressDto.getStreet());
        address.setCity(addressDto.getCity());
        address.setPostalCode(addressDto.getPostalCode());
        address.setCountry(addressDto.getCountry());

        // Handle Phone formatting
        String phoneNumber = addressDto.getPhoneNumber();
        if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
            try {
                PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();
                Phonenumber.PhoneNumber number = phoneUtil.parse(phoneNumber, null);
                if (phoneUtil.isValidNumber(number)) {
                    phoneNumber = phoneUtil.format(number, PhoneNumberUtil.PhoneNumberFormat.E164);
                }
            } catch (NumberParseException e) {
                // Ignore
            }
        }
        address.setPhoneNumber(phoneNumber);

        // Handle Default Logic
        if (addressDto.isDefault() && !address.isDefault()) {
            // Unset other defaults for this user
            List<Address> userAddresses = addressRepository.findAllByUserId(userId);
            for (Address addr : userAddresses) {
                if (addr.isDefault()) {
                    addr.setDefault(false);
                    addressRepository.save(addr);
                }
            }
        }
        address.setDefault(addressDto.isDefault());

        Address saved = addressRepository.save(address);
        return mapToDto(saved);
    }

    private AddressDto mapToDto(Address address) {
        return AddressDto.builder()
                .id(address.getId())
                .fullName(address.getFullName())
                .street(address.getStreet())
                .city(address.getCity())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .phoneNumber(address.getPhoneNumber())
                .isDefault(address.isDefault())
                .build();
    }
}
