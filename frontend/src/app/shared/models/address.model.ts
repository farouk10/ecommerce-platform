export interface Address {
  id?: number;
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  isDefault?: boolean;
}
