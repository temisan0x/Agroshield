export type VendorProfileData = {
  id?: string;
  businessName?: string;
  bio?: string;
  specialization?: string;
  experienceYears?: number;
  location?: string;
  phone?: string;
  createdAt?: string;
  walletAddress?: string | null; 
};

export type VendorProfilePayload = {
  businessName?: string;
  bio?: string;
  specialization?: string;
  experienceYears?: number;
  location?: string;
  phone?: string;
  walletAddress?: string | null;
};