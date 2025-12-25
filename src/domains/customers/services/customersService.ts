import { 
  Customer, 
  CustomerType, 
  CustomerStatus, 
  CustomerFilters, 
  CustomerAddress,
  AddressType,
  BusinessProfile,
  AgentDetails,
  CustomerCreationPayload,
  CreateCustomerAddress,
  CreateBusinessProfile,
  CreateAgentDetails
} from '../types';
import { supabase } from '@/lib/supabase';

// تعريف أنواع البيانات من قاعدة البيانات
interface SupabaseAddress {
  id: string;
  profile_id: string;
  address_type: string;
  address_line: string;
  city: string | null;
  area: string | null;
  building_number: string | null;
  floor_number: string | null;
  apartment_number: string | null;
  additional_directions: string | null;
  landmark: string | null;
  latitude: number;
  longitude: number;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  street_address?: string | null;
  geom?: Record<string, unknown> | null;
}

interface SupabaseProfile {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  avatar_url: string | null;
  preferred_language: string;
  bio?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  notification_preferences?: Record<string, unknown>;
  social_links?: Record<string, unknown>;
  statistics?: {
    rating?: number;
    total_spent?: number;
    total_orders?: number;
    loyalty_points?: number;
    last_order_date?: string | null;
    first_order_date?: string | null;
  };
  points?: number;
  status?: string;
  isaddresscomplete?: boolean;
  created_at: string;
  updated_at: string;
  addresses?: Record<string, unknown> | null;
  phone_numbers?: Record<string, unknown> | null;
  profile_status?: string;
  default_address_id?: string | null;
  customers?: SupabaseCustomer;
}

interface SupabaseCustomer {
  id?: string;
  customer_type?: string;
  customer_status?: string;
  organization_name?: string | null;
  contact_person?: string | null;
  total_orders?: number;
  total_spent?: number | string;
  loyalty_points?: number;
  first_order_date?: string | null;
  last_order_date?: string | null;
  referral_code?: string | null;
  notes?: string | null;
}

// واجهات لبيانات التحديث
interface ProfileUpdateData {
  full_name?: string;
  phone_number?: string;
  email?: string | null;
  preferred_language?: string;
  avatar_url?: string | null;
}

interface CustomerUpdateData {
  full_name?: string;
  phone_number?: string;
  email?: string | null;
  preferred_language?: string;
  customer_type?: string;
  organization_name?: string | null;
  customer_status?: string;
  total_orders?: number;
  total_spent?: number;
  loyalty_points?: number;
  first_order_date?: string | null;
  last_order_date?: string | null;
}

// تحويل قيمة نوع العميل من السلسلة إلى التعداد
const mapCustomerType = (type: string): CustomerType => {
  switch(type?.toLowerCase()) {
    case 'household': return CustomerType.HOUSEHOLD;
    case 'business': return CustomerType.BUSINESS;
    case 'agent': return CustomerType.AGENT;
    default: return CustomerType.OTHER;
  }
};

// تحويل قيمة حالة العميل من السلسلة إلى التعداد
const mapCustomerStatus = (status: string): CustomerStatus => {
  switch(status?.toLowerCase()) {
    case 'active': return CustomerStatus.ACTIVE;
    case 'inactive': return CustomerStatus.INACTIVE;
    case 'blocked': return CustomerStatus.BLOCKED;
    case 'suspended': return CustomerStatus.SUSPENDED;
    default: return CustomerStatus.PENDING;
  }
};

// تحويل قيمة نوع العنوان من السلسلة إلى التعداد
const mapAddressType = (type: string): AddressType => {
  switch(type?.toLowerCase()) {
    case 'home': return AddressType.HOME;
    case 'work': return AddressType.WORK;
    default: return AddressType.OTHER;
  }
};

// دالة تحويل سجل العنوان إلى نموذج العنوان
const mapAddressToCustomerAddress = (address: SupabaseAddress): CustomerAddress => {
  return {
    id: address.id,
    customerId: address.profile_id,
    addressType: mapAddressType(address.address_type),
    addressLine: address.address_line || '',
    city: address.city || undefined,
    area: address.area || undefined,
    buildingNumber: address.building_number || undefined,
    floorNumber: address.floor_number || undefined,
    apartmentNumber: address.apartment_number || undefined,
    additionalDirections: address.additional_directions || undefined,
    landmark: address.landmark || undefined,
    latitude: address.latitude || 0,
    longitude: address.longitude || 0,
    isDefault: address.is_default || false,
    isVerified: address.is_verified || false,
    createdAt: address.created_at || new Date().toISOString(),
    updatedAt: address.updated_at || new Date().toISOString()
  };
};

// دالة للحصول على عناوين العميل
const getCustomerAddresses = async (customerId: string): Promise<CustomerAddress[]> => {
  try {
    const { data, error } = await supabase!
      .from('customer_addresses')
      .select('*')
      .eq('profile_id', customerId);

    if (error) {
      console.error('خطأ في جلب عناوين العميل:', error);
      return [];
    }

    console.log(`تم جلب ${data?.length || 0} عنوان للعميل ${customerId}`);
    
    if (!data) return [];
    
    return data.map(address => mapAddressToCustomerAddress(address as SupabaseAddress));
  } catch (err) {
    console.error('خطأ في جلب عناوين العميل:', err);
    return [];
  }
};

// تحويل بيانات Profile وCustomer من Supabase إلى نموذج Customer
const mapProfileToCustomer = (profile: SupabaseProfile, customerData: SupabaseCustomer): Customer => {
  const status = customerData?.customer_status ? mapCustomerStatus(customerData.customer_status) : CustomerStatus.ACTIVE;
  const customerType = customerData?.customer_type ? mapCustomerType(customerData.customer_type) : CustomerType.HOUSEHOLD;

  return {
    id: profile.id || '',
    fullName: profile.full_name || '',
    phoneNumber: profile.phone_number || '',
    email: profile.email || undefined,
    preferredLanguage: profile.preferred_language || 'ar',
    avatarUrl: profile.avatar_url || undefined,
    customerType,
    status,
    organizationName: customerData?.organization_name || undefined,
    totalOrders: customerData?.total_orders || 0,
    totalSpent: typeof customerData?.total_spent === 'string' ? parseFloat(customerData.total_spent) : (customerData?.total_spent || 0),
    loyaltyPoints: customerData?.loyalty_points || 0,
    firstOrderDate: customerData?.first_order_date || undefined,
    lastOrderDate: customerData?.last_order_date || undefined,
    addresses: [],
    createdAt: profile.created_at || new Date().toISOString(),
    updatedAt: profile.updated_at || new Date().toISOString()
  };
};

// دالة للحصول على قائمة العملاء مع الفلترة
export const getCustomers = async (filters: CustomerFilters) => {
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    status, 
    customerType, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = filters;

  try {
    console.log("بدء استعلام العملاء بالفلاتر:", filters);

    let matchingCustomerIds: string[] = [];
    let hasTypeOrStatusFilter = false;

    if ((customerType && customerType !== 'all') || (status && status !== 'all')) {
      hasTypeOrStatusFilter = true;
      let customerFilterIdsQuery = supabase!
        .from('customers')
        .select('id');
      if (status && status !== 'all') {
        customerFilterIdsQuery = customerFilterIdsQuery.eq('customer_status', status);
        console.log(`تطبيق فلتر الحالة على استعلام IDs: ${status}`);
      }
      if (customerType && customerType !== 'all') {
        customerFilterIdsQuery = customerFilterIdsQuery.eq('customer_type', customerType);
        console.log(`تطبيق فلتر نوع العميل على استعلام IDs: ${customerType}`);
      }
      
      const { data: filteredCustomerIdsData, error: filteredCustomerIdsError } = await customerFilterIdsQuery;

      if (filteredCustomerIdsError) {
        console.error("خطأ في جلب IDs العملاء المفلترة:", filteredCustomerIdsError);
        throw filteredCustomerIdsError;
      }

      matchingCustomerIds = filteredCustomerIdsData?.map(c => c.id) || [];

      if (matchingCustomerIds.length === 0) {
          console.log("لا يوجد عملاء يطابقون فلتر النوع/الحالة المحدد. إرجاع قائمة فارغة.");
          return { customers: [], total: 0, pages: 0 };
      }
      console.log(`IDs العملاء المطابقة لفلتر النوع/الحالة: ${matchingCustomerIds.length}`);
    }
    
    // استعلام من new_profiles مع جميع الفلاتر اللازمة
    let profilesQuery = supabase!
      .from('new_profiles')
      .select('*', { count: 'exact' });

    if (search) {
      profilesQuery = profilesQuery.or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%`);
      console.log(`تطبيق فلتر البحث: ${search}`);
    }
    
    if (hasTypeOrStatusFilter) {
      // If filtering by type/status, and we have matching IDs, apply them.
      // If matchingCustomerIds ended up empty (which is handled by early return), this won't cause issues,
      // but the early return is cleaner.
      profilesQuery = profilesQuery.in('id', matchingCustomerIds);
      console.log(`تطبيق فلتر IDs من جدول customers (${matchingCustomerIds.length} IDs)`);
    }
    
    let sortField = 'created_at';
    if (sortBy === 'name') sortField = 'full_name';
    
    profilesQuery = profilesQuery.order(sortField, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    profilesQuery = profilesQuery.range(from, to);

    console.log("إرسال استعلام Supabase النهائي إلى new_profiles");
    const { data: profilesData, error: profilesError, count: finalProfilesCount } = await profilesQuery;

    if (profilesError) {
      console.error("خطأ في جلب البروفايلات المفلترة:", profilesError);
      throw profilesError;
    }

    const totalFilteredCustomers = finalProfilesCount || 0;

    if (!profilesData || profilesData.length === 0) {
      console.log("لم يتم العثور على بروفايلات مطابقة لجميع الفلاتر.");
      return { customers: [], total: totalFilteredCustomers, pages: Math.ceil(totalFilteredCustomers / limit) };
    }
    
    console.log(`تم جلب ${profilesData.length} بروفايل. العدد الكلي المطابق لكل الفلاتر: ${totalFilteredCustomers}`);

    const profileIdsOnPage = profilesData.map(p => p.id);

    // جلب بيانات العملاء المطابقة للبروفايلات في الصفحة الحالية
    // لا حاجة لتطبيق فلاتر customerType أو status هنا مرة أخرى
    const { data: customersDetailsData, error: customersDetailsError } = await supabase!
      .from('customers')
      .select('*')
      .in('id', profileIdsOnPage);

    if (customersDetailsError) {
      console.error("خطأ في جلب بيانات العملاء للصفحة الحالية:", customersDetailsError);
      throw customersDetailsError;
    }
    
    console.log(`تم جلب ${customersDetailsData?.length || 0} سجل عميل مطابق للبروفايلات في الصفحة.`);

    const customers: Customer[] = [];
    for (const profile of profilesData) {
      const customerDetail = customersDetailsData?.find(c => c.id === profile.id);
      
      // Since profilesQuery was already filtered by matchingCustomerIds (which respects type/status),
      // every profile here should theoretically have a customerDetail if it exists.
      // However, if a profile exists in new_profiles but not customers (data inconsistency),
      // customerDetail could be undefined. This is handled by mapProfileToCustomer.

      const mappedCustomer = mapProfileToCustomer(
        profile as SupabaseProfile, 
        customerDetail as SupabaseCustomer || {} // Provide an empty object if no customerDetail
      );
      
      const addresses = await getCustomerAddresses(profile.id);
      mappedCustomer.addresses = addresses;
      
      customers.push(mappedCustomer);
    }
    
    console.log(`تم بناء ${customers.length} عميل.`);
    console.log("إجمالي عدد العملاء (بعد كل الفلاتر، للترقيم):", totalFilteredCustomers);

    return {
      customers,
      total: totalFilteredCustomers, 
      pages: Math.ceil(totalFilteredCustomers / limit),
    };

  } catch (error) {
    console.error("خطأ عام في getCustomers:", error);
    if (error instanceof Error) {
      console.error("رسالة الخطأ:", error.message);
      console.error("تتبع الخطأ:", error.stack);
    }
    throw error;
  }
};

// دالة للحصول على عميل واحد بواسطة المعرف
const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    // استعلام من جدول new_profiles مع بيانات customer
    const { data: profileAndCustomerData, error: mainError } = await supabase!
      .from('new_profiles') // It seems 'new_profiles' is the main table you query
      .select(`
        id,
        full_name,
        phone_number,
        email,
        avatar_url,
        preferred_language,
        created_at,
        updated_at,
        customers (
          customer_type,
          customer_status,
          organization_name,
          contact_person,
          total_orders,
          total_spent,
          loyalty_points,
          first_order_date,
          last_order_date,
          referral_code,
          notes
        )
      `)
      .eq('id', id)
      .single();

    if (mainError) {
      console.error('خطأ في جلب بيانات العميل الرئيسية:', mainError);
      // throw new Error(mainError.message); // Consider returning null or a specific error object
      return null;
    }

    if (!profileAndCustomerData) {
      console.warn('لم يتم العثور على العميل بالمعرف:', id);
      return null;
    }

    console.log("تم استلام بيانات العميل الرئيسية:", profileAndCustomerData);

    // تحويل البيانات إلى نموذج العميل
    // Supabase types might need adjustment based on actual structure
    const customerBaseData = (profileAndCustomerData.customers as unknown as SupabaseCustomer) || {}; 
    const customer = mapProfileToCustomer(profileAndCustomerData as SupabaseProfile, customerBaseData);
    
    // جلب عناوين العميل
    customer.addresses = await getCustomerAddresses(id);

    // جلب البيانات التفصيلية بناءً على نوع العميل
    if (customer.customerType === CustomerType.BUSINESS) {
      const { data: businessData, error: businessError } = await supabase!
        .from('business_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (businessError) {
        console.error('خطأ في جلب business_profiles:', businessError);
        // Not throwing error here, customer object will just lack businessProfile
      } else if (businessData) {
        // Map Supabase business_profiles to frontend BusinessProfile type
        customer.businessProfile = {
          companyName: businessData.company_name,
          commercialRegistrationNumber: businessData.commercial_registration_number,
          businessType: businessData.business_type,
          businessSubtype: businessData.business_subtype, // Assuming direct mapping or add a mapBusinessSubtype function
          taxNumber: businessData.tax_number,
          contactPersonName: businessData.contact_person_name,
          contactPhone: businessData.contact_phone,
          paymentMethod: businessData.payment_method,
          specialPricing: businessData.special_pricing,
          address: businessData.address,
          documents: businessData.documents,
          approved: businessData.approved,
          createdAt: businessData.created_at,
          updatedAt: businessData.updated_at,
        };
      }
    } else if (customer.customerType === CustomerType.AGENT) {
      const { data: agentData, error: agentError } = await supabase!
        .from('agent_details')
        .select('*')
        .eq('id', id)
        .single();

      if (agentError) {
        console.error('خطأ في جلب agent_details:', agentError);
      } else if (agentData) {
        // Map Supabase agent_details to frontend AgentDetails type
        customer.agentDetails = {
          storageLocation: agentData.storage_location,
          region: agentData.region,
          areaCovered: agentData.area_covered,
          agentType: agentData.agent_type,
          commissionRate: agentData.commission_rate,
          paymentMethod: agentData.payment_method,
          documents: agentData.documents,
          approved: agentData.approved,
          createdAt: agentData.created_at,
          updatedAt: agentData.updated_at,
        };
      }
    }

    return customer;
  } catch (err) {
    console.error("خطأ عام في getCustomerById:", err);
    // throw err; // Consider returning null or a specific error object
    return null;
  }
};

// دالة لإضافة عنوان للعميل
const addCustomerAddress = async (customerId: string, addressData: Omit<CustomerAddress, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>) => {
  try {
    const supabaseAddressData = {
      profile_id: customerId,
      address_type: addressData.addressType.toLowerCase(),
      address_line: addressData.addressLine,
      city: addressData.city || null,
      area: addressData.area || null,
      building_number: addressData.buildingNumber || null,
      floor_number: addressData.floorNumber || null,
      apartment_number: addressData.apartmentNumber || null,
      additional_directions: addressData.additionalDirections || null,
      landmark: addressData.landmark || null,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      is_default: addressData.isDefault,
      is_verified: addressData.isVerified
    };

    const { data, error } = await supabase!
      .from('customer_addresses')
      .insert(supabaseAddressData)
      .select()
      .single();

    if (error) {
      console.error('خطأ في إضافة عنوان العميل:', error);
      throw new Error(error.message);
    }

    return mapAddressToCustomerAddress(data as SupabaseAddress);
  } catch (err) {
    console.error('خطأ في إضافة عنوان العميل:', err);
    throw err;
  }
};

// دالة لحذف عناوين العميل
const deleteCustomerAddresses = async (customerId: string) => {
  try {
    const { error } = await supabase!
      .from('customer_addresses')
      .delete()
      .eq('profile_id', customerId);

    if (error) {
      console.error('خطأ في حذف عناوين العميل:', error);
      throw new Error(error.message);
    }
  } catch (err) {
    console.error('خطأ في حذف عناوين العميل:', err);
    throw err;
  }
};

interface CustomerRecordDbForCreation {
  id: string; // This will be the user.id from auth.users
  user_id: string; // Also user.id
  full_name: string;
  phone_number: string;
  email?: string;
  customer_type: string; // Store as string, map from CustomerType enum
  organization_name?: string;
  contact_person?: string; // Potentially from businessProfile.contactPersonName
  customer_status: string; // Store as string, map from CustomerStatus enum
  preferred_language: string;
  notes?: string;
  tags?: string[]; 
}

// Helper function to add addresses (potentially reusable)
const addCustomerAddressesInternal = async (userId: string, addresses: CreateCustomerAddress[]): Promise<CustomerAddress[]> => {
  if (!addresses || addresses.length === 0) return [];

  const mappedAddresses = [];
  for (const addr of addresses) {
    const { data: newAddressData, error: addressError } = await supabase!
      .from('customer_addresses')
      .insert({
        profile_id: userId, // Link to new_profiles.id which is user.id
        address_type: addr.addressType || 'home',
        address_line: addr.addressLine,
        city: addr.city,
        area: addr.area,
        building_number: addr.buildingNumber,
        floor_number: addr.floorNumber,
        apartment_number: addr.apartmentNumber,
        additional_directions: addr.additionalDirections,
        landmark: addr.landmark,
        latitude: addr.latitude,
        longitude: addr.longitude,
        is_default: addr.isDefault || false,
        is_verified: addr.isVerified || false, // Or handle verification flow separately
        street_address: addr.streetAddress
      })
      .select()
      .single();

    if (addressError) {
      console.error('Error creating address:', addressError);
      // Decide if one address error should fail the whole customer creation
      throw new Error(`Failed to create address: ${addressError.message}`);
    }
    if (newAddressData) {
      mappedAddresses.push(mapAddressToCustomerAddress(newAddressData as SupabaseAddress));
    }
  }
  return mappedAddresses;
};

export const createCustomer = async (
  customerData: CustomerCreationPayload
): Promise<Customer | null> => {
  const { 
    fullName, 
    phoneNumber, 
    password, 
    email, 
    preferredLanguage = 'ar', 
    customerType, 
    status = CustomerStatus.ACTIVE, 
    organizationName,
    notes,
    tags,
    addresses: newAddresses, 
    businessProfile: newBusinessProfile, 
    agentDetails: newAgentDetails 
  } = customerData;

  if (!password) {
    throw new Error('Password is required to create a new user.');
  }

  // Step 1: Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase!
    .auth.signUp({
      phone: phoneNumber,
      password: password,
      options: {
        data: {
          full_name: fullName,
          // We can add more metadata here if needed by auth triggers/functions
        },
      },
    });

  if (authError) {
    console.error("Error creating user in auth:", authError);
    throw new Error(authError.message || "Error during sign up in auth");
  }

  if (!authData.user) {
    throw new Error("User not created in auth, but no error was thrown.");
  }
  const userId = authData.user.id;

  // Step 2: Create customer record in 'customers' table.
  // The trigger 'new_customer_profile_trigger' will then create the corresponding 'new_profiles' record.
  const customerRecordForDb: CustomerRecordDbForCreation = {
    id: userId, // Primary key for customers table
    user_id: userId, // Foreign key to auth.users
    full_name: fullName,
    phone_number: phoneNumber,
    email: email || undefined,
    customer_type: customerType as string, // Ensure this matches DB enum/values
    organization_name: customerType === CustomerType.BUSINESS ? (newBusinessProfile?.companyName || organizationName) : organizationName,
    contact_person: customerType === CustomerType.BUSINESS ? newBusinessProfile?.contactPersonName : undefined,
    customer_status: status as string, // Ensure this matches DB enum/values
    preferred_language: preferredLanguage,
    notes: notes,
    tags: tags,
  };

  const { data: createdCustomerRow, error: customerTableError } = await supabase!
    .from('customers')
    .insert(customerRecordForDb)
    .select()
    .single();

  if (customerTableError) {
    console.error('Error inserting into customers table:', customerTableError);
    // Potentially try to delete the auth user if this fails to prevent orphans
    // await supabase.auth.admin.deleteUser(userId); // Requires admin privileges
    throw new Error(`Failed to create customer record: ${customerTableError.message}`);
  }

  if (!createdCustomerRow) {
    throw new Error('Customer record not created, but no error was thrown.');
  }
  
  // At this point, the new_profiles record should have been created by the trigger.
  // We can fetch it to get all profile details if necessary, or rely on the trigger doing its job.
  // For now, we assume the trigger works and we have the basic customer from createdCustomerRow.

  let createdAddresses: CustomerAddress[] = [];
  if (newAddresses && newAddresses.length > 0) {
    try {
      createdAddresses = await addCustomerAddressesInternal(userId, newAddresses);
    } catch (error) {
      // Handle or re-throw error from address creation
      console.error("Address creation failed during customer creation:", error);
      // Decide on cleanup strategy: delete customer & auth user?
      throw error; 
    }
  }

  // Step 3b: Create Business Profile if applicable
  let createdBusinessProfile: BusinessProfile | undefined = undefined;
  if (customerType === CustomerType.BUSINESS && newBusinessProfile) {
    const { data: bpData, error: bpError } = await supabase!
      .from('business_profiles')
      .insert({
        id: userId, // Links to customers.id
        company_name: newBusinessProfile.companyName,
        commercial_registration_number: newBusinessProfile.commercialRegistrationNumber,
        business_type: newBusinessProfile.businessType,
        business_subtype: newBusinessProfile.businessSubtype,
        tax_number: newBusinessProfile.taxNumber,
        contact_person_name: newBusinessProfile.contactPersonName,
        contact_phone: newBusinessProfile.contactPhone,
        payment_method: newBusinessProfile.paymentMethod,
        special_pricing: newBusinessProfile.specialPricing || {},
        address: newBusinessProfile.address,
        documents: newBusinessProfile.documents || {},
        approved: newBusinessProfile.approved === undefined ? false : newBusinessProfile.approved,
      })
      .select()
      .single();

    if (bpError) {
      console.error('Error creating business profile:', bpError);
      throw new Error(`Failed to create business profile: ${bpError.message}`);
    }
    // We need to map bpData to BusinessProfile type if the structure differs or for consistency
    if (bpData) {
        createdBusinessProfile = {
            companyName: bpData.company_name,
            commercialRegistrationNumber: bpData.commercial_registration_number,
            businessType: bpData.business_type,
            businessSubtype: bpData.business_subtype, // Assuming type matches
            taxNumber: bpData.tax_number,
            contactPersonName: bpData.contact_person_name,
            contactPhone: bpData.contact_phone,
            paymentMethod: bpData.payment_method,
            specialPricing: bpData.special_pricing,
            address: bpData.address,
            documents: bpData.documents,
            approved: bpData.approved,
            createdAt: bpData.created_at, // from DB
            updatedAt: bpData.updated_at, // from DB
        };
    }
  }

  // Step 3c: Create Agent Details if applicable
  let createdAgentDetails: AgentDetails | undefined = undefined;
  if (customerType === CustomerType.AGENT && newAgentDetails) {
    const { data: adData, error: adError } = await supabase!
      .from('agent_details')
      .insert({
        id: userId, // Links to customers.id
        storage_location: newAgentDetails.storageLocation,
        region: newAgentDetails.region,
        area_covered: newAgentDetails.areaCovered,
        agent_type: newAgentDetails.agentType,
        commission_rate: newAgentDetails.commissionRate,
        payment_method: newAgentDetails.paymentMethod,
        documents: newAgentDetails.documents || {},
        approved: newAgentDetails.approved === undefined ? false : newAgentDetails.approved,
      })
      .select()
      .single();
    
    if (adError) {
      console.error('Error creating agent details:', adError);
      throw new Error(`Failed to create agent details: ${adError.message}`);
    }
    // Map adData to AgentDetails type
    if (adData) {
        createdAgentDetails = {
            storageLocation: adData.storage_location,
            region: adData.region,
            areaCovered: adData.area_covered,
            agentType: adData.agent_type,
            commissionRate: adData.commission_rate,
            paymentMethod: adData.payment_method,
            documents: adData.documents,
            approved: adData.approved,
            createdAt: adData.created_at,
            updatedAt: adData.updated_at,
        };
    }
  }

  // Step 4: Fetch the complete new_profile data created by the trigger
  // and combine with customer table data and other created sub-entities.
  const { data: finalProfileData, error: profileError } = await supabase!
    .from('new_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !finalProfileData) {
    console.error('Error fetching created profile or profile not found:', profileError);
    // This is problematic as the core profile is missing. 
    // Return what we have or throw a more specific error.
    // For now, we'll try to construct Customer with what we have from 'customers' table if profile is missing.
    // However, a robust solution might involve a transaction or more complex cleanup.
    console.warn(`Could not fetch new_profiles for user ${userId}. Fallback to customers table data.`);
    return {
        id: userId,
        fullName: createdCustomerRow.full_name || fullName,
        phoneNumber: createdCustomerRow.phone_number || phoneNumber,
        email: createdCustomerRow.email || email,
        preferredLanguage: createdCustomerRow.preferred_language || preferredLanguage,
        customerType: mapCustomerType(createdCustomerRow.customer_type || customerType as string),
        status: mapCustomerStatus(createdCustomerRow.customer_status || status as string),
        organizationName: createdCustomerRow.organization_name || organizationName,
        notes: createdCustomerRow.notes || notes,
        tags: createdCustomerRow.tags || tags || [],
        totalOrders: 0, // Default for new customer
        totalSpent: 0,  // Default for new customer
        loyaltyPoints: 0, // Default for new customer
        createdAt: createdCustomerRow.created_at || new Date().toISOString(), 
        updatedAt: createdCustomerRow.updated_at || new Date().toISOString(),
        addresses: createdAddresses,
        businessProfile: createdBusinessProfile,
        agentDetails: createdAgentDetails,
        // other fields from Customer type that might be missing from customerRecordForDb
        avatarUrl: undefined, 
        contactPerson: createdCustomerRow.contact_person || undefined,
        firstOrderDate: undefined,
        lastOrderDate: undefined,
        referralCode: undefined,
        walletBalance: 0,
    } as Customer;
  }
  
  // Construct the final Customer object
  const finalCustomer: Customer = {
    id: finalProfileData.id,
    fullName: finalProfileData.full_name || fullName,
    phoneNumber: finalProfileData.phone_number || phoneNumber,
    email: finalProfileData.email || email,
    avatarUrl: finalProfileData.avatar_url || undefined,
    preferredLanguage: finalProfileData.preferred_language || preferredLanguage,
    customerType: mapCustomerType(createdCustomerRow.customer_type || customerType as string), // from customers table
    organizationName: createdCustomerRow.organization_name || organizationName, // from customers table
    contactPerson: createdCustomerRow.contact_person || undefined, // from customers table
    status: mapCustomerStatus(createdCustomerRow.customer_status || status as string), // from customers table
    notes: createdCustomerRow.notes || notes, // from customers table
    tags: createdCustomerRow.tags || tags || [], // from customers table
    // Statistics and other fields often come from new_profiles or computed
    totalOrders: finalProfileData.statistics?.total_orders ?? 0,
    totalSpent: finalProfileData.statistics?.total_spent ?? 0,
    loyaltyPoints: finalProfileData.statistics?.loyalty_points ?? finalProfileData.points ?? 0,
    firstOrderDate: finalProfileData.statistics?.first_order_date ?? undefined,
    lastOrderDate: finalProfileData.statistics?.last_order_date ?? undefined,
    referralCode: createdCustomerRow.referral_code || undefined, // from customers table
    walletBalance: 0, // Assuming wallet might be separate or default to 0
    addresses: createdAddresses, // From Step 3a
    createdAt: finalProfileData.created_at || new Date().toISOString(),
    updatedAt: finalProfileData.updated_at || new Date().toISOString(),
    businessProfile: createdBusinessProfile, // From Step 3b
    agentDetails: createdAgentDetails,     // From Step 3c
  };

  return finalCustomer;
};

// دالة لتحديث بيانات العميل
const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer | null> => {
  try {
    // الخطوة 0: جلب الحالة الحالية للعميل لتحديد النوع الحالي
    const existingCustomerState = await getCustomerById(id);
    if (!existingCustomerState) {
      console.error('لا يمكن تحديث العميل: العميل غير موجود بالمعرف', id);
      throw new Error('Customer not found for update');
    }
    const oldCustomerType = existingCustomerState.customerType;

    // تحديث new_profiles أولاً (البيانات الأساسية للملف الشخصي)
    const profileUpdatePayload: ProfileUpdateData = {};
    if (customerData.fullName !== undefined) profileUpdatePayload.full_name = customerData.fullName;
    if (customerData.phoneNumber !== undefined) profileUpdatePayload.phone_number = customerData.phoneNumber;
    if (customerData.email !== undefined) profileUpdatePayload.email = customerData.email;
    if (customerData.preferredLanguage !== undefined) profileUpdatePayload.preferred_language = customerData.preferredLanguage;
    if (customerData.avatarUrl !== undefined) profileUpdatePayload.avatar_url = customerData.avatarUrl;

    if (Object.keys(profileUpdatePayload).length > 0) {
      const { error: profileError } = await supabase!
        .from('new_profiles')
        .update(profileUpdatePayload)
        .eq('id', id);
      if (profileError) {
        console.error('خطأ في تحديث ملف العميل (new_profiles):', profileError);
        throw new Error(profileError.message);
      }
    }
    
    // ثم تحديث جدول customers (بيانات دور العميل)
    const customerUpdatePayload: Partial<SupabaseCustomer> = {}; // Using SupabaseCustomer for direct field names
    if (customerData.customerType !== undefined) customerUpdatePayload.customer_type = customerData.customerType.toLowerCase();
    if (customerData.organizationName !== undefined) customerUpdatePayload.organization_name = customerData.organizationName; // Note: This might be better in business_profiles
    if (customerData.status !== undefined) customerUpdatePayload.customer_status = customerData.status.toLowerCase();
    if (customerData.totalOrders !== undefined) customerUpdatePayload.total_orders = customerData.totalOrders;
    if (customerData.totalSpent !== undefined) customerUpdatePayload.total_spent = customerData.totalSpent;
    if (customerData.loyaltyPoints !== undefined) customerUpdatePayload.loyalty_points = customerData.loyaltyPoints;
    if (customerData.firstOrderDate !== undefined) customerUpdatePayload.first_order_date = customerData.firstOrderDate;
    if (customerData.lastOrderDate !== undefined) customerUpdatePayload.last_order_date = customerData.lastOrderDate;
    // Add other customer-specific fields from 'customers' table as needed

    if (Object.keys(customerUpdatePayload).length > 0) {
      const { error: customerError } = await supabase!
        .from('customers')
        .update(customerUpdatePayload)
        .eq('id', id);
      if (customerError) {
        console.error('خطأ في تحديث بيانات العميل (customers):', customerError);
        throw new Error(customerError.message);
      }
    }

    const newCustomerType = customerData.customerType || oldCustomerType;

    // معالجة تغيير نوع العميل: حذف البيانات القديمة إذا تغير النوع
    if (customerData.customerType && customerData.customerType !== oldCustomerType) {
      if (oldCustomerType === CustomerType.BUSINESS) {
        const { error: deleteOldBusinessError } = await supabase!
          .from('business_profiles')
          .delete()
          .eq('id', id);
        if (deleteOldBusinessError) console.warn('فشل في حذف business_profile القديم عند تغيير النوع:', deleteOldBusinessError.message);
      }
      if (oldCustomerType === CustomerType.AGENT) {
        const { error: deleteOldAgentError } = await supabase!
          .from('agent_details')
          .delete()
          .eq('id', id);
        if (deleteOldAgentError) console.warn('فشل في حذف agent_details القديم عند تغيير النوع:', deleteOldAgentError.message);
      }
    }

    // تحديث/إدراج (upsert) البيانات التفصيلية
    if (newCustomerType === CustomerType.BUSINESS && customerData.businessProfile) {
      const bpData = customerData.businessProfile;
      const businessProfileSupabaseData = {
        id: id, // Important for upsert
        company_name: bpData.companyName,
        commercial_registration_number: bpData.commercialRegistrationNumber,
        business_type: bpData.businessType,
        business_subtype: bpData.businessSubtype,
        tax_number: bpData.taxNumber,
        contact_person_name: bpData.contactPersonName,
        contact_phone: bpData.contactPhone,
        payment_method: bpData.paymentMethod,
        special_pricing: bpData.specialPricing,
        address: bpData.address,
        documents: bpData.documents,
        approved: bpData.approved || false,
      };
      const { error: bpError } = await supabase!
        .from('business_profiles')
        .upsert(businessProfileSupabaseData, { onConflict: 'id' });
      if (bpError) {
        console.error('خطأ في تحديث/إدراج business_profile:', bpError);
        throw new Error(bpError.message); // Or handle more gracefully
      }
    } else if (newCustomerType === CustomerType.AGENT && customerData.agentDetails) {
      const adData = customerData.agentDetails;
      const agentDetailsSupabaseData = {
        id: id, // Important for upsert
        storage_location: adData.storageLocation,
        region: adData.region,
        area_covered: adData.areaCovered,
        agent_type: adData.agentType,
        commission_rate: adData.commissionRate,
        payment_method: adData.paymentMethod,
        documents: adData.documents,
        approved: adData.approved || false,
      };
      const { error: adError } = await supabase!
        .from('agent_details')
        .upsert(agentDetailsSupabaseData, { onConflict: 'id' });
      if (adError) {
        console.error('خطأ في تحديث/إدراج agent_details:', adError);
        throw new Error(adError.message); // Or handle more gracefully
      }
    }

    // تحديث العناوين إذا كانت مقدمة (نفس المنطق السابق)
    if (customerData.addresses) {
      await deleteCustomerAddresses(id); // Consider if this is always desired or if addresses should be merged/updated individually
      for (const address of customerData.addresses) {
        await addCustomerAddress(id, address);
      }
    }

    return await getCustomerById(id);
  } catch (err: unknown) {
    console.error('خطأ عام في تحديث بيانات العميل:', err);
    if (err instanceof Error) {
      // console.error(err.message);
      // throw err; // Re-throw if you want the caller to handle it, or return null
    }
    return null;
  }
};

// دالة لحذف عميل
const deleteCustomer = async (id: string) => {
  try {
    // التحقق مما إذا كان للعميل طلبات
    const { data: orders, error: ordersError } = await supabase!
      .from('customer_orders')
      .select('id')
      .eq('customer_id', id)
      .limit(1);

    if (ordersError) {
      console.error('خطأ في التحقق من طلبات العميل:', ordersError);
      throw new Error(ordersError.message);
    }

    // إذا كان للعميل طلبات، لا يمكن حذفه
    if (orders && orders.length > 0) {
      throw new Error('لا يمكن حذف العميل لأن لديه طلبات');
    }

    // حذف عناوين العميل أولاً
    await deleteCustomerAddresses(id);

    // حذف سجل العميل من new_profiles
    // ملاحظة: هذا سيؤدي تلقائيًا إلى حذف السجل من customers بسبب العلاقة CASCADE
    const { error: deleteError } = await supabase!
      .from('new_profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('خطأ في حذف العميل:', deleteError);
      throw new Error(deleteError.message);
    }

    return id;
  } catch (err) {
    console.error('خطأ في حذف العميل:', err);
    throw err;
  }
};

// دالة للحصول على إحصائيات العملاء
const getCustomersStatistics = async () => {
  try {
    // إجمالي العملاء
    const { count: totalCustomers, error: countError } = await supabase!
      .from('new_profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('خطأ في جلب إجمالي العملاء:', countError);
      throw new Error(countError.message);
    }

    // العملاء النشطين
    const { count: activeCustomers, error: activeError } = await supabase!
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('customer_status', 'active');

    if (activeError) {
      console.error('خطأ في جلب العملاء النشطين:', activeError);
      throw new Error(activeError.message);
    }

    // العملاء المحظورين
    const { count: blockedCustomers, error: blockedError } = await supabase!
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('customer_status', 'blocked');

    if (blockedError) {
      console.error('خطأ في جلب العملاء المحظورين:', blockedError);
      throw new Error(blockedError.message);
    }

    // إجمالي الطلبات وإجمالي الإنفاق
    const { data: totals, error: totalsError } = await supabase!
      .from('customers')
      .select('total_orders, total_spent');

    if (totalsError) {
      console.error('خطأ في جلب إجمالي الطلبات والإنفاق:', totalsError);
      throw new Error(totalsError.message);
    }

    let totalOrders = 0;
    let totalSpent = 0;

    if (totals && totals.length > 0) {
      totalOrders = totals.reduce((sum, customer) => sum + (customer.total_orders || 0), 0);
      totalSpent = totals.reduce((sum, customer) => {
        const spent = typeof customer.total_spent === 'string' ? 
          parseFloat(customer.total_spent) : 
          (customer.total_spent || 0);
        return sum + spent;
      }, 0);
    }

    return {
      totalCustomers: totalCustomers || 0,
      activeCustomers: activeCustomers || 0,
      blockedCustomers: blockedCustomers || 0,
      totalOrders,
      totalSpent
    };
  } catch (err) {
    console.error('خطأ في جلب إحصائيات العملاء:', err);
    throw err;
  }
};

// دالة اختبار الاتصال
export async function testSupabaseConnection(): Promise<boolean> {
  console.log("اختبار اتصال Supabase...");
  console.log("عنوان Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("هل مفتاح Supabase مُعرّف:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    // اختبار استعلام بسيط
    const { count, error } = await supabase!
      .from('new_profiles')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('خطأ في اتصال Supabase:', error.message);
      return false;
    }
    
    console.log('اتصال Supabase ناجح. عدد العملاء المتاح:', count);
    return true;
  } catch (err) {
    console.error('فشل اتصال Supabase:', err);
    return false;
  }
}

// دالة لتشخيص مشكلة جلب العملاء
export const diagnoseCustomersIssue = async () => {
  console.log("بدء تشخيص مشكلة جلب العملاء...");
  
  try {
    // التحقق من جدول new_profiles
    console.log("فحص جدول new_profiles...");
    const { data: profilesData, error: profilesError, count: profilesCount } = await supabase!
      .from('new_profiles')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (profilesError) {
      console.error("خطأ في الوصول إلى جدول new_profiles:", profilesError.message);
      console.error("رمز الخطأ:", profilesError.code);
      console.error("التفاصيل:", profilesError);
    } else {
      console.log(`عدد السجلات في جدول new_profiles: ${profilesCount}`);
      if (profilesData && profilesData.length > 0) {
        console.log("أول سجل في new_profiles:", profilesData[0]);
      } else {
        console.log("لا توجد سجلات في جدول new_profiles");
      }
    }
    
    // التحقق من جدول customers
    console.log("فحص جدول customers...");
    const { data: customersData, error: customersError, count: customersCount } = await supabase!
      .from('customers')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (customersError) {
      console.error("خطأ في الوصول إلى جدول customers:", customersError.message);
      console.error("رمز الخطأ:", customersError.code);
      console.error("التفاصيل:", customersError);
    } else {
      console.log(`عدد السجلات في جدول customers: ${customersCount}`);
      if (customersData && customersData.length > 0) {
        console.log("أول سجل في customers:", customersData[0]);
      } else {
        console.log("لا توجد سجلات في جدول customers");
      }
    }
    
    // التحقق من العلاقة بين الجدولين
    if (profilesData && profilesData.length > 0 && customersData && customersData.length > 0) {
      console.log("فحص العلاقة بين new_profiles و customers...");
      const { data: joinData, error: joinError } = await supabase!
        .from('new_profiles')
        .select(`
          *,
          customers (*)
        `)
        .limit(5);
      
      if (joinError) {
        console.error("خطأ في استعلام العلاقة:", joinError.message);
      } else if (joinData && joinData.length > 0) {
        console.log("نتيجة استعلام العلاقة:", joinData[0]);
      } else {
        console.log("لا توجد نتائج لاستعلام العلاقة بين الجدولين");
      }
    }
    
    return "تم الانتهاء من التشخيص، راجع وحدة التحكم للحصول على التفاصيل";
  } catch (err) {
    console.error("خطأ في تشخيص المشكلة:", err);
    return "حدث خطأ أثناء التشخيص";
  }
};

// Ensure all necessary functions are part of the exported service object.
// Note: getCustomerAddresses was defined but not exported; including it if it's meant to be part of the service.
const customersService = {
  getCustomers,
  getCustomerById,
  getCustomerAddresses,
  addCustomerAddress,
  deleteCustomerAddresses,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomersStatistics,
  testSupabaseConnection,
  diagnoseCustomersIssue
};

export default customersService; 