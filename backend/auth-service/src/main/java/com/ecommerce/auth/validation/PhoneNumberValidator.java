package com.ecommerce.auth.validation;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {

    @Override
    public boolean isValid(String phoneNumber, ConstraintValidatorContext context) {
        // If null, we consider it valid here to allow @NotNull to handle required
        // checks separately.
        // This is standard Bean Validation behavior (constraints usually pass on null).
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return true;
        }

        PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();
        try {
            // Parse with null region, expecting international format (starting with +)
            Phonenumber.PhoneNumber number = phoneUtil.parse(phoneNumber, null);
            return phoneUtil.isValidNumber(number);
        } catch (NumberParseException e) {
            return false;
        }
    }
}
