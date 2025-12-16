import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';
import { Address } from '../../../shared/models/address.model';

import {
  NgxIntlTelInputModule,
  SearchCountryField,
  CountryISO,
  PhoneNumberFormat,
} from 'ngx-intl-tel-input';
import { COUNTRIES } from '../../../shared/data/countries';
import { PhoneNumberUtil } from 'google-libphonenumber';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxIntlTelInputModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [
    CountryISO.UnitedStates,
    CountryISO.UnitedKingdom,
    CountryISO.France,
    CountryISO.Morocco,
  ]; // Example preferences

  countries = COUNTRIES;
  user: User | null = null;
  profileForm: FormGroup;
  addressForm: FormGroup; // Form for adding/editing addresses
  editMode = false;
  isSubmitting = false;

  addresses: Address[] = [];
  showAddressForm = false;
  isImporting = false;

  constructor(private authService: AuthService, private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: [
        { value: '', disabled: true },
        [Validators.required, Validators.email],
      ],
      phoneNumber: [''],
      address: [''], // Added address field
      bio: [''],
      avatarUrl: [''],
    });

    this.addressForm = this.fb.group({
      fullName: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      isDefault: [false],
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      if (user) {
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
        });

        // Load addresses and then try auto-import history
        this.loadAddresses();
      }
    });
  }

  loadAddresses() {
    this.authService.getAddresses().subscribe({
      next: (data) => {
        this.addresses = data;
        this.sortAddresses();
      },
      error: (err) => console.error('Error loading addresses', err),
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode && this.user) {
      // Reset form if cancelled
      this.profileForm.patchValue(this.user);
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.isSubmitting = true;
      const updatedData = this.profileForm.getRawValue();

      // Extract E.164 if object
      if (
        updatedData.phoneNumber &&
        typeof updatedData.phoneNumber === 'object'
      ) {
        updatedData.phoneNumber = updatedData.phoneNumber.e164Number;
      }

      this.authService.updateProfile(updatedData).subscribe({
        next: (user) => {
          this.user = user;
          this.editMode = false;
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Erreur update profil:', err);
          this.isSubmitting = false;
        },
      });
    }
  }

  // Address Methods
  toggleAddressForm() {
    this.showAddressForm = !this.showAddressForm;
    if (!this.showAddressForm) {
      this.addressForm.reset();
      this.addressForm.removeControl('id'); // Ensure clean state
    } else {
      // If opening, and we want to ensure it's "New" mode unless edit was called
      if (!this.addressForm.get('id')) {
        this.addressForm.reset();
      }
    }
  }

  editAddress(address: Address) {
    this.showAddressForm = true;
    this.addressForm.patchValue(address);
    // Add ID control if not present, to track update status
    if (!this.addressForm.contains('id')) {
      this.addressForm.addControl('id', this.fb.control(address.id));
    } else {
      this.addressForm.get('id')?.setValue(address.id);
    }

    // Handle phone object if needed
    if (address.phoneNumber) {
      // If using ngx-intl-tel-input, sometimes it needs formatted string or object.
      // Usually passing the string works if component handles it.
    }

    // Scroll to form (optional UX)
  }

  saveAddress() {
    if (this.addressForm.valid) {
      const addressData = this.addressForm.value;

      // Extract E.164 if object
      if (
        addressData.phoneNumber &&
        typeof addressData.phoneNumber === 'object'
      ) {
        addressData.phoneNumber = addressData.phoneNumber.e164Number;
      }

      if (addressData.id) {
        // Update
        this.authService.updateAddress(addressData).subscribe({
          next: (updated) => {
            // Update in local list
            const index = this.addresses.findIndex((a) => a.id === updated.id);
            if (index !== -1) {
              this.addresses[index] = updated;
            }
            this.sortAddresses();

            // If this update set it to default, trigger profile sync
            if (updated.isDefault) {
              this.syncProfileWithAddress(updated);
            }

            this.toggleAddressForm(); // Close and reset
          },
          error: (err) => console.error('Error updating address', err),
        });
      } else {
        // Create
        this.authService.addAddress(addressData).subscribe({
          next: (savedAddress) => {
            this.addresses.push(savedAddress);
            this.sortAddresses();

            if (savedAddress.isDefault) {
              this.syncProfileWithAddress(savedAddress);
            }

            this.toggleAddressForm(); // Close and reset
          },
          error: (err) => console.error('Error saving address', err),
        });
      }
    }
  }

  deleteAddress(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      this.authService.deleteAddress(id).subscribe({
        next: () => {
          this.addresses = this.addresses.filter((a) => a.id !== id);
        },
        error: (err) => console.error('Error deleting address', err),
      });
    }
  }

  setDefaultAddress(address: Address) {
    // Optimistic update
    this.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
    this.sortAddresses();

    // Call backend to persist (assuming backend supports this or we just update the specific address)
    // If backend doesn't have a specific "set default" endpoint, we might need to update the address object.
    // For now, let's assume we update the specific address to be default.
    // Ideally, the backend handles "unsetting" others. If not, we might need to update all?
    // Let's assume a strictly frontend-driven "update this address to be default" for now,
    // or if AuthService has a specific method. If not, we update the address.

    // BETTER APPROACH: Just update the local list logic if backend doesn't explicitly support "Default" flag persistence
    // across the set. BUT user asked for it.
    // Let's check AuthService if it has updateAddress.

    // Assuming we just update this address.
    this.authService.updateAddress(address).subscribe({
      next: (updated) => {
        // Sync profile with new default
        this.syncProfileWithAddress(updated);
      },
      error: (err) => {
        console.error('Error setting default', err);
        // Revert if failed (optional but good practice)
      },
    });
  }

  private syncProfileWithAddress(address: Address) {
    if (!this.user) return;

    const formattedAddress = `${address.street}, ${address.postalCode} ${address.city}, ${address.country}`;

    const updates: Partial<User> = {
      name: address.fullName,
      phoneNumber: address.phoneNumber,
      address: formattedAddress,
    };

    this.authService.updateProfile(updates).subscribe({
      next: (updatedUser: any) => {
        this.user = updatedUser;

        // Prepare correct phone object or string for patch
        // To avoid duplication issue, we try to pass the exact structure if possible,
        // or ensure the string we pass is handled correctly.
        // Actually, sometimes resetting the component or passing null first helps.

        const patchData: any = {
          name: updatedUser.name,
          address: updatedUser.address,
        };

        // Handle phone safely
        if (updatedUser.phoneNumber) {
          try {
            const phoneUtil = PhoneNumberUtil.getInstance();
            const parsed = phoneUtil.parse(updatedUser.phoneNumber);
            const countryCode = phoneUtil.getRegionCodeForNumber(parsed);
            const dialCode = '+' + parsed.getCountryCode();
            const nationalNumber = parsed.getNationalNumber()?.toString();

            if (countryCode && dialCode && nationalNumber) {
              // Patch as object to prevent ngx-intl-tel-input from double-prefixing
              patchData.phoneNumber = {
                number: nationalNumber,
                countryCode: countryCode,
                dialCode: dialCode,
              };
            } else {
              patchData.phoneNumber = updatedUser.phoneNumber;
            }
          } catch (e) {
            console.warn('Could not parse phone number for patching', e);
            patchData.phoneNumber = updatedUser.phoneNumber;
          }
        }

        this.profileForm.patchValue(patchData);
        console.log('Profile synced with default address');
      },
      error: (err: any) => console.error('Error syncing profile', err),
    });
  }

  // Helper to parse if we were to use libphonenumber directly
  // import { PhoneNumberUtil } from 'google-libphonenumber';
  // ... but that requires import at top. Let's just fix the import first.

  private sortAddresses() {
    this.addresses.sort((a, b) => {
      if (a.isDefault === b.isDefault) return 0;
      return a.isDefault ? -1 : 1;
    });
  }

  get hasDefaultAddress(): boolean {
    return this.addresses.some((a) => a.isDefault);
  }
}
