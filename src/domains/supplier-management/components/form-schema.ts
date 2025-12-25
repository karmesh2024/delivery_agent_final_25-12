import { z } from 'zod';

// Supplier form schema definition
export const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Supplier name is required' }),
  name_ar: z.string().optional(),
  supplier_code: z.string().min(1, { message: 'Supplier code is required' }),
  region_id: z.number().optional(),
  supplier_type_id: z.number({ required_error: 'Supplier type is required' }),
  
  // Contact information
  contact_person: z.string().optional(),
  contact_person_ar: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_phone_secondary: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  
  // Address
  address: z.string().optional(),
  address_ar: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  
  // Business information
  commercial_register: z.string().optional(),
  tax_number: z.string().optional(),
  vat_number: z.string().optional(),
  
  // Rating and status
  rating: z.number().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
  is_approved: z.boolean().default(false),
  product_description: z.string().optional(),
  
  // Form state
  is_valid: z.boolean().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>; 