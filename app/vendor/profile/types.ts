export type VendorProfileData = {
  id?: string;
  businessName?: string;
  bio?: string;
  specialization?: string;
  experienceYears?: number;
  location?: string;
  phone?: string;
  createdAt?: string;
};

export type VendorProfilePayload = {
  businessName?: string;
  bio?: string;
  specialization?: string;
  experienceYears?: number;
  location?: string;
  phone?: string;
};