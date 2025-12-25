export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  preferredLanguage: string;
  customerType: CustomerType;
  organizationName?: string;
  contactPerson?: string;
  notes?: string;
  status: CustomerStatus;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  firstOrderDate?: string;
  lastOrderDate?: string;
  referralCode?: string;
  walletBalance?: number;
  addresses?: CustomerAddress[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;

  // Optional detailed profiles
  businessProfile?: BusinessProfile;
  agentDetails?: AgentDetails;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  addressType: AddressType;
  addressLine: string;
  city?: string;
  area?: string;
  buildingNumber?: string;
  floorNumber?: string;
  apartmentNumber?: string;
  additionalDirections?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  streetAddress?: string;
}

export enum CustomerType {
  HOUSEHOLD = 'household',
  BUSINESS = 'business',
  AGENT = 'agent',
  OTHER = 'other'
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other'
}

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus | 'all';
  customerType?: CustomerType | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface CustomersState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  filters: CustomerFilters;
  totalCount: number;
}

// New Interfaces based on database schema

export interface BusinessProfile {
  // id is the same as Customer.id, so not repeated here if fetched as part of Customer
  companyName: string;
  commercialRegistrationNumber?: string;
  businessType?: string; // e.g., 'supplier'
  businessSubtype?: BusinessSubtype;
  taxNumber?: string;
  contactPersonName?: string;
  contactPhone?: string;
  paymentMethod?: string; // e.g., 'cash'
  specialPricing?: Record<string, unknown>; // JSONB
  address?: string;
  documents?: Record<string, unknown>; // JSONB
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum BusinessSubtype {
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  RETAIL_SHOP = 'retail_shop',
  SUPERMARKET = 'supermarket',
  BAKERY = 'bakery',
  CLINIC = 'clinic',
  OTHER = 'other'
}

export interface AgentDetails {
  // id is the same as Customer.id
  storageLocation?: string;
  region?: string;
  areaCovered?: string;
  agentType?: string;
  commissionRate?: number;
  paymentMethod?: string; // e.g., 'commission'
  documents?: Record<string, unknown>; // JSONB
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCollection {
  id: string;
  agentId: string; // FK to Customer.id
  knownCustomerId?: string; // FK to Customer.id
  unknownCustomerName?: string;
  collectionDate: string;
  totalWeight?: number;
  status: string; // e.g., 'pending', 'stored', 'picked_up'
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: AgentCollectionItem[]; // Optional: if you fetch items along with collection
}

export interface AgentCollectionItem {
  id: string;
  collectionId: string; // FK to AgentCollection.id
  wasteType: string; // Consider a WasteType enum or interface
  quantity?: number;
  unit: string; // e.g., 'kg'
  pricePerUnit?: number;
  totalPrice?: number; // Read-only, generated
  createdAt: string;
  updatedAt: string;
}

export interface PickupRequest {
  id: string;
  agentId: string; // FK to Customer.id
  requestedAt: string;
  scheduledAt?: string;
  driverId?: string; // FK to a Driver interface/type if you have one
  status: string; // e.g., 'pending', 'scheduled', 'completed'
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Create Types for New Entities ---

export type CreateCustomerAddress = Omit<CustomerAddress, 'id' | 'customerId' | 'createdAt' | 'updatedAt'> & {
  // Ensure fields with DB defaults that are not explicitly set by user are optional
  addressType?: AddressType; // DB default: 'home'
  isDefault?: boolean;   // DB default: false
  isVerified?: boolean;  // DB default: false
  // Fields that are NOT NULL must be provided if no DB default and not set by backend logic:
  // addressLine: string; // Already required in CustomerAddress
  // latitude: number;    // Already required in CustomerAddress
  // longitude: number;   // Already required in CustomerAddress
};

export type CreateBusinessProfile = Omit<BusinessProfile, 'createdAt' | 'updatedAt' | 'approved'> & {
  // 'approved' has a DB default of false, so it can be optional for creation if we rely on default
  approved?: boolean;
};

export type CreateAgentDetails = Omit<AgentDetails, 'createdAt' | 'updatedAt' | 'approved'> & {
  // 'approved' has a DB default of false
  approved?: boolean;
};

// Centralized type for the payload used when creating a new customer from the UI/frontend
export type CustomerCreationPayload = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'addresses' | 'businessProfile' | 'agentDetails' | 'firstOrderDate' | 'lastOrderDate' | 'referralCode' | 'totalOrders' | 'totalSpent' | 'loyaltyPoints' | 'walletBalance' | 'contactPerson' | 'avatarUrl'> & {
  password?: string;
  addresses?: CreateCustomerAddress[];
  businessProfile?: CreateBusinessProfile;
  agentDetails?: CreateAgentDetails;
};

// It's generally better to keep the main Customer interface clean and use these Create types explicitly 
// where new data is being prepared, rather than modifying Customer to handle creation scenarios directly.

// ... existing code ...
export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  preferredLanguage: string;
  customerType: CustomerType;
  organizationName?: string;
  contactPerson?: string;
  notes?: string;
  status: CustomerStatus;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  firstOrderDate?: string;
  lastOrderDate?: string;
  referralCode?: string;
  walletBalance?: number;
  addresses?: CustomerAddress[]; // For reading/displaying existing full addresses
  tags?: string[];
  createdAt: string;
  updatedAt: string;

  // Optional detailed profiles for reading
  businessProfile?: BusinessProfile;
  agentDetails?: AgentDetails;

  // For creation, the payload will be structured differently
  // We'll use a type like this in the component:
  // CreateCustomerPayload = Omit<Customer, 'id'|'createdAt'|'updatedAt'|'addresses'|'businessProfile'|'agentDetails'> & {
  //   password?: string;
  //   addresses?: CreateCustomerAddress[];
  //   businessProfile?: CreateBusinessProfile;
  //   agentDetails?: CreateAgentDetails;
  // };
}

// ... existing code ...

// Unregistered Customer types
export interface UnregisteredCustomer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  collections?: AgentCollectionWithAgent[];
  // Agent information
  agentId?: string;
  agent?: {
    id: string;
    fullName: string;
  };
  // حقول تتبع الاتصال
  contactStatus?: {
    contacted: boolean;
    sentWhatsApp: boolean;
    sentAppLink: boolean;
    sentVideoLink: boolean;
    notes?: string;
    lastContactDate?: string;
  };
}

export interface AgentCollectionWithAgent {
  id: string;
  agentId: string;
  unregisteredCustomerId: string;
  collectionDate: string;
  totalWeight?: number;
  paymentStatus: string; // 'pending', 'completed', etc.
  paymentMethod: string; // 'cash', etc.
  totalAmount?: number;
  notes?: string;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  createdAt: string;
  updatedAt: string;
  agent?: {
    id: string;
    fullName: string;
    phone?: string;
    profileImageId?: string;
  };
}

export interface UnregisteredCustomersState {
  unregisteredCustomers: UnregisteredCustomer[];
  selectedCustomer: UnregisteredCustomer | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search?: string;
    page: number;
    limit: number;
  };
  totalCount: number;
} 